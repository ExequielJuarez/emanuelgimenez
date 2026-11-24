const { Op } = require("sequelize");
const db = require("../model/database/models");

const ESTADOS = ["nueva", "contactado", "cerrada"];

module.exports = {
  ESTADOS,

  // Guarda la consulta del formulario "Consultar con asesor"
  async crear({ nombre, telefono, mensaje, motivo, vehiculo_id }) {
    const id = Number(vehiculo_id) || null;
    const existe = id ? await db.Vehiculo.count({ where: { id } }) : 0;
    return db.Consulta.create({
      nombre,
      telefono,
      mensaje: mensaje || null,
      motivo,
      vehiculo_id: existe ? id : null,
    });
  },

  async listar({ estado = "", q = "" } = {}) {
    const where = {};
    if (ESTADOS.includes(estado)) where.estado = estado;
    const texto = String(q).trim().slice(0, 60);
    if (texto) where[Op.or] = ["nombre", "telefono", "motivo", "mensaje"].map((c) => ({ [c]: { [Op.like]: `%${texto}%` } }));
    const lista = await db.Consulta.findAll({
      where,
      include: [{ model: db.Vehiculo, as: "vehiculo", attributes: ["id", "marca", "modelo", "anio"] }],
      order: [["creado_en", "DESC"]],
      limit: 300,
    });
    return lista.map((c) => c.get({ plain: true }));
  },

  async recientes(cantidad = 5) {
    return this.listar().then((l) => l.slice(0, cantidad));
  },

  async contar() {
    const filas = await db.Consulta.findAll({
      attributes: ["estado", [db.sequelize.fn("COUNT", db.sequelize.col("id")), "n"]],
      group: ["estado"],
      raw: true,
    });
    const r = { nueva: 0, contactado: 0, cerrada: 0, total: 0 };
    filas.forEach((f) => { r[f.estado] = Number(f.n); r.total += Number(f.n); });
    return r;
  },

  nuevas: () => db.Consulta.count({ where: { estado: "nueva" } }),

  async actualizar(id, { estado, nota }) {
    const c = await db.Consulta.findByPk(id);
    if (!c) return null;
    const cambios = {};
    if (ESTADOS.includes(estado)) cambios.estado = estado;
    if (typeof nota === "string") cambios.nota = nota.trim().slice(0, 500) || null;
    await c.update(cambios);
    return c.get({ plain: true });
  },

  async eliminar(id) {
    return (await db.Consulta.destroy({ where: { id } })) > 0;
  },
};
