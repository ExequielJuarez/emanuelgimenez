// $ 46.900
const precio = (n) => "$ " + Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 });

// 18.500 km
const km = (n) => Number(n).toLocaleString("es-AR") + " km";

// 24 nov 14:30 (para el panel)
const fecha = (f, conHora = true) =>
  new Date(f).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : { year: "numeric" }),
    timeZone: "America/Argentina/Buenos_Aires",
  });

module.exports = { precio, km, fecha };
