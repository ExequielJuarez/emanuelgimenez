# Emanuel Gimenez Automotores

Showroom digital de la concesionaria + **panel de administración**.

- **Web pública**: portada, carrusel de destacados, stock con buscador/filtros/orden, ficha de cada unidad
  (con galería de fotos), banner "Vender mi auto", sección **Clientes** (fotos de entregas) y formulario
  "Consultar con asesor" (se guarda en la base y ofrece seguir por WhatsApp).
- **Panel** (`/admin`): resumen, vehículos (alta, edición, fotos, publicar/ocultar, destacar, borrar),
  consultas (estado, nota interna, WhatsApp directo), fotos de clientes y cambio de clave.

Misma estructura y tecnologías que TopLevel: **Node + Express 5 + EJS + MySQL/Sequelize + express-session +
bcryptjs + multer + express-validator**, con CSS y JS separados por página (sin frameworks de CSS).

## Cómo correrla

1. Encendé MySQL / MariaDB (XAMPP sirve).
2. Copiá `.env.example` como `.env` y completá `DB_*` y `SESSION_SECRET`.
3. Instalá y creá la base:

```bash
npm install
npm run db:instalar   # ATENCIÓN: borra y vuelve a crear las tablas (stock inicial + admin)
npm run dev           # http://localhost:3000  ·  panel: http://localhost:3000/admin
npm run celular       # muestra la IP para abrirla desde el celular (mismo Wi-Fi)
```

**Ingreso al panel** (lo crea `npm run db:instalar`): usuario **admin** · clave **admin1234**.
⚠️ Cambiala apenas entres (panel → Mi cuenta), sobre todo en el servidor publicado.

Cambiar la clave (o crear otro admin) desde la consola: `npm run admin:clave -- admin NuevaClave123`
(también se puede desde el panel → Mi cuenta).

## Fotos de clientes

La sección "Familias que confían en nosotros" va al final del inicio y **solo se muestra si hay fotos**.
El stock inicial deja cargadas *Familia Orce* y *Familia Sanchez*: guardá las imágenes como

```
public/img/clientes/familia-orce.webp
public/img/clientes/familia-sanchez.webp
```

o borralas en el panel (Clientes) y subilas desde ahí. El panel avisa cuando falta un archivo.

## Estructura

```
database/                   schema.sql, datos-prueba.sql, instalar.js, clave-admin.js
src/
  app.js                    servidor Express (sesión, base de datos, rutas)
  routes/                   index.Routes.js (web) · admin.Routes.js (panel)
  controllers/              inicio, consultas, auth, admin, clientesAdmin
  services/                 vehiculo, consulta, cliente, usuario
  model/database/           config + modelos Sequelize (Vehiculo, VehiculoImagen, Consulta, ClienteFoto, Usuario)
  middlewares/              soloAdmin, soloInvitados, limiteLogin, subirImagenes
  validations/              consulta y vehículo
  helpers/                  datos de la concesionaria, formatos, íconos SVG, red
  views/                    inicio, error, admin/* y partials/
public/
  css/  base · inicio · error · admin
  js/   base · inicio · admin · admin-vehiculo · admin-consultas · admin-clientes
  img/  portada/, vehiculos/ (+ subidas/), clientes/ (+ subidas/)
```

Teléfono de WhatsApp, horarios e Instagram: `src/helpers/concesionaria.js`.

## Seguridad del panel

- Claves con bcrypt, sesión nueva al ingresar, cookie `httpOnly` + `sameSite` (y `secure` en https).
- 5 intentos fallidos de login por IP cada 15 minutos.
- Todo `/admin` exige sesión; el panel no se indexa ni se guarda en caché.
- En producción: `NODE_ENV=production` y un `SESSION_SECRET` largo.

## Adaptación

- **Celular**: menú hamburguesa en la web y barra inferior tipo app en el panel; tarjetas a 1 columna,
  modales tipo hoja, campos de 16px (sin zoom en iPhone), carruseles táctiles, safe areas.
- **Tablet**: grilla de 2–3 columnas, filtros en 2 columnas, panel con menú lateral.
- **PC**: menú completo, grilla de 3 columnas, efectos hover solo con mouse.
