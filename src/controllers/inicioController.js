const vehiculoService = require("../services/vehiculoService");
const clienteService = require("../services/clienteService");

module.exports = {
  async inicio(req, res, next) {
    try {
      // Unidades publicadas desde el panel (primero las destacadas)
      const [vehiculos, clientes] = await Promise.all([vehiculoService.publicados(), clienteService.publicadas()]);
      res.render("inicio", {
        titulo: "Concesionaria Automotor",
        estilo: "inicio",
        script: "inicio",
        destacados: vehiculos.filter((v) => v.destacado),
        vehiculos,
        // Cuántas unidades se ven antes de tocar "Ver todo"
        vistaPrevia: 6,
        opciones: vehiculoService.opciones(vehiculos),
        // Datos para la ficha (modal) que arma el JS del navegador
        fichas: vehiculoService.fichas(vehiculos),
        // Fotos de clientes (sección al final; si no hay, no se muestra)
        clientes,
      });
    } catch (error) {
      next(error);
    }
  },
};
