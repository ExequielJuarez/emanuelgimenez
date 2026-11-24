-- Stock inicial (el mismo de la web original). El usuario administrador lo crea
-- database/instalar.js con ADMIN_EMAIL / ADMIN_CLAVE del .env.
USE emanuelgimenez_automotores;
SET NAMES utf8mb4;
SET time_zone = '-03:00';

INSERT INTO vehiculo (id, marca, modelo, anio, segmento, condicion, km, transmision, combustible, precio, destacado, descripcion) VALUES
(1, 'Toyota',     'Hilux SRX 2.8 TDI 4x4',      2023, 'Pick-up',               'Usado Seleccionado', 24500, 'Automática', 'Diésel',  46500, 1, 'Motor 2.8 Turbo Diésel de 204 CV, tracción 4x4 con reductora, cámara 360°, tapizado en cuero ventilado y servicios oficiales.'),
(2, 'Volkswagen', 'Amarok V6 Extreme 3.0',      2024, 'Pick-up',               'Usado Seleccionado', 14800, 'Automática', 'Diésel',  51900, 1, '258 CV con función Overboost, caja automática ZF de 8 marchas, llantas de 20 pulgadas y barra deportiva original.'),
(3, 'Peugeot',    '208 Feline Tiptronic 1.6',   2024, 'Hatchback',             'Usado Seleccionado', 11200, 'Automática', 'Nafta',   22400, 1, 'Tope de gama nacional con techo cielo panorámico, tablero digital i-Cockpit 3D, cargador inalámbrico y asistencias ADAS.'),
(4, 'Toyota',     'Corolla Cross SEG Hybrid',   2024, 'SUV',                   'Usado Seleccionado', 18300, 'Automática', 'Híbrido', 33500, 1, 'Tecnología híbrida autorrecargable, consumo urbano bajísimo, paquete Toyota Safety Sense completo y tapizado de cuero.'),
(5, 'Fiat',       'Cronos Precision 1.3 CVT',   2024, 'Sedán',                 'Usado Seleccionado', 12900, 'Automática', 'Nafta',   17800, 0, 'El sedán líder en Argentina. Versión full con tapizado de cuero, acceso sin llave, cámara de retroceso y baúl de 525 litros.'),
(6, 'Volkswagen', 'Taos Highline 250 TSI',      2023, 'SUV',                   'Usado Seleccionado', 27400, 'Automática', 'Nafta',   34800, 0, 'Fabricación nacional, motor 1.4 Turbo de 150 CV, techo panorámico corredizo, tablero Active Info Display y luces IQ.Light.'),
(7, 'Chevrolet',  'Tracker RS Turbo 1.2',       2025, 'SUV',                   '0km',                0,     'Automática', 'Nafta',   27900, 0, 'Unidad 0km para entrega inmediata. Estética deportiva RS, techo solar panorámico, 6 airbags y Wi-Fi nativo.'),
(8, 'Renault',    'Kangoo II Stepway 1.6 SCe',  2022, 'Utilitario / Familiar', 'Usado Seleccionado', 38100, 'Manual',     'Nafta',   19200, 0, 'Doble portón lateral corredizo, pantalla táctil Media Evolution, control de estabilidad y amplio espacio interior.');

INSERT INTO vehiculo_imagen (vehiculo_id, url, orden) VALUES
(1, '/img/vehiculos/toyota-hilux-srx.jpg', 0),
(2, '/img/vehiculos/vw-amarok-v6.jpg', 0),
(3, '/img/vehiculos/peugeot-208-feline.jpg', 0),
(4, '/img/vehiculos/toyota-corolla-cross.jpg', 0),
(5, '/img/vehiculos/fiat-cronos.jpg', 0),
(6, '/img/vehiculos/vw-taos-highline.jpg', 0),
(7, '/img/vehiculos/chevrolet-tracker-rs.jpg', 0),
(8, '/img/vehiculos/renault-kangoo-stepway.jpg', 0);

INSERT INTO consulta (nombre, telefono, mensaje, motivo, vehiculo_id, estado, creado_en) VALUES
('Lucas Fernández', '381 444-8821', '¿Toman permuta por un Gol Trend 2018?', '2023 Toyota Hilux SRX 2.8 TDI 4x4 ($ 46.500)', 1, 'nueva', NOW() - INTERVAL 2 HOUR),
('Carla Medina', '381 555-1234', NULL, 'Cotización para Vender o Entregar mi Vehículo', NULL, 'contactado', NOW() - INTERVAL 1 DAY);

-- Clientes: guardá las fotos en public/img/clientes/ con estos nombres
-- (o subilas desde el panel: /admin/clientes)
INSERT INTO cliente_foto (url, titulo, orden) VALUES
('/img/clientes/familia-orce.webp', 'Familia Orce', 0),
('/img/clientes/familia-sanchez.webp', 'Familia Sanchez', 1);
