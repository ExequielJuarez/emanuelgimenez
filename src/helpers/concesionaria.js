// Datos de la concesionaria: se usan en el header, el pie, los botones de WhatsApp y el SEO
const whatsappNumero = "5493815550192";
const nombre = "Emanuel Gimenez Automotores";

module.exports = {
  nombre,
  horarios: "Lun a Vie de 9:00 a 13:00 y 17:00 a 20:30 hs",
  sabados: "Sábados 9:30 a 13:00 hs.",
  pais: "Argentina",
  instagram: "https://www.instagram.com/emanuelgimenez_automotores/",
  whatsappNumero,
  // Arma el link de WhatsApp con un mensaje ya escrito
  whatsapp: (mensaje = `Hola ${nombre}! Quiero consultar con un asesor.`) =>
    `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(mensaje)}`,
};
