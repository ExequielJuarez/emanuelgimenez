// Subida de fotos con multer (campo "imagenes", varias a la vez).
// Guarda con nombres únicos; solo JPG, PNG o WEBP de hasta 4 MB c/u.
//   subirImagenes          → fotos de un vehículo (public/img/vehiculos/subidas)
//   subirImagenes.clientes → fotos de clientes     (public/img/clientes/subidas)
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const TIPOS = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const MB = 4;

function crearSubida({ carpeta, prefijo, maximo }) {
  const subir = multer({
    storage: multer.diskStorage({
      destination: path.join(__dirname, "../../public", carpeta),
      filename: (req, file, cb) => cb(null, `${prefijo}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${TIPOS[file.mimetype]}`),
    }),
    limits: { fileSize: MB * 1024 * 1024, files: maximo, fields: 60 },
    fileFilter: (req, file, cb) => {
      if (TIPOS[file.mimetype]) return cb(null, true);
      const error = new Error("tipo");
      error.code = "TIPO_INVALIDO";
      cb(error);
    },
  }).array("imagenes", maximo);

  const MENSAJES = {
    LIMIT_FILE_SIZE: `Cada foto puede pesar hasta ${MB} MB`,
    LIMIT_FILE_COUNT: `Podés subir hasta ${maximo} fotos`,
    LIMIT_UNEXPECTED_FILE: `Podés subir hasta ${maximo} fotos`,
    TIPO_INVALIDO: "Las fotos tienen que ser JPG, PNG o WEBP",
  };

  // Envuelve multer para que un error de archivo se muestre como error del formulario
  return (req, res, next) => {
    subir(req, res, (err) => {
      if (err) req.errorImagen = MENSAJES[err.code] || "No se pudieron subir las fotos";
      req.files = req.files || [];
      next();
    });
  };
}

const { MAX_IMAGENES } = require("../services/vehiculoService");
module.exports = crearSubida({ carpeta: "img/vehiculos/subidas", prefijo: "vehiculo", maximo: MAX_IMAGENES });
module.exports.clientes = crearSubida({ carpeta: "img/clientes/subidas", prefijo: "cliente", maximo: 12 });
