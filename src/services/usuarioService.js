const bcrypt = require("bcryptjs");
const db = require("../model/database/models");

// Hash de una clave inventada: se compara igual cuando el email no existe,
// así el tiempo de respuesta no delata qué emails están registrados.
const HASH_FALSO = bcrypt.hashSync("clave-que-no-existe", 10);

module.exports = {
  // Devuelve los datos para la sesión, o null si el email o la clave no coinciden
  async autenticar(email, clave) {
    const usuario = await db.Usuario.findOne({ where: { email: String(email || "").toLowerCase().trim() } });
    const ok = await bcrypt.compare(String(clave || ""), usuario ? usuario.clave : HASH_FALSO);
    if (!usuario || !ok) return null;
    await usuario.update({ ultimo_acceso: new Date() });
    return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
  },

  async cambiarClave(id, actual, nueva) {
    const usuario = await db.Usuario.findByPk(id);
    if (!usuario || !(await bcrypt.compare(String(actual || ""), usuario.clave))) return false;
    await usuario.update({ clave: await bcrypt.hash(nueva, 10) });
    return true;
  },
};
