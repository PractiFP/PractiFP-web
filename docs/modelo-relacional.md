# Modelo relacional

Notación: **PK** clave primaria · **FK** clave foránea · **UK** único. Todas las tablas usan InnoDB y `utf8mb4`.

| Tabla | Columnas | Claves y restricciones |
|---|---|---|
| CICLOS | id, codigo, nombre | PK(id) · UK(codigo) |
| TECNOLOGIAS | id, nombre | PK(id) · UK(nombre) |
| USUARIOS | id, email, password_hash, rol, activo, fecha_registro, privacidad_aceptada, sesiones_desde | PK(id) · UK(email) · rol ∈ {ALUMNO, EMPRESA, ADMIN} |
| ALUMNOS | id, usuario_id, nombre, apellidos, ciclo_id, curso, centro, localidad, descripcion, cv_ruta | PK(id) · UK(usuario_id) · FK usuario_id → USUARIOS (CASCADE) · FK ciclo_id → CICLOS (SET NULL) · curso entre 1 y 2 |
| EMPRESAS | id, usuario_id, nombre, descripcion, web, telefono, direccion, localidad, latitud, longitud, verificada | PK(id) · UK(usuario_id) · FK usuario_id → USUARIOS (CASCADE) · latitud entre -90 y 90 · longitud entre -180 y 180 |
| ALUMNO_TECNOLOGIA | alumno_id, tecnologia_id, nivel | PK(alumno_id, tecnologia_id) · FK → ALUMNOS (CASCADE) · FK → TECNOLOGIAS (RESTRICT) |
| OFERTAS | id, empresa_id, titulo, descripcion, ciclo_id, localidad, modalidad, remunerada, salario, plazas, fecha_publicacion, fecha_limite, activa | PK(id) · FK empresa_id → EMPRESAS (CASCADE) · FK ciclo_id → CICLOS (RESTRICT) · plazas > 0 · salario ≥ 0 · fecha_limite ≥ fecha_publicacion |
| OFERTA_TECNOLOGIA | oferta_id, tecnologia_id, obligatoria | PK(oferta_id, tecnologia_id) · FK → OFERTAS (CASCADE) · FK → TECNOLOGIAS (RESTRICT) |
| FASES_SELECCION | id, oferta_id, nombre, descripcion, orden, duracion_dias, obligatoria | PK(id) · FK oferta_id → OFERTAS (CASCADE) · UK(oferta_id, orden) · duracion_dias ≥ 0 |
| CANDIDATURAS | id, alumno_id, oferta_id, fecha_inscripcion, estado, fase_actual_id | PK(id) · UK(alumno_id, oferta_id) · FK → ALUMNOS (CASCADE) · FK → OFERTAS (CASCADE) · FK fase_actual_id → FASES_SELECCION (SET NULL) |
| FAVORITOS | alumno_id, oferta_id, fecha_guardado | PK(alumno_id, oferta_id) · FK → ALUMNOS (CASCADE) · FK → OFERTAS (CASCADE) |
| PROYECTOS | id, alumno_id, titulo, descripcion, imagen_ruta, url_github, url_demo, fecha_creacion | PK(id) · FK alumno_id → ALUMNOS (CASCADE) |
| PROYECTO_TECNOLOGIA | proyecto_id, tecnologia_id | PK(proyecto_id, tecnologia_id) · FK → PROYECTOS (CASCADE) · FK → TECNOLOGIAS (RESTRICT) |
| VALORACIONES | id, empresa_id, alumno_id, puntuacion, comentario, fecha, estado | PK(id) · UK(alumno_id, empresa_id) · FK → EMPRESAS (CASCADE) · FK → ALUMNOS (CASCADE) · puntuacion entre 1 y 5 |
| RECUPERACIONES | id, usuario_id, token_hash, caduca, fecha | PK(id) · UK(token_hash) · FK usuario_id → USUARIOS (CASCADE) |
| INTENTOS | clave, n, hasta | PK(clave) · índice en hasta (tabla técnica del límite de intentos, sin relación con las demás) |

## Cómo se cumplen las restricciones del documento

| Requisito | Implementación |
|---|---|
| Email único | `uq_usuarios_email` |
| Un solo perfil de alumno / empresa por usuario | `uq_alumnos_usuario`, `uq_empresas_usuario` |
| Una candidatura por alumno y oferta | `uq_candidaturas` |
| Una valoración por alumno y empresa | `uq_valoraciones` |
| Puntuación de 1 a 5 | `ck_valoraciones_puntuacion` |
| Plazas > 0 · salario ≥ 0 | `ck_ofertas_plazas`, `ck_ofertas_salario` |
| Coordenadas válidas | `ck_empresas_latitud`, `ck_empresas_longitud` |
| Orden de fases único por oferta | `uq_fases_orden` |
| Duración de fases no negativa | `ck_fases_duracion` (+ tipo UNSIGNED) |
| Relaciones N:M con PK compuesta | ALUMNO_TECNOLOGIA, OFERTA_TECNOLOGIA, PROYECTO_TECNOLOGIA, FAVORITOS |
| Contraseñas nunca en texto plano | Solo se guarda `password_hash` (bcrypt) |

## Decisiones añadidas al modelo del documento

- **Tabla CICLOS**: el documento pide poder añadir ciclos sin limitarse a DAM, DAW y ASIR. Un catálogo evita escribir los ciclos en el código.
- **CANDIDATURAS.fase_actual_id** (opcional): permite que la empresa indique en qué fase del proceso está cada candidato, además de su estado.
- **VALORACIONES.estado** con tres valores (PENDIENTE, APROBADA, RECHAZADA) para la moderación.
