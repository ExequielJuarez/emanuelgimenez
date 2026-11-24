const usuarioService = require("../services/usuarioService");
const limite = require("../middlewares/limiteLogin");

const RECORDAR_MS = 30 * 24 * 60 * 60 * 1000;

// Solo se permite volver a páginas del panel (evita redirecciones a otros sitios)
const destinoSeguro = (url) => (typeof url === "string" && url.startsWith("/admin") && !url.startsWith("//") ? url : "/admin");

module.exports = {
  // GET /admin/login
  formulario(req, res) {
    res.render("admin/login", { titulo: "Ingresar", email: "", volver: req.query.volver || "", error: null });
  },

  // POST /admin/login
  async ingresar(req, res, next) {
    try {
      const { email, clave, recordar, volver } = req.body;
      const usuario = await usuarioService.autenticar(email, clave);
      if (!usuario) {
        limite.fallo(req.ip);
        return res.status(401).render("admin/login", { titulo: "Ingresar", email: email || "", volver: volver || "", error: "Usuario o clave incorrectos." });
      }
      limite.exito(req.ip);
      // Sesión nueva para evitar fijación de sesión
      req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.usuarioLogueado = usuario;
        if (recordar) req.session.cookie.maxAge = RECORDAR_MS;
        req.session.flash = `¡Hola, ${usuario.nombre}!`;
        req.session.save(() => res.redirect(destinoSeguro(volver)));
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /admin/logout
  salir(req, res) {
    req.session.destroy(() => {
      res.clearCookie("eg.sid");
      res.redirect("/admin/login");
    });
  },

  // POST /admin/clave → cambiar la clave desde el panel
  async cambiarClave(req, res, next) {
    try {
      const { actual, nueva, repetir } = req.body;
      let mensaje;
      if (!nueva || nueva.length < 8) mensaje = "La clave nueva tiene que tener al menos 8 caracteres.";
      else if (nueva !== repetir) mensaje = "Las claves nuevas no coinciden.";
      else if (!(await usuarioService.cambiarClave(req.session.usuarioLogueado.id, actual, nueva))) mensaje = "La clave actual no es correcta.";
      req.session.flash = mensaje || "Clave actualizada.";
      req.session.flashTipo = mensaje ? "error" : "ok";
      res.redirect("/admin/cuenta");
    } catch (error) {
      next(error);
    }
  },
};
