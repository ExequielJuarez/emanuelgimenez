const fs = require("fs/promises");
const path = require("path");
const { Op } = require("sequelize");
const db = require("../model/database/models");
const { precio, km } = require("../helpers/formato");

const MAX_IMAGENES = 10;
const SIN_FOTO = "/img/sin-foto.svg";
// Carpeta de las fotos que se suben desde el panel
const CARPETA_SUBIDAS = "/img/vehiculos/subidas/";

// Opciones fijas de los formularios y filtros
const MARCAS_FILTRO = ["Toyota", "Volkswagen", "Peugeot", "Fiat", "Ford", "Chevrolet", "Renault"];
const CONDICIONES = ["Usado Seleccionado", "0km"];
const TRANSMISIONES = ["Automática", "Manual"];
const COMBUSTIBLES = ["Nafta", "Diésel", "Híbrido", "Eléctrico", "GNC"];
const SEGMENTOS = ["Hatchback", "Sedán", "SUV", "Pick-up", "Utilitario / Familiar", "Coupé", "Deportivo"];

const conImagenes = {
  include: [{ model: db.VehiculoImagen, as: "imagenes", attributes: ["id", "url", "orden"] }],
  order: [[{ model: db.VehiculoImagen, as: "imagenes" }, "orden", "ASC"]],
};

// Pasa un registro de la base a un objeto simple para las vistas
function aObjeto(v) {
  const o = v.get({ plain: true });
  o.imagenes = (o.imagenes || []).sort((a, b) => a.orden - b.orden || a.id - b.id);
  o.imagen = o.imagenes[0]?.url || SIN_FOTO;
  o.precio = Number(o.precio);
  return o;
}

// Borra del disco una foto subida desde el panel (las del stock inicial no se tocan)
async function borrarArchivo(url) {
  if (!url || !url.startsWith(CARPETA_SUBIDAS)) return;
  try {
    await fs.unlink(path.join(__dirname, "../../public", url));
  } catch {
    /* ya no existía */
  }
}

// Limpia y convierte lo que llega del formulario del panel
function datosDelFormulario(body) {
  const num = (v) => Number(String(v ?? "").replace(/[^\d]/g, "")) || 0;
  return {
    marca: String(body.marca || "").trim(),
    modelo: String(body.modelo || "").trim(),
    anio: num(body.anio),
    segmento: String(body.segmento || "").trim(),
    condicion: CONDICIONES.includes(body.condicion) ? body.condicion : "Usado Seleccionado",
    km: body.condicion === "0km" ? 0 : num(body.km),
    transmision: TRANSMISIONES.includes(body.transmision) ? body.transmision : "Automática",
    combustible: COMBUSTIBLES.includes(body.combustible) ? body.combustible : "Nafta",
    precio: num(body.precio),
    descripcion: String(body.descripcion || "").trim() || null,
    destacado: body.destacado === "1" || body.destacado === "on",
    publicado: body.publicado === "1" || body.publicado === "on",
  };
}

module.exports = {
  MAX_IMAGENES,
  CARPETA_SUBIDAS,
  listas: { CONDICIONES, TRANSMISIONES, COMBUSTIBLES, SEGMENTOS, MARCAS: MARCAS_FILTRO },
  datosDelFormulario,

  // ── Web pública ─────────────────────────────────────────
  // Unidades publicadas: primero las destacadas, después el resto
  async publicados() {
    const lista = await db.Vehiculo.findAll({
      where: { publicado: true },
      ...conImagenes,
      order: [["destacado", "DESC"], ["id", "ASC"], ...conImagenes.order],
    });
    return lista.map(aObjeto);
  },

  // Listas para armar los filtros
  opciones(vehiculos) {
    const marcas = [...new Set([...MARCAS_FILTRO, ...vehiculos.map((v) => v.marca)])];
    const anioActual = Math.max(new Date().getFullYear(), ...vehiculos.map((v) => v.anio));
    const anioMin = Math.min(2019, ...vehiculos.map((v) => v.anio));
    const anios = [];
    for (let a = anioActual; a >= anioMin; a--) anios.push(a);
    return {
      marcas,
      anios,
      ordenes: [
        { valor: "destacados", texto: "Orden: destacados" },
        { valor: "nuevos", texto: "Orden: más nuevos primero" },
        { valor: "precio-asc", texto: "Orden: menor precio" },
        { valor: "precio-desc", texto: "Orden: mayor precio" },
      ],
    };
  },

  // Datos listos para la ficha de cada unidad (la arma el navegador)
  fichas(vehiculos) {
    const fichas = {};
    for (const v of vehiculos) {
      fichas[v.id] = {
        titulo: `${v.marca} ${v.modelo}`,
        etiqueta: `${v.anio} • ${v.condicion}`,
        sub: `${v.segmento} • Unidad verificada`,
        precio: precio(v.precio),
        km: km(v.km),
        transmision: v.transmision,
        combustible: v.combustible,
        descripcion: v.descripcion || "",
        imagenes: v.imagenes.length ? v.imagenes.map((i) => i.url) : [SIN_FOTO],
        motivo: `${v.anio} ${v.marca} ${v.modelo} (${precio(v.precio)})`,
      };
    }
    return fichas;
  },

  // ── Panel ───────────────────────────────────────────────
  async listarAdmin({ q = "", estado = "" } = {}) {
    const where = {};
    const texto = String(q).trim().slice(0, 60);
    if (texto) {
      where[Op.or] = ["marca", "modelo", "segmento"].map((c) => ({ [c]: { [Op.like]: `%${texto}%` } }));
    }
    if (estado === "publicados") where.publicado = true;
    if (estado === "ocultos") where.publicado = false;
    if (estado === "destacados") where.destacado = true;
    const lista = await db.Vehiculo.findAll({
      where,
      ...conImagenes,
      order: [["publicado", "DESC"], ["destacado", "DESC"], ["actualizado_en", "DESC"], ...conImagenes.order],
    });
    return lista.map(aObjeto);
  },

  async porId(id) {
    const v = await db.Vehiculo.findByPk(Number(id) || 0, conImagenes);
    return v ? aObjeto(v) : null;
  },

  async resumen() {
    const [total, publicados, destacados, ocultos] = await Promise.all([
      db.Vehiculo.count(),
      db.Vehiculo.count({ where: { publicado: true } }),
      db.Vehiculo.count({ where: { publicado: true, destacado: true } }),
      db.Vehiculo.count({ where: { publicado: false } }),
    ]);
    const valor = (await db.Vehiculo.sum("precio", { where: { publicado: true } })) || 0;
    return { total, publicados, destacados, ocultos, valor: Number(valor) };
  },

  // archivos: fotos nuevas que subió multer (se agregan al final)
  async crear(datos, archivos = []) {
    return db.sequelize.transaction(async (t) => {
      const v = await db.Vehiculo.create(datos, { transaction: t });
      await db.VehiculoImagen.bulkCreate(
        archivos.map((f, i) => ({ vehiculo_id: v.id, url: CARPETA_SUBIDAS + f.filename, orden: i })),
        { transaction: t }
      );
      return v.id;
    });
  },

  // borrar: ids de fotos a quitar · portada: id de la foto que va primera
  async actualizar(id, datos, archivos = [], { borrar = [], portada = null } = {}) {
    const v = await db.Vehiculo.findByPk(id, conImagenes);
    if (!v) return false;
    const aBorrar = [].concat(borrar).map(Number).filter(Boolean);
    const quitadas = v.imagenes.filter((i) => aBorrar.includes(i.id));

    await db.sequelize.transaction(async (t) => {
      await v.update(datos, { transaction: t });
      if (quitadas.length) await db.VehiculoImagen.destroy({ where: { id: quitadas.map((i) => i.id), vehiculo_id: id }, transaction: t });

      // Nuevo orden: portada elegida primero, después las que quedan y al final las nuevas
      const quedan = v.imagenes.filter((i) => !aBorrar.includes(i.id)).sort((a, b) => a.orden - b.orden || a.id - b.id);
      const p = quedan.findIndex((i) => i.id === Number(portada));
      if (p > 0) quedan.unshift(quedan.splice(p, 1)[0]);
      for (const [i, img] of quedan.entries()) {
        if (img.orden !== i) await img.update({ orden: i }, { transaction: t });
      }
      await db.VehiculoImagen.bulkCreate(
        archivos.map((f, i) => ({ vehiculo_id: id, url: CARPETA_SUBIDAS + f.filename, orden: quedan.length + i })),
        { transaction: t }
      );
    });
    await Promise.all(quitadas.map((i) => borrarArchivo(i.url)));
    return true;
  },

  async cantidadImagenes(id) {
    return db.VehiculoImagen.count({ where: { vehiculo_id: id } });
  },

  // Publicado / destacado con un toque desde la lista
  async alternar(id, campo) {
    if (!["publicado", "destacado"].includes(campo)) return null;
    const v = await db.Vehiculo.findByPk(id);
    if (!v) return null;
    await v.update({ [campo]: !v[campo] });
    return { publicado: v.publicado, destacado: v.destacado };
  },

  async eliminar(id) {
    const v = await db.Vehiculo.findByPk(id, conImagenes);
    if (!v) return false;
    const urls = v.imagenes.map((i) => i.url);
    await v.destroy();
    await Promise.all(urls.map(borrarArchivo));
    return true;
  },

  borrarArchivo,
};
