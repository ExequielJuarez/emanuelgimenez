// Frena los intentos de adivinar la clave: 5 intentos fallidos por IP cada 15 minutos.
const VENTANA_MS = 15 * 60 * 1000;
const MAXIMO = 5;
const intentos = new Map(); // ip → { n, desde }

function estado(ip) {
  const e = intentos.get(ip);
  if (!e || Date.now() - e.desde > VENTANA_MS) return { n: 0, desde: Date.now() };
  return e;
}

module.exports = {
  // Middleware: corta si ya se pasó del máximo
  frenar(req, res, next) {
    const e = estado(req.ip);
    if (e.n >= MAXIMO) {
      const minutos = Math.ceil((VENTANA_MS - (Date.now() - e.desde)) / 60000);
      return res.status(429).render("admin/login", {
        titulo: "Ingresar",
        email: req.body?.email || "",
        volver: req.body?.volver || "",
        error: `Demasiados intentos. Probá de nuevo en ${minutos} minuto${minutos === 1 ? "" : "s"}.`,
      });
    }
    next();
  },
  fallo(ip) {
    const e = estado(ip);
    intentos.set(ip, { n: e.n + 1, desde: e.desde });
  },
  exito(ip) {
    intentos.delete(ip);
  },
};
