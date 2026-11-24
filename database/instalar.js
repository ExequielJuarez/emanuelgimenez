// Crea la base de datos, carga la estructura + el stock inicial y crea el administrador.
// Usa los datos de conexión del .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME...).
//
//   npm run db:instalar            → estructura + stock inicial + admin
//   npm run db:instalar -- --vacia → solo la estructura + admin (sin autos)
//
// ATENCIÓN: borra y vuelve a crear todas las tablas de DB_NAME.

require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB = process.env.DB_NAME || "emanuelgimenez_automotores";
const ZONA = process.env.DB_TIMEZONE || "-03:00";
const soloEstructura = process.argv.includes("--vacia");

// Los .sql usan "emanuelgimenez_automotores"; si el .env pide otro nombre, se reemplaza
const leer = (archivo) =>
  fs
    .readFileSync(path.join(__dirname, archivo), "utf8")
    .replace(/\bemanuelgimenez_automotores\b/g, `\`${DB}\``)
    .replace(/SET time_zone = '[^']*'/g, `SET time_zone = '${ZONA}'`);

(async () => {
  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || undefined,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  try {
    console.log(`→ Creando estructura en "${DB}"…`);
    await conexion.query(leer("schema.sql"));

    if (!soloEstructura) {
      console.log("→ Cargando stock inicial…");
      await conexion.query(leer("datos-prueba.sql"));
    }

    // Administrador del panel
    // Usuario y clave por defecto: admin / admin1234 (se pueden cambiar con ADMIN_USUARIO / ADMIN_CLAVE en el .env)
    const email = (process.env.ADMIN_USUARIO || "admin").toLowerCase().trim();
    const clave = process.env.ADMIN_CLAVE || "admin1234";
    await conexion.query(`USE \`${DB}\``);
    await conexion.query("INSERT INTO usuario (nombre, email, clave, rol) VALUES (?, ?, ?, 'superadmin')", [
      process.env.ADMIN_NOMBRE || "Emanuel",
      email,
      await bcrypt.hash(clave, 10),
    ]);

    const [tablas] = await conexion.query(
      `SELECT table_name AS tabla, table_rows AS filas FROM information_schema.tables
       WHERE table_schema = ? ORDER BY table_name`,
      [DB]
    );
    console.table(tablas);
    console.log("✅ Base de datos lista.");
    console.log(`👤 Panel: /admin  ·  usuario: ${email}`);
    console.log(`🔑 Clave: ${process.env.ADMIN_CLAVE ? "la de ADMIN_CLAVE en el .env" : "admin1234"}  (cambiala después de entrar: panel → Mi cuenta)`);
  } catch (error) {
    console.error("❌ No se pudo instalar la base de datos:", error.message);
    process.exitCode = 1;
  } finally {
    await conexion.end();
  }
})();
