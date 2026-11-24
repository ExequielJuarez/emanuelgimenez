-- Estructura de la base de datos de Emanuel Gimenez Automotores (MySQL / MariaDB).
-- La carga `npm run db:instalar` (ATENCIÓN: borra y vuelve a crear las tablas).

CREATE DATABASE IF NOT EXISTS emanuelgimenez_automotores
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE emanuelgimenez_automotores;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS cliente_foto;
DROP TABLE IF EXISTS consulta;
DROP TABLE IF EXISTS vehiculo_imagen;
DROP TABLE IF EXISTS vehiculo;
DROP TABLE IF EXISTS usuario;
SET FOREIGN_KEY_CHECKS = 1;

-- Administradores del panel
CREATE TABLE usuario (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(80)  NOT NULL,
  email          VARCHAR(120) NOT NULL UNIQUE,
  clave          VARCHAR(100) NOT NULL,              -- hash bcrypt
  rol            ENUM('admin', 'superadmin') NOT NULL DEFAULT 'admin',
  ultimo_acceso  DATETIME NULL,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock de vehículos
CREATE TABLE vehiculo (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  marca          VARCHAR(40)  NOT NULL,
  modelo         VARCHAR(100) NOT NULL,
  anio           SMALLINT UNSIGNED NOT NULL,
  segmento       VARCHAR(40)  NOT NULL,
  condicion      ENUM('0km', 'Usado Seleccionado') NOT NULL DEFAULT 'Usado Seleccionado',
  km             INT UNSIGNED NOT NULL DEFAULT 0,
  transmision    ENUM('Automática', 'Manual') NOT NULL DEFAULT 'Automática',
  combustible    ENUM('Nafta', 'Diésel', 'Híbrido', 'Eléctrico', 'GNC') NOT NULL DEFAULT 'Nafta',
  precio         DECIMAL(12, 2) UNSIGNED NOT NULL,
  descripcion    TEXT NULL,
  destacado      TINYINT(1) NOT NULL DEFAULT 0,     -- aparece en el carrusel "Destacados"
  publicado      TINYINT(1) NOT NULL DEFAULT 1,     -- se ve en la web (0 = oculto / vendido)
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehiculo_publicado (publicado, destacado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fotos de cada vehículo (orden 0 = portada)
CREATE TABLE vehiculo_imagen (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id    INT UNSIGNED NOT NULL,
  url            VARCHAR(255) NOT NULL,
  orden          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_imagen_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculo (id) ON DELETE CASCADE,
  INDEX idx_imagen_vehiculo (vehiculo_id, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consultas del formulario "Consultar con asesor"
CREATE TABLE consulta (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(80)  NOT NULL,
  telefono       VARCHAR(20)  NOT NULL,
  mensaje        VARCHAR(500) NULL,
  motivo         VARCHAR(160) NOT NULL,
  vehiculo_id    INT UNSIGNED NULL,
  estado         ENUM('nueva', 'contactado', 'cerrada') NOT NULL DEFAULT 'nueva',
  nota           VARCHAR(500) NULL,                 -- nota interna del vendedor
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_consulta_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculo (id) ON DELETE SET NULL,
  INDEX idx_consulta_estado (estado, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fotos de clientes con su auto (sección "Clientes" al final del inicio)
CREATE TABLE cliente_foto (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  url            VARCHAR(255) NOT NULL,
  titulo         VARCHAR(80)  NULL,                 -- ej: "Familia Orce"
  orden          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  publicado      TINYINT(1) NOT NULL DEFAULT 1,
  creado_en      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cliente_foto_orden (publicado, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
