-- =====================================================================
-- PractiFP · Esquema de base de datos (MariaDB 10.6+)
-- Ejecutar con:  mariadb -u root -p < database/schema.sql
-- ATENCIÓN: borra y vuelve a crear la base de datos "practifp".
-- =====================================================================

DROP DATABASE IF EXISTS practifp;
CREATE DATABASE practifp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE practifp;

-- ---------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------

-- Ciclos formativos (DAM, DAW, ASIR...). Tabla de catálogo para poder
-- añadir ciclos nuevos sin modificar el código.
CREATE TABLE CICLOS (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo    VARCHAR(10)  NOT NULL,
  nombre    VARCHAR(120) NOT NULL,
  CONSTRAINT uq_ciclos_codigo UNIQUE (codigo)
) ENGINE=InnoDB;

CREATE TABLE TECNOLOGIAS (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(60) NOT NULL,
  CONSTRAINT uq_tecnologias_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Usuarios y perfiles
-- ---------------------------------------------------------------------

CREATE TABLE USUARIOS (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email           VARCHAR(255) NOT NULL,
  password_hash   CHAR(60)     NOT NULL,          -- hash bcrypt, nunca texto plano
  rol             ENUM('ALUMNO','EMPRESA','ADMIN') NOT NULL,
  activo          BOOLEAN      NOT NULL DEFAULT TRUE,
  fecha_registro  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  privacidad_aceptada DATETIME NULL,              -- cuándo aceptó la política de privacidad al registrarse
  sesiones_desde  INT UNSIGNED NULL,              -- segundos Unix: los tokens emitidos antes ya no valen (cambio de contraseña)
  CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE ALUMNOS (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED NOT NULL,
  nombre       VARCHAR(80)  NOT NULL,
  apellidos    VARCHAR(120) NOT NULL,
  ciclo_id     INT UNSIGNED NULL,
  curso        TINYINT UNSIGNED NULL,
  centro       VARCHAR(150) NULL,
  localidad    VARCHAR(100) NULL,
  descripcion  TEXT         NULL,
  cv_ruta      VARCHAR(255) NULL,                 -- ruta interna del PDF (privado)
  CONSTRAINT uq_alumnos_usuario UNIQUE (usuario_id),
  CONSTRAINT ck_alumnos_curso CHECK (curso IS NULL OR curso BETWEEN 1 AND 2),
  CONSTRAINT fk_alumnos_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE,
  CONSTRAINT fk_alumnos_ciclo   FOREIGN KEY (ciclo_id)   REFERENCES CICLOS(id)   ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE EMPRESAS (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT UNSIGNED NOT NULL,
  nombre       VARCHAR(150) NOT NULL,
  descripcion  TEXT         NULL,
  web          VARCHAR(255) NULL,
  telefono     VARCHAR(20)  NULL,
  direccion    VARCHAR(200) NULL,
  localidad    VARCHAR(100) NULL,
  latitud      DECIMAL(9,6) NULL,
  longitud     DECIMAL(9,6) NULL,
  verificada   BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_empresas_usuario UNIQUE (usuario_id),
  CONSTRAINT ck_empresas_latitud  CHECK (latitud  IS NULL OR latitud  BETWEEN -90  AND 90),
  CONSTRAINT ck_empresas_longitud CHECK (longitud IS NULL OR longitud BETWEEN -180 AND 180),
  CONSTRAINT fk_empresas_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ALUMNO_TECNOLOGIA (
  alumno_id      INT UNSIGNED NOT NULL,
  tecnologia_id  INT UNSIGNED NOT NULL,
  nivel          ENUM('BASICO','INTERMEDIO','AVANZADO') NOT NULL DEFAULT 'BASICO',
  PRIMARY KEY (alumno_id, tecnologia_id),
  CONSTRAINT fk_at_alumno     FOREIGN KEY (alumno_id)     REFERENCES ALUMNOS(id)     ON DELETE CASCADE,
  CONSTRAINT fk_at_tecnologia FOREIGN KEY (tecnologia_id) REFERENCES TECNOLOGIAS(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Ofertas
-- ---------------------------------------------------------------------

CREATE TABLE OFERTAS (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id         INT UNSIGNED NOT NULL,
  titulo             VARCHAR(150) NOT NULL,
  descripcion        TEXT         NOT NULL,
  ciclo_id           INT UNSIGNED NOT NULL,
  localidad          VARCHAR(100) NOT NULL,
  modalidad          ENUM('PRESENCIAL','HIBRIDA','REMOTA') NOT NULL,
  remunerada         BOOLEAN      NOT NULL DEFAULT FALSE,
  salario            DECIMAL(8,2) NULL,
  plazas             SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  fecha_publicacion  DATE         NOT NULL DEFAULT (CURRENT_DATE),
  fecha_limite       DATE         NOT NULL,
  activa             BOOLEAN      NOT NULL DEFAULT TRUE,
  CONSTRAINT ck_ofertas_salario CHECK (salario IS NULL OR salario >= 0),
  CONSTRAINT ck_ofertas_plazas  CHECK (plazas > 0),
  CONSTRAINT ck_ofertas_fechas  CHECK (fecha_limite >= fecha_publicacion),
  CONSTRAINT fk_ofertas_empresa FOREIGN KEY (empresa_id) REFERENCES EMPRESAS(id) ON DELETE CASCADE,
  CONSTRAINT fk_ofertas_ciclo   FOREIGN KEY (ciclo_id)   REFERENCES CICLOS(id)   ON DELETE RESTRICT,
  INDEX ix_ofertas_busqueda (activa, ciclo_id, localidad, modalidad)
) ENGINE=InnoDB;

CREATE TABLE OFERTA_TECNOLOGIA (
  oferta_id      INT UNSIGNED NOT NULL,
  tecnologia_id  INT UNSIGNED NOT NULL,
  obligatoria    BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (oferta_id, tecnologia_id),
  CONSTRAINT fk_ot_oferta     FOREIGN KEY (oferta_id)     REFERENCES OFERTAS(id)     ON DELETE CASCADE,
  CONSTRAINT fk_ot_tecnologia FOREIGN KEY (tecnologia_id) REFERENCES TECNOLOGIAS(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE FASES_SELECCION (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  oferta_id      INT UNSIGNED NOT NULL,
  nombre         VARCHAR(100) NOT NULL,
  descripcion    VARCHAR(500) NULL,
  orden          TINYINT UNSIGNED NOT NULL,
  duracion_dias  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  obligatoria    BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT uq_fases_orden UNIQUE (oferta_id, orden),
  CONSTRAINT ck_fases_duracion CHECK (duracion_dias >= 0),
  CONSTRAINT fk_fases_oferta FOREIGN KEY (oferta_id) REFERENCES OFERTAS(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Candidaturas y favoritos
-- ---------------------------------------------------------------------

CREATE TABLE CANDIDATURAS (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alumno_id          INT UNSIGNED NOT NULL,
  oferta_id          INT UNSIGNED NOT NULL,
  fecha_inscripcion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado             ENUM('ENVIADA','REVISADA','ENTREVISTA','ACEPTADA','RECHAZADA') NOT NULL DEFAULT 'ENVIADA',
  fase_actual_id     INT UNSIGNED NULL,           -- fase del proceso en la que está el alumno
  CONSTRAINT uq_candidaturas UNIQUE (alumno_id, oferta_id),
  CONSTRAINT fk_cand_alumno FOREIGN KEY (alumno_id)      REFERENCES ALUMNOS(id)         ON DELETE CASCADE,
  CONSTRAINT fk_cand_oferta FOREIGN KEY (oferta_id)      REFERENCES OFERTAS(id)         ON DELETE CASCADE,
  CONSTRAINT fk_cand_fase   FOREIGN KEY (fase_actual_id) REFERENCES FASES_SELECCION(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE FAVORITOS (
  alumno_id      INT UNSIGNED NOT NULL,
  oferta_id      INT UNSIGNED NOT NULL,
  fecha_guardado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (alumno_id, oferta_id),
  CONSTRAINT fk_fav_alumno FOREIGN KEY (alumno_id) REFERENCES ALUMNOS(id) ON DELETE CASCADE,
  CONSTRAINT fk_fav_oferta FOREIGN KEY (oferta_id) REFERENCES OFERTAS(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Portfolio
-- ---------------------------------------------------------------------

CREATE TABLE PROYECTOS (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  alumno_id       INT UNSIGNED NOT NULL,
  titulo          VARCHAR(150) NOT NULL,
  descripcion     TEXT         NOT NULL,
  imagen_ruta     VARCHAR(255) NULL,
  url_github      VARCHAR(255) NULL,
  url_demo        VARCHAR(255) NULL,
  fecha_creacion  DATE         NOT NULL DEFAULT (CURRENT_DATE),
  CONSTRAINT fk_proyectos_alumno FOREIGN KEY (alumno_id) REFERENCES ALUMNOS(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE PROYECTO_TECNOLOGIA (
  proyecto_id    INT UNSIGNED NOT NULL,
  tecnologia_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (proyecto_id, tecnologia_id),
  CONSTRAINT fk_pt_proyecto   FOREIGN KEY (proyecto_id)   REFERENCES PROYECTOS(id)   ON DELETE CASCADE,
  CONSTRAINT fk_pt_tecnologia FOREIGN KEY (tecnologia_id) REFERENCES TECNOLOGIAS(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Valoraciones
-- ---------------------------------------------------------------------

CREATE TABLE VALORACIONES (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  empresa_id  INT UNSIGNED NOT NULL,
  alumno_id   INT UNSIGNED NOT NULL,
  puntuacion  TINYINT UNSIGNED NOT NULL,
  comentario  TEXT     NOT NULL,
  fecha       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado      ENUM('PENDIENTE','APROBADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  CONSTRAINT uq_valoraciones UNIQUE (alumno_id, empresa_id),
  CONSTRAINT ck_valoraciones_puntuacion CHECK (puntuacion BETWEEN 1 AND 5),
  CONSTRAINT fk_val_empresa FOREIGN KEY (empresa_id) REFERENCES EMPRESAS(id) ON DELETE CASCADE,
  CONSTRAINT fk_val_alumno  FOREIGN KEY (alumno_id)  REFERENCES ALUMNOS(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Archivos subidos (solo se usa con ALMACEN_ARCHIVOS=bd, p. ej. en Vercel,
-- donde no hay disco permanente; en modo "disco" se guardan en carpetas)
-- ---------------------------------------------------------------------

CREATE TABLE ARCHIVOS (
  nombre     VARCHAR(100) PRIMARY KEY,          -- nombre generado por el servidor (cv_… o proyecto_…)
  tipo       VARCHAR(50)  NOT NULL,             -- tipo MIME
  contenido  LONGBLOB     NOT NULL,
  tamano     INT UNSIGNED NOT NULL,
  fecha      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Enlaces para restablecer la contraseña. Solo se guarda el hash SHA-256 del enlace,
-- así que quien lea la base de datos no puede usarlos. Se borran al usarse.
CREATE TABLE RECUPERACIONES (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  token_hash  CHAR(64)     NOT NULL,
  caduca      DATETIME     NOT NULL,
  fecha       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_recuperaciones_token UNIQUE (token_hash),
  CONSTRAINT fk_recup_usuario FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Contador de intentos para limitar la fuerza bruta (inicio de sesión, registro...).
-- Se guarda en la base de datos para que funcione aunque haya varias copias del servidor (Vercel).
-- La clave es un hash del límite y la IP: no se guardan direcciones IP.
CREATE TABLE INTENTOS (
  clave  CHAR(64)     PRIMARY KEY,
  n      INT UNSIGNED NOT NULL,
  hasta  DATETIME     NOT NULL,
  INDEX ix_intentos_hasta (hasta)
) ENGINE=InnoDB;
