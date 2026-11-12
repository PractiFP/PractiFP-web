-- =====================================================================
-- PractiFP · Datos de prueba
-- Ejecutar DESPUÉS de schema.sql:  mariadb -u root -p practifp < database/seed.sql
--
-- Todas las cuentas usan la contraseña:  practifp123
-- (se guarda solo su hash bcrypt)
--
-- Las fechas de las ofertas se calculan respecto al día en que se carga
-- el script, para que siempre haya ofertas abiertas.
-- =====================================================================

USE practifp;

SET @hash = '$2b$10$glei4GyLXrp.t4TR0rUKFejhxGozYRH60U0RfQDAX8wt9Tv5UgCHm';

-- Catálogos -----------------------------------------------------------

INSERT INTO CICLOS (id, codigo, nombre) VALUES
  (1, 'DAM',  'Desarrollo de Aplicaciones Multiplataforma'),
  (2, 'DAW',  'Desarrollo de Aplicaciones Web'),
  (3, 'ASIR', 'Administración de Sistemas Informáticos en Red'),
  (4, 'SMR',  'Sistemas Microinformáticos y Redes');

INSERT INTO TECNOLOGIAS (id, nombre) VALUES
  (1,'JavaScript'),(2,'React'),(3,'Vue'),(4,'Node.js'),(5,'HTML/CSS'),
  (6,'PHP'),(7,'Laravel'),(8,'Java'),(9,'Spring Boot'),(10,'Kotlin'),
  (11,'Android'),(12,'Python'),(13,'SQL'),(14,'MariaDB'),(15,'Git'),
  (16,'Docker'),(17,'Linux'),(18,'Windows Server'),(19,'Redes'),(20,'AWS');

-- Usuarios ------------------------------------------------------------

INSERT INTO USUARIOS (id, email, password_hash, rol, activo, fecha_registro) VALUES
  (1,  'admin@practifp.es',               @hash, 'ADMIN',   TRUE,  '2026-01-10 09:00:00'),
  (2,  'lucia.martin@correo.example',     @hash, 'ALUMNO',  TRUE,  '2026-09-14 10:20:00'),
  (3,  'carlos.ruiz@correo.example',      @hash, 'ALUMNO',  TRUE,  '2026-09-20 18:05:00'),
  (4,  'ana.lopez@correo.example',        @hash, 'ALUMNO',  TRUE,  '2026-10-02 12:40:00'),
  (5,  'javier.torres@correo.example',    @hash, 'ALUMNO',  TRUE,  '2026-03-11 09:15:00'),
  (6,  'marta.gil@correo.example',        @hash, 'ALUMNO',  TRUE,  '2026-02-20 17:30:00'),
  (7,  'pablo.sanz@correo.example',       @hash, 'ALUMNO',  FALSE, '2026-02-28 11:00:00'),
  (8,  'rrhh@nubalia.example',            @hash, 'EMPRESA', TRUE,  '2026-02-01 08:45:00'),
  (9,  'talento@sevitec.example',         @hash, 'EMPRESA', TRUE,  '2026-02-12 13:10:00'),
  (10, 'hola@turiaapps.example',          @hash, 'EMPRESA', TRUE,  '2026-03-03 16:00:00'),
  (11, 'empleo@cantabricodata.example',   @hash, 'EMPRESA', TRUE,  '2026-10-25 10:00:00'),
  (12, 'equipo@rambladigital.example',    @hash, 'EMPRESA', TRUE,  '2026-04-09 09:30:00'),
  (13, 'personas@genilcloud.example',     @hash, 'EMPRESA', TRUE,  '2026-01-30 12:00:00'),
  (14, 'info@ebroredes.example',          @hash, 'EMPRESA', TRUE,  '2026-10-30 15:20:00'),
  (15, 'rrhh@atlanticosoft.example',      @hash, 'EMPRESA', TRUE,  '2026-05-15 11:45:00');

INSERT INTO ALUMNOS (id, usuario_id, nombre, apellidos, ciclo_id, curso, centro, localidad, descripcion, cv_ruta) VALUES
  (1, 2, 'Lucía',  'Martín Herrera', 1, 2, 'IES Clara del Rey', 'Madrid',
     'Estudiante de segundo de DAM. Me gusta el desarrollo Android y las aplicaciones que resuelven problemas del día a día. Busco prácticas donde aprender a trabajar en equipo con metodologías ágiles.', NULL),
  (2, 3, 'Carlos', 'Ruiz Moreno',    2, 2, 'IES Ramón del Valle-Inclán', 'Sevilla',
     'Desarrollador web en formación. Me interesa el frontend y la accesibilidad.', NULL),
  (3, 4, 'Ana',    'López Ferrer',   3, 2, 'IES Abastos', 'Valencia',
     'Apasionada de los sistemas y la nube. Homelab con Proxmox y Docker.', NULL),
  (4, 5, 'Javier', 'Torres Gil',     2, 2, 'IES Clara del Rey', 'Madrid',
     'Backend con Java y Spring. Terminando el ciclo.', NULL),
  (5, 6, 'Marta',  'Gil Navarro',    3, 2, 'IES Hermenegildo Lanz', 'Granada',
     'Administración de sistemas y automatización.', NULL),
  (6, 7, 'Pablo',  'Sanz Ortega',    3, 2, 'IES Polígono Sur', 'Sevilla',
     'Redes y seguridad.', NULL);

INSERT INTO ALUMNO_TECNOLOGIA (alumno_id, tecnologia_id, nivel) VALUES
  (1,10,'AVANZADO'),(1,11,'INTERMEDIO'),(1,8,'AVANZADO'),(1,13,'INTERMEDIO'),(1,15,'INTERMEDIO'),(1,2,'BASICO'),
  (2,1,'AVANZADO'),(2,2,'INTERMEDIO'),(2,5,'AVANZADO'),(2,6,'INTERMEDIO'),(2,15,'INTERMEDIO'),
  (3,17,'AVANZADO'),(3,16,'INTERMEDIO'),(3,19,'INTERMEDIO'),(3,20,'BASICO'),
  (4,8,'AVANZADO'),(4,9,'INTERMEDIO'),(4,13,'AVANZADO'),
  (5,17,'AVANZADO'),(5,20,'INTERMEDIO'),
  (6,19,'AVANZADO'),(6,18,'INTERMEDIO');

INSERT INTO EMPRESAS (id, usuario_id, nombre, descripcion, web, telefono, direccion, localidad, latitud, longitud, verificada) VALUES
  (1, 8,  'Nubalia Software', 'Consultora de desarrollo de software especializada en aplicaciones móviles y web para el sector logístico. Equipo de 45 personas con tutor asignado para cada alumno en prácticas.',
       'https://nubalia.example', '910000120', 'Calle de Alcalá 120', 'Madrid', 40.424500, -3.674500, TRUE),
  (2, 9,  'Sevitec Sistemas', 'Servicios gestionados de infraestructura, soporte y redes para pymes andaluzas.',
       'https://sevitec.example', '954000015', 'Avenida de la Buhaira 15', 'Sevilla', 37.382800, -5.973200, TRUE),
  (3, 10, 'Turia Apps', 'Estudio de producto digital. Desarrollamos aplicaciones web y móviles para startups.',
       'https://turiaapps.example', '963000030', 'Calle de Colón 30', 'Valencia', 39.469900, -0.376300, TRUE),
  (4, 11, 'Cantábrico Data', 'Análisis de datos e inteligencia de negocio para la industria vasca.',
       'https://cantabricodata.example', '944000040', 'Gran Vía 40', 'Bilbao', 43.263000, -2.935000, FALSE),
  (5, 12, 'Rambla Digital', 'Agencia web: comercio electrónico, maquetación y desarrollo a medida en PHP.',
       'https://rambladigital.example', '930000100', 'Carrer de Pallars 100', 'Barcelona', 41.401000, 2.195000, TRUE),
  (6, 13, 'Genil Cloud', 'Proveedor de servicios cloud y DevOps. Formamos a alumnos de ASIR en automatización e infraestructura como código.',
       'https://genilcloud.example', '958000022', 'Calle Recogidas 22', 'Granada', 37.170000, -3.603000, TRUE),
  (7, 14, 'Ebro Redes', 'Instalación y mantenimiento de redes corporativas y ciberseguridad.',
       'https://ebroredes.example', '976000010', 'Paseo de la Independencia 10', 'Zaragoza', 41.650000, -0.884000, FALSE),
  (8, 15, 'Atlántico Soft', 'Software de gestión para el sector pesquero y portuario.',
       'https://atlanticosoft.example', '981000055', 'Rúa Real 55', 'A Coruña', 43.370000, -8.400000, TRUE);

-- Ofertas -------------------------------------------------------------

INSERT INTO OFERTAS (id, empresa_id, titulo, descripcion, ciclo_id, localidad, modalidad, remunerada, salario, plazas, fecha_publicacion, fecha_limite, activa) VALUES
  (1, 1, 'Desarrollo Android con Kotlin',
      'Te incorporarás al equipo móvil para desarrollar nuevas pantallas de nuestra app de seguimiento de envíos. Trabajarás con Kotlin, Jetpack Compose y una API REST interna. Tendrás un tutor de empresa y revisiones de código semanales.',
      1, 'Madrid', 'HIBRIDA', TRUE, 400, 2, CURRENT_DATE - INTERVAL 16 DAY, CURRENT_DATE + INTERVAL 25 DAY, TRUE),
  (2, 1, 'Desarrollo frontend con React',
      'Colaborarás en el panel web de clientes: componentes reutilizables, formularios y consumo de API REST.',
      2, 'Madrid', 'PRESENCIAL', TRUE, 450, 2, CURRENT_DATE - INTERVAL 8 DAY, CURRENT_DATE + INTERVAL 35 DAY, TRUE),
  (3, 1, 'Backend Java con Spring Boot',
      'Desarrollo de microservicios internos con Spring Boot y MariaDB.',
      2, 'Madrid', 'REMOTA', FALSE, NULL, 1, CURRENT_DATE - INTERVAL 235 DAY, CURRENT_DATE - INTERVAL 205 DAY, FALSE),
  (4, 2, 'Administración de sistemas Linux',
      'Mantenimiento de servidores Linux de clientes, copias de seguridad, monitorización y automatización con scripts.',
      3, 'Sevilla', 'PRESENCIAL', TRUE, 350, 3, CURRENT_DATE - INTERVAL 21 DAY, CURRENT_DATE + INTERVAL 15 DAY, TRUE),
  (5, 2, 'Soporte técnico y redes',
      'Atención a incidencias de usuarios, montaje de equipos y configuración de redes locales.',
      4, 'Sevilla', 'PRESENCIAL', FALSE, NULL, 2, CURRENT_DATE - INTERVAL 6 DAY, CURRENT_DATE + INTERVAL 26 DAY, TRUE),
  (6, 3, 'Desarrollo web full-stack',
      'Desarrollo de funcionalidades completas en un producto SaaS: API en Node.js, base de datos MariaDB y frontend.',
      2, 'Valencia', 'HIBRIDA', TRUE, 500, 2, CURRENT_DATE - INTERVAL 3 DAY, CURRENT_DATE + INTERVAL 40 DAY, TRUE),
  (7, 3, 'Desarrollo de apps móviles',
      'Apoyo al equipo móvil en el mantenimiento de dos aplicaciones Android publicadas.',
      1, 'Valencia', 'REMOTA', TRUE, 300, 1, CURRENT_DATE - INTERVAL 11 DAY, CURRENT_DATE + INTERVAL 20 DAY, TRUE),
  (8, 4, 'Análisis de datos con Python',
      'Limpieza de datos, consultas SQL y pequeños scripts de automatización en Python.',
      1, 'Bilbao', 'HIBRIDA', TRUE, 420, 1, CURRENT_DATE - INTERVAL 220 DAY, CURRENT_DATE - INTERVAL 190 DAY, FALSE),
  (9, 5, 'Maquetación y desarrollo PHP',
      'Maquetación de tiendas online y desarrollo de módulos a medida.',
      2, 'Barcelona', 'PRESENCIAL', FALSE, NULL, 2, CURRENT_DATE - INTERVAL 26 DAY, CURRENT_DATE + INTERVAL 22 DAY, TRUE),
  (10, 6, 'Cloud y DevOps junior',
      'Despliegues en AWS, contenedores Docker y pipelines de integración continua.',
      3, 'Granada', 'REMOTA', TRUE, 380, 2, CURRENT_DATE - INTERVAL 18 DAY, CURRENT_DATE + INTERVAL 30 DAY, TRUE),
  (11, 7, 'Técnico de redes y ciberseguridad',
      'Configuración de cortafuegos, VLAN y auditorías básicas de seguridad.',
      3, 'Zaragoza', 'PRESENCIAL', TRUE, 300, 1, CURRENT_DATE - INTERVAL 4 DAY, CURRENT_DATE + INTERVAL 45 DAY, TRUE),
  (12, 8, 'Desarrollo web con Laravel',
      'Desarrollo de nuevas funcionalidades en nuestro ERP web.',
      2, 'A Coruña', 'HIBRIDA', TRUE, 400, 2, CURRENT_DATE - INTERVAL 14 DAY, CURRENT_DATE + INTERVAL 25 DAY, TRUE);

INSERT INTO OFERTA_TECNOLOGIA (oferta_id, tecnologia_id, obligatoria) VALUES
  (1,10,TRUE),(1,11,TRUE),(1,15,FALSE),(1,13,FALSE),
  (2,2,TRUE),(2,1,TRUE),(2,5,TRUE),(2,15,FALSE),
  (3,8,TRUE),(3,9,TRUE),(3,14,FALSE),
  (4,17,TRUE),(4,19,TRUE),(4,16,FALSE),
  (5,18,TRUE),(5,19,TRUE),
  (6,1,TRUE),(6,4,TRUE),(6,14,TRUE),(6,3,FALSE),
  (7,8,TRUE),(7,11,TRUE),(7,15,TRUE),
  (8,12,TRUE),(8,13,TRUE),
  (9,6,TRUE),(9,5,TRUE),(9,7,FALSE),(9,14,FALSE),
  (10,20,TRUE),(10,16,TRUE),(10,17,TRUE),(10,15,FALSE),
  (11,19,TRUE),(11,17,TRUE),(11,18,FALSE),
  (12,6,TRUE),(12,7,TRUE),(12,15,FALSE);

-- Fases de selección: proceso estándar de 5 fases en varias ofertas
INSERT INTO FASES_SELECCION (oferta_id, nombre, descripcion, orden, duracion_dias, obligatoria)
SELECT o.id, f.nombre, f.descripcion, f.orden, f.dias, f.obligatoria
FROM (SELECT 1 AS id UNION ALL SELECT 2 UNION ALL SELECT 4 UNION ALL SELECT 6 UNION ALL SELECT 10 UNION ALL SELECT 12) o
CROSS JOIN (
  SELECT 'Recepción de candidaturas' AS nombre, 'Revisamos que el perfil encaje con el ciclo y las tecnologías.' AS descripcion, 1 AS orden, 7 AS dias, TRUE AS obligatoria
  UNION ALL SELECT 'Revisión de currículums', 'El equipo técnico revisa el CV y el portfolio.', 2, 5, TRUE
  UNION ALL SELECT 'Prueba técnica', 'Ejercicio práctico para hacer en casa (2-3 horas).', 3, 7, FALSE
  UNION ALL SELECT 'Entrevista', 'Entrevista de 30 minutos con el tutor de empresa.', 4, 5, TRUE
  UNION ALL SELECT 'Resolución final', 'Comunicamos la decisión a todos los candidatos.', 5, 3, TRUE
) f
ORDER BY o.id, f.orden;

INSERT INTO FASES_SELECCION (oferta_id, nombre, descripcion, orden, duracion_dias, obligatoria) VALUES
  (5, 'Recepción de candidaturas', 'Plazo abierto hasta la fecha límite.', 1, 10, TRUE),
  (5, 'Entrevista', 'Entrevista presencial en nuestra oficina.', 2, 4, TRUE),
  (5, 'Resolución final', 'Respuesta por correo electrónico.', 3, 2, TRUE);

-- Candidaturas y favoritos ---------------------------------------------

INSERT INTO CANDIDATURAS (id, alumno_id, oferta_id, fecha_inscripcion, estado) VALUES
  (1,  1, 1,  NOW() - INTERVAL 14 DAY,  'ENTREVISTA'),
  (2,  1, 7,  NOW() - INTERVAL 4 DAY,   'ENVIADA'),
  (3,  1, 8,  NOW() - INTERVAL 210 DAY, 'ACEPTADA'),
  (4,  1, 2,  NOW() - INTERVAL 7 DAY,   'RECHAZADA'),
  (5,  2, 2,  NOW() - INTERVAL 6 DAY,   'REVISADA'),
  (6,  2, 6,  NOW() - INTERVAL 2 DAY,   'ENVIADA'),
  (7,  2, 9,  NOW() - INTERVAL 240 DAY, 'ACEPTADA'),
  (8,  3, 4,  NOW() - INTERVAL 18 DAY,  'ENTREVISTA'),
  (9,  3, 10, NOW() - INTERVAL 16 DAY,  'ACEPTADA'),
  (10, 4, 2,  NOW() - INTERVAL 3 DAY,   'ENVIADA'),
  (11, 4, 3,  NOW() - INTERVAL 225 DAY, 'ACEPTADA'),
  (12, 5, 10, NOW() - INTERVAL 245 DAY, 'ACEPTADA'),
  (13, 6, 4,  NOW() - INTERVAL 240 DAY, 'ACEPTADA');

-- Fase actual de las candidaturas en curso
UPDATE CANDIDATURAS c
JOIN FASES_SELECCION f ON f.oferta_id = c.oferta_id
SET c.fase_actual_id = f.id
WHERE (c.id = 1 AND f.orden = 4)
   OR (c.id = 5 AND f.orden = 2)
   OR (c.id = 8 AND f.orden = 4)
   OR (c.id IN (2, 6, 10) AND f.orden = 1);

INSERT INTO FAVORITOS (alumno_id, oferta_id) VALUES (1, 6), (1, 10), (2, 12);

-- Portfolio -------------------------------------------------------------

INSERT INTO PROYECTOS (id, alumno_id, titulo, descripcion, imagen_ruta, url_github, url_demo, fecha_creacion) VALUES
  (1, 1, 'GymTrack', 'App Android para registrar entrenamientos y ver la evolución con gráficas. Base de datos local con Room.', NULL, 'https://github.com/ejemplo/gymtrack', NULL, '2026-05-20'),
  (2, 1, 'Biblioteca IES', 'Aplicación de escritorio para gestionar los préstamos de la biblioteca del instituto. Proyecto de primer curso.', NULL, 'https://github.com/ejemplo/biblioteca-ies', NULL, '2026-02-14'),
  (3, 1, 'Portfolio personal', 'Mi web personal con mis proyectos, hecha con React.', NULL, 'https://github.com/ejemplo/portfolio', 'https://ejemplo.github.io/portfolio', '2026-09-30'),
  (4, 2, 'TapasSevilla', 'Web de rutas de tapas con mapa y valoraciones.', NULL, 'https://github.com/ejemplo/tapas', 'https://ejemplo.github.io/tapas', '2026-06-01'),
  (5, 3, 'Homelab documentado', 'Infraestructura doméstica con Proxmox, Docker y copias automáticas.', NULL, 'https://github.com/ejemplo/homelab', NULL, '2026-07-12');

INSERT INTO PROYECTO_TECNOLOGIA (proyecto_id, tecnologia_id) VALUES
  (1,10),(1,11),(1,13),
  (2,8),(2,14),
  (3,2),(3,5),
  (4,1),(4,6),(4,14),
  (5,17),(5,16);

-- Valoraciones -----------------------------------------------------------

INSERT INTO VALORACIONES (id, empresa_id, alumno_id, puntuacion, comentario, fecha, estado) VALUES
  (1, 5, 2, 4, 'Buen ambiente y me dejaron participar en proyectos reales desde la primera semana. El horario era algo rígido.', '2026-06-20 18:00:00', 'APROBADA'),
  (2, 1, 4, 4, 'Tutor muy implicado y revisiones de código útiles. Aprendí mucho de Spring.', '2026-06-25 12:30:00', 'APROBADA'),
  (3, 6, 5, 5, 'Las mejores prácticas posibles para ASIR: Terraform, AWS y un equipo que explica todo con paciencia.', '2026-06-10 09:45:00', 'APROBADA'),
  (4, 2, 6, 4, 'Mucho trabajo de campo con clientes. Se aprende rápido.', '2026-06-15 20:10:00', 'APROBADA'),
  (5, 6, 3, 5, 'Muy contenta con el equipo, me están enseñando Docker y despliegues reales.', NOW() - INTERVAL 2 DAY, 'PENDIENTE');

-- Currículums de ejemplo -------------------------------------------------
-- El script backend/scripts/db-reset.js copia database/archivos/cv_ejemplo.pdf
-- a backend/uploads/cv/ con cada uno de estos nombres.
UPDATE ALUMNOS SET cv_ruta = CONCAT('cv_seed_', id, '.pdf') WHERE id IN (1, 2, 3, 4);
