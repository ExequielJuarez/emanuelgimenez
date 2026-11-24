const clienteService = require("../services/clienteService");

module.exports = {
  // GET /admin/clientes
  async ver(req, res, next) {
    try {
      res.render("admin/clientes", { titulo: "Clientes", seccion: "clientes", fotos: await clienteService.listar() });
    } catch (error) {
      next(error);
    }
  },

  // POST /admin/clientes → subir una o varias fotos
  async subir(req, res, next) {
    try {
      if (req.errorImagen || !req.files.length) {
        await Promise.all(req.files.map((f) => clienteService.borrarArchivo(clienteService.CARPETA_SUBIDAS + f.filename)));
        req.session.flash = req.errorImagen || "Elegí al menos una foto.";
        req.session.flashTipo = "error";
        return res.redirect("/admin/clientes");
      }
      const n = await clienteService.crear(req.files, req.body.titulo);
      req.session.flash = n === 1 ? "Foto agregada." : `${n} fotos agregadas.`;
      res.redirect("/admin/clientes");
    } catch (error) {
      next(error);
    }
  },

  // PATCH /admin/clientes/:id → { titulo?, publicado? }
  async actualizar(req, res, next) {
    try {
      const datos = {};
      if (typeof req.body.titulo === "string") datos.titulo = req.body.titulo;
      if (typeof req.body.publicado === "boolean") datos.publicado = req.body.publicado;
      const f = await clienteService.actualizar(Number(req.params.id), datos);
      if (!f) return res.status(404).json({ ok: false, mensaje: "No se encontró la foto" });
      res.json({ ok: true, titulo: f.titulo, publicado: f.publicado });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /admin/clientes/:id/mover → { direccion: -1 | 1 }
  async mover(req, res, next) {
    try {
      const ok = await clienteService.mover(Number(req.params.id), Number(req.body.direccion));
      res.status(ok ? 200 : 400).json({ ok });
    } catch (error) {
      next(error);
    }
  },

  async eliminar(req, res, next) {
    try {
      const ok = await clienteService.eliminar(Number(req.params.id));
      res.status(ok ? 200 : 404).json({ ok });
    } catch (error) {
      next(error);
    }
  },
};
