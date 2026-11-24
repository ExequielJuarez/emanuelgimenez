// Solo deja pasar a administradores con sesión iniciada.
// Si no inició sesión lo manda al login (y después vuelve a donde quería ir).
module.exports = (req, res, next) => {
  const usuario = req.session.usuarioLogueado;
  if (!usuario) {
    if (req.accepts(["html", "json"]) === "json") return res.status(401).json({ ok: false, mensaje: "La sesión expiró. Volvé a ingresar." });
    return res.redirect(`/admin/login?volver=${encodeURIComponent(req.originalUrl)}`);
  }
  res.locals.usuario = usuario;
  next();
};
