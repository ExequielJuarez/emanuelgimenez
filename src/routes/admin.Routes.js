const express = require("express");
const router = express.Router();

const soloAdmin = require("../middlewares/soloAdmin");
const soloInvitados = require("../middlewares/soloInvitados");
const limiteLogin = require("../middlewares/limiteLogin");
const subirImagenes = require("../middlewares/subirImagenes");
const vehiculoValidator = require("../validations/vehiculoValidator");
const auth = require("../controllers/authController");
const admin = require("../controllers/adminController");
const clientes = require("../controllers/clientesAdminController");
const consultaService = require("../services/consultaService");

// El panel no se indexa en buscadores ni se guarda en caché
router.use((req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.set("Cache-Control", "no-store");
  next();
});

// ── Ingreso ────────────────────────────────────────────────
router.get("/login", soloInvitados, auth.formulario);
router.post("/login", soloInvitados, limiteLogin.frenar, auth.ingresar);
router.post("/logout", auth.salir);

// Todo lo de abajo requiere haber iniciado sesión
router.use(soloAdmin);

// Consultas sin leer (número en el menú)
router.use(async (req, res, next) => {
  try {
    res.locals.consultasNuevas = await consultaService.nuevas();
    next();
  } catch (error) {
    next(error);
  }
});

router.get("/", admin.dashboard);

// ── Vehículos ──────────────────────────────────────────────
router.get("/vehiculos", admin.vehiculos);
router.get("/vehiculos/nuevo", admin.nuevo);
router.post("/vehiculos", subirImagenes, vehiculoValidator, admin.crear);
router.get("/vehiculos/:id/editar", admin.editar);
router.put("/vehiculos/:id", subirImagenes, vehiculoValidator, admin.actualizar);
router.patch("/vehiculos/:id/:campo", admin.alternar);
router.delete("/vehiculos/:id", admin.eliminar);

// ── Consultas ──────────────────────────────────────────────
router.get("/consultas", admin.consultas);
router.patch("/consultas/:id", admin.actualizarConsulta);
router.delete("/consultas/:id", admin.eliminarConsulta);

// ── Fotos de clientes (sección "Clientes" del inicio) ──────
router.get("/clientes", clientes.ver);
router.post("/clientes", subirImagenes.clientes, clientes.subir);
router.patch("/clientes/:id/mover", clientes.mover);
router.patch("/clientes/:id", clientes.actualizar);
router.delete("/clientes/:id", clientes.eliminar);

// ── Mi cuenta ──────────────────────────────────────────────
router.get("/cuenta", admin.cuenta);
router.post("/clave", auth.cambiarClave);

module.exports = router;
