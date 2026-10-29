CREATE DATABASE IF NOT EXISTS practifp CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE practifp;

CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  rol ENUM('alumno','empresa','admin') NOT NULL,
  bloqueado BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1:1 con usuario
CREATE TABLE alumno (
  id_usuario INT PRIMARY KEY,
  ciclo ENUM('DAM','DAW','ASIR','SMR') NOT NULL DEFAULT 'DAM',
  curso ENUM('1º','2º') NOT NULL DEFAULT '2º',
  centro VARCHAR(150) NOT NULL DEFAULT '',
  cv_ruta VARCHAR(200),
  cv_nombre VARCHAR(200),
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE TABLE empresa (
  id_usuario INT PRIMARY KEY,
  descripcion TEXT,
  web VARCHAR(200) NOT NULL DEFAULT '',
  localidad VARCHAR(100) NOT NULL DEFAULT 'Sevilla',
  FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE
);

-- "Aceptamos alumnos de DAM aunque no haya oferta publicada"
CREATE TABLE empresa_ciclo (
  id_empresa INT NOT NULL,
  ciclo ENUM('DAM','DAW','ASIR','SMR') NOT NULL,
  PRIMARY KEY (id_empresa, ciclo),
  FOREIGN KEY (id_empresa) REFERENCES empresa(id_usuario) ON DELETE CASCADE
);

-- 1:N empresa -> oferta
CREATE TABLE oferta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_empresa INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  ciclo ENUM('DAM','DAW','ASIR','SMR') NOT NULL,
  localidad VARCHAR(100) NOT NULL,
  remunerada BOOLEAN NOT NULL DEFAULT 0,
  modalidad ENUM('Presencial','Híbrida','Remota') NOT NULL DEFAULT 'Presencial',
  plazas INT NOT NULL DEFAULT 1,
  activa BOOLEAN NOT NULL DEFAULT 1,
  fecha_publicacion DATE NOT NULL DEFAULT (CURRENT_DATE),
  FOREIGN KEY (id_empresa) REFERENCES empresa(id_usuario) ON DELETE CASCADE,
  INDEX (ciclo, activa)
);

CREATE TABLE tecnologia (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL UNIQUE
);

-- N:M
CREATE TABLE oferta_tecnologia (
  id_oferta INT NOT NULL,
  id_tecnologia INT NOT NULL,
  PRIMARY KEY (id_oferta, id_tecnologia),
  FOREIGN KEY (id_oferta) REFERENCES oferta(id) ON DELETE CASCADE,
  FOREIGN KEY (id_tecnologia) REFERENCES tecnologia(id) ON DELETE CASCADE
);

CREATE TABLE alumno_tecnologia (
  id_alumno INT NOT NULL,
  id_tecnologia INT NOT NULL,
  PRIMARY KEY (id_alumno, id_tecnologia),
  FOREIGN KEY (id_alumno) REFERENCES alumno(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_tecnologia) REFERENCES tecnologia(id) ON DELETE CASCADE
);

-- N:M alumno <-> oferta, con atributos propios (fecha, estado)
CREATE TABLE candidatura (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_alumno INT NOT NULL,
  id_oferta INT NOT NULL,
  fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
  estado ENUM('Pendiente','En revisión','Entrevista','Aceptada','Rechazada') NOT NULL DEFAULT 'Pendiente',
  UNIQUE (id_alumno, id_oferta),
  FOREIGN KEY (id_alumno) REFERENCES alumno(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_oferta) REFERENCES oferta(id) ON DELETE CASCADE
);

CREATE TABLE favorito (
  id_alumno INT NOT NULL,
  id_oferta INT NOT NULL,
  PRIMARY KEY (id_alumno, id_oferta),
  FOREIGN KEY (id_alumno) REFERENCES alumno(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_oferta) REFERENCES oferta(id) ON DELETE CASCADE
);
