// Cambia la clave de un administrador (o lo crea si no existe).
//
//   npm run admin:clave -- usuario NuevaClave123
//   npm run admin:clave -- usuario NuevaClave123 "Nombre"

require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const db = require("../src/model/database/models");

(async () => {
  const [email, clave, nombre] = process.argv.slice(2);
  if (!email || !clave) {
    console.log("Uso: npm run admin:clave -- usuario NuevaClave123 [\"Nombre\"]");
    process.exit(1);
  }
  if (clave.length < 8) {
    console.log("❌ La clave tiene que tener al menos 8 caracteres.");
    process.exit(1);
  }
  try {
    const hash = await bcrypt.hash(clave, 10);
    const correo = email.toLowerCase().trim();
    const usuario = await db.Usuario.findOne({ where: { email: correo } });
    if (usuario) {
      await usuario.update({ clave: hash, ...(nombre ? { nombre } : {}) });
      console.log(`✅ Clave actualizada para ${correo}`);
    } else {
      await db.Usuario.create({ email: correo, clave: hash, nombre: nombre || "Admin", rol: "admin" });
      console.log(`✅ Administrador creado: ${correo}`);
    }
  } catch (error) {
    console.error("❌", error.message);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
})();
