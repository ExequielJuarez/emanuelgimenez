const express = require("express");
const router = express.Router();

const inicioController = require("../controllers/inicioController");
const consultaController = require("../controllers/consultaController");
const consultaValidator = require("../validations/consultaValidator");

// ── INICIO (showroom: portada, destacados, stock y vender mi auto) ──
router.get("/", inicioController.inicio);

// Accesos directos a las secciones de la página
router.get("/vehiculos", (req, res) => res.redirect("/#vehiculos-disp"));
router.get("/vender", (req, res) => res.redirect("/#consignaciones"));

// ── CONSULTAS (modal "Consultar con asesor") ─────────────────
router.post("/consultas", consultaValidator, consultaController.crear);

module.exports = router;
