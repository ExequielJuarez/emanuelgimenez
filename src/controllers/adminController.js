const { validationResult } = require("express-validator");
const vehiculoService = require("../services/vehiculoService");
const consultaService = require("../services/consultaService");

// Si el formulario vuelve con errores, se borran las fotos que se acababan de subir
const descartarSubidas = (archivos = []) =>
  Promise.all(archivos.map((f) => vehiculoService.borrarArchivo(vehiculoService.CARPETA_SUBIDAS + f.filename)));

// Muestra el formulario de alta / edición
function verFormulario(res, { vehiculo = null, valores = {}, errores = {}, status = 200 }) {
  res.status(status).render("admin/vehiculo-form", {
    titulo: vehiculo ? `Editar ${vehiculo.marca} ${vehiculo.modelo}` : "Nuevo vehículo",
    seccion: "vehiculos",
    vehiculo,
    v: { condicion: "Usado Seleccionado", transmision: "Automática", combustible: "Nafta", publicado: true, ...vehiculo, ...valores },
    errores,
    listas: vehiculoService.listas,
    maxImagenes: vehiculoService.MAX_IMAGENES,
  });
}

// Junta los errores de express-validator y de las fotos
function erroresDe(req, { fotosTotales }) {
  const errores = {};
  Object.entries(validationResult(req).mapped()).forEach(([k, e]) => (errores[k] = e.msg));
  if (req.errorImagen) errores.imagenes = req.errorImagen;
  else if (fotosTotales > vehiculoService.MAX_IMAGENES) errores.imagenes = `Máximo ${vehiculoService.MAX_IMAGENES} fotos por vehículo`;
  return errores;
}

// Valores del formulario tal como los escribió (para no perderlos si hay errores)
const valoresDe = (body) => ({ ...body, destacado: body.destacado === "1", publicado: body.publicado === "1" });

module.exports = {
  // GET /admin
  async dashboard(req, res, next) {
    try {
      const [stock, consultas, recientes] = await Promise.all([
        vehiculoService.resumen(),
        consultaService.contar(),
        consultaService.recientes(5),
      ]);
      res.render("admin/dashboard", { titulo: "Resumen", seccion: "dashboard", stock, consultas, recientes });
    } catch (error) {
      next(error);
    }
  },

  // ── VEHÍCULOS ───────────────────────────────────────────
  async vehiculos(req, res, next) {
    try {
      const filtros = { q: String(req.query.q || ""), estado: String(req.query.estado || "") };
      const [lista, stock] = await Promise.all([vehiculoService.listarAdmin(filtros), vehiculoService.resumen()]);
      res.render("admin/vehiculos", { titulo: "Vehículos", seccion: "vehiculos", lista, filtros, stock });
    } catch (error) {
      next(error);
    }
  },

  nuevo(req, res) {
    verFormulario(res, {});
  },

  async crear(req, res, next) {
    try {
      const errores = erroresDe(req, { fotosTotales: req.files.length });
      if (Object.keys(errores).length) {
        await descartarSubidas(req.files);
        return verFormulario(res, { valores: valoresDe(req.body), errores, status: 422 });
      }
      const id = await vehiculoService.crear(vehiculoService.datosDelFormulario(req.body), req.files);
      req.session.flash = "Vehículo cargado.";
      res.redirect(req.body.seguir === "1" ? "/admin/vehiculos/nuevo" : `/admin/vehiculos?nuevo=${id}`);
    } catch (error) {
      await descartarSubidas(req.files);
      next(error);
    }
  },

  async editar(req, res, next) {
    try {
      const vehiculo = await vehiculoService.porId(req.params.id);
      if (!vehiculo) return next();
      verFormulario(res, { vehiculo });
    } catch (error) {
      next(error);
    }
  },

  async actualizar(req, res, next) {
    try {
      const vehiculo = await vehiculoService.porId(req.params.id);
      if (!vehiculo) {
        await descartarSubidas(req.files);
        return next();
      }
      const borrar = [].concat(req.body.borrarImagen || []).map(Number);
      const quedan = vehiculo.imagenes.filter((i) => !borrar.includes(i.id)).length;
      const errores = erroresDe(req, { fotosTotales: quedan + req.files.length });
      if (Object.keys(errores).length) {
        await descartarSubidas(req.files);
        return verFormulario(res, { vehiculo, valores: valoresDe(req.body), errores, status: 422 });
      }
      await vehiculoService.actualizar(vehiculo.id, vehiculoService.datosDelFormulario(req.body), req.files, {
        borrar,
        portada: req.body.portada,
      });
      req.session.flash = "Cambios guardados.";
      res.redirect("/admin/vehiculos");
    } catch (error) {
      await descartarSubidas(req.files);
      next(error);
    }
  },

  // PATCH /admin/vehiculos/:id/:campo (publicado | destacado) → JSON
  async alternar(req, res, next) {
    try {
      const r = await vehiculoService.alternar(Number(req.params.id), req.params.campo);
      if (!r) return res.status(404).json({ ok: false, mensaje: "No se encontró el vehículo" });
      res.json({ ok: true, ...r });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req, res, next) {
    try {
      const ok = await vehiculoService.eliminar(Number(req.params.id));
      if (req.accepts(["html", "json"]) === "json") return res.status(ok ? 200 : 404).json({ ok });
      req.session.flash = ok ? "Vehículo eliminado." : "No se encontró el vehículo.";
      res.redirect("/admin/vehiculos");
    } catch (error) {
      next(error);
    }
  },

  // ── CONSULTAS ───────────────────────────────────────────
  async consultas(req, res, next) {
    try {
      const filtros = { estado: String(req.query.estado || ""), q: String(req.query.q || "") };
      const [lista, cuenta] = await Promise.all([consultaService.listar(filtros), consultaService.contar()]);
      res.render("admin/consultas", { titulo: "Consultas", seccion: "consultas", lista, cuenta, filtros, estados: consultaService.ESTADOS });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /admin/consultas/:id → JSON { estado?, nota? }
  async actualizarConsulta(req, res, next) {
    try {
      const c = await consultaService.actualizar(Number(req.params.id), req.body);
      if (!c) return res.status(404).json({ ok: false, mensaje: "No se encontró la consulta" });
      res.json({ ok: true, estado: c.estado, nota: c.nota, nuevas: await consultaService.nuevas() });
    } catch (error) {
      next(error);
    }
  },

  async eliminarConsulta(req, res, next) {
    try {
      const ok = await consultaService.eliminar(Number(req.params.id));
      res.status(ok ? 200 : 404).json({ ok, nuevas: await consultaService.nuevas() });
    } catch (error) {
      next(error);
    }
  },

  // ── MI CUENTA ───────────────────────────────────────────
  cuenta(req, res) {
    res.render("admin/cuenta", { titulo: "Mi cuenta", seccion: "cuenta" });
  },
};
