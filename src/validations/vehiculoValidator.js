const { body } = require("express-validator");

const anioMax = () => new Date().getFullYear() + 1;
const numero = (v) => String(v ?? "").replace(/[^\d]/g, "");

module.exports = [
  body("marca").trim().notEmpty().withMessage("Escribí la marca").bail().isLength({ max: 40 }).withMessage("Máximo 40 caracteres"),
  body("modelo").trim().notEmpty().withMessage("Escribí el modelo y la versión").bail().isLength({ max: 100 }).withMessage("Máximo 100 caracteres"),
  body("anio")
    .customSanitizer(numero)
    .notEmpty().withMessage("Poné el año")
    .bail()
    .isInt({ min: 1950, max: anioMax() }).withMessage(`El año tiene que estar entre 1950 y ${anioMax()}`),
  body("segmento").trim().notEmpty().withMessage("Elegí el segmento").bail().isLength({ max: 40 }),
  body("condicion").isIn(["0km", "Usado Seleccionado"]).withMessage("Elegí la condición"),
  body("km")
    .customSanitizer(numero)
    .custom((v, { req }) => req.body.condicion === "0km" || v !== "").withMessage("Poné los kilómetros")
    .bail()
    .custom((v) => v === "" || Number(v) <= 2000000).withMessage("Revisá los kilómetros"),
  body("transmision").isIn(["Automática", "Manual"]).withMessage("Elegí la transmisión"),
  body("combustible").isIn(["Nafta", "Diésel", "Híbrido", "Eléctrico", "GNC"]).withMessage("Elegí el combustible"),
  body("precio")
    .customSanitizer(numero)
    .notEmpty().withMessage("Poné el precio")
    .bail()
    .isInt({ min: 1, max: 9999999999 }).withMessage("Revisá el precio"),
  body("descripcion").optional({ values: "falsy" }).trim().isLength({ max: 2000 }).withMessage("Máximo 2000 caracteres"),
];
