const fs = require("fs");
const path = require("path");
const db = require("../model/database/models");

const PUBLIC = path.join(__dirname, "../../public");
const CARPETA_SUBIDAS = "/img/clientes/subidas/";

// Busca el archivo de la foto. Si se guardó a mano con otra extensión
// (ej: familia-orce.png en vez de .jpg) también la encuentra.
const EXTENSIONES = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"];
function ubicar(url) {
  if (fs.existsSync(path.join(PUBLIC, url))) return url;
  const base = url.replace(/\.[a-z0-9]+$/i, "");
  const otra = EXTENSIONES.map((e) => base + e).find((u) => fs.existsSync(path.join(PUBLIC, u)));
  return otra || null;
}

const plano = (f) => {
  const o = f.get({ plain: true });
  const real = ubicar(o.url);
  return { ...o, url: real || o.url, existe: !!real };
};
const ordenar = [["orden", "ASC"], ["id", "ASC"]];

async function borrarArchivo(url) {
  if (!url || !url.startsWith(CARPETA_SUBIDAS)) return;
  await fs.promises.unlink(path.join(PUBLIC, url)).catch(() => {});
}

module.exports = {
  CARPETA_SUBIDAS,

  // Web: solo las publicadas cuyo archivo existe
  async publicadas() {
    const lista = await db.ClienteFoto.findAll({ where: { publicado: true }, order: ordenar });
    return lista.map(plano).filter((f) => f.existe);
  },

  async listar() {
    return (await db.ClienteFoto.findAll({ order: ordenar })).map(plano);
  },

  // Las nuevas van al final, todas con el mismo título (si se escribió uno)
  async crear(archivos, titulo) {
    const ultimo = (await db.ClienteFoto.max("orden")) ?? -1;
    const nombre = String(titulo || "").trim().slice(0, 80) || null;
    await db.ClienteFoto.bulkCreate(
      archivos.map((f, i) => ({ url: CARPETA_SUBIDAS + f.filename, titulo: nombre, orden: ultimo + 1 + i }))
    );
    return archivos.length;
  },

  async actualizar(id, { titulo, publicado }) {
    const f = await db.ClienteFoto.findByPk(id);
    if (!f) return null;
    const cambios = {};
    if (typeof titulo === "string") cambios.titulo = titulo.trim().slice(0, 80) || null;
    if (typeof publicado === "boolean") cambios.publicado = publicado;
    await f.update(cambios);
    return plano(f);
  },

  // Mueve una foto un lugar (direccion: -1 arriba / 1 abajo)
  async mover(id, direccion) {
    const lista = await db.ClienteFoto.findAll({ order: ordenar });
    const i = lista.findIndex((f) => f.id === id);
    const j = i + (direccion < 0 ? -1 : 1);
    if (i < 0 || j < 0 || j >= lista.length) return false;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    await db.sequelize.transaction(async (t) => {
      for (const [n, f] of lista.entries()) if (f.orden !== n) await f.update({ orden: n }, { transaction: t });
    });
    return true;
  },

  async eliminar(id) {
    const f = await db.ClienteFoto.findByPk(id);
    if (!f) return false;
    await f.destroy();
    await borrarArchivo(f.url);
    return true;
  },

  borrarArchivo,
};
