const { validationResult } = require("express-validator");
const { whatsapp, nombre: concesionaria } = require("../helpers/concesionaria");
const consultaService = require("../services/consultaService");

module.exports = {
  // POST /consultas → formulario "Consultar con asesor"
  // Se guarda en la base (se ve en el panel: /admin/consultas) y se devuelve
  // el link de WhatsApp con el mensaje armado.
  async crear(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(422).json({ ok: false, errores: errores.mapped() });
      }
      const { nombre, telefono, mensaje, motivo, vehiculo_id } = req.body;
      await consultaService.crear({ nombre, telefono, mensaje, motivo, vehiculo_id });
      console.log(`📩 Nueva consulta: ${nombre} (${telefono}) · ${motivo}`);

      const texto = `Hola ${concesionaria}! Soy ${nombre}, quiero consultar con un asesor por: ${motivo}.${mensaje ? " " + mensaje : ""}`;
      res.json({ ok: true, whatsapp: whatsapp(texto) });
    } catch (error) {
      next(error);
    }
  },
};
