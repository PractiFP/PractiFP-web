// Lógica de registro, inicio de sesión y emisión de tokens JWT.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { transaction } from '../config/db.js';
import { HttpError } from '../utils/HttpError.js';
import { validar, reglas, limpiar } from '../utils/validadores.js';
import * as Usuario from '../models/usuarioModel.js';
import * as Alumno from '../models/alumnoModel.js';
import * as Empresa from '../models/empresaModel.js';
import * as Ciclo from '../models/cicloModel.js';

const COSTE_BCRYPT = 10;
// Hash ficticio para que un email inexistente tarde lo mismo que una contraseña incorrecta
const HASH_FICTICIO = bcrypt.hashSync('hash-ficticio-practifp', COSTE_BCRYPT);

export const PASSWORD_MIN = 8;

export function firmarToken(usuario) {
  return jwt.sign({ rol: usuario.rol }, env.jwt.secret, { subject: String(usuario.id), expiresIn: env.jwt.expiresIn, algorithm: 'HS256' });
}

export function verificarToken(token) {
  // Se fija el algoritmo para que no se acepten tokens firmados de otra forma (p. ej. "none")
  return jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
}

export async function registrar(cuerpo = {}) {
  const datos = {
    tipo: cuerpo.tipo,
    email: limpiar(cuerpo.email)?.toLowerCase(),
    password: cuerpo.password,
    nombre: limpiar(cuerpo.nombre),
    apellidos: limpiar(cuerpo.apellidos),
    cicloId: cuerpo.cicloId,
    localidad: limpiar(cuerpo.localidad),
  };

  const comunes = {
    tipo: [reglas.requerido('Elige el tipo de cuenta.'), reglas.unoDe(['ALUMNO', 'EMPRESA'], 'Tipo de cuenta no válido.')],
    email: [reglas.requerido(), reglas.email(), reglas.longitudMax(255)],
    password: [reglas.requerido(), reglas.longitudMin(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`), reglas.longitudMax(72)],
    nombre: [reglas.requerido(), reglas.longitudMax(datos.tipo === 'EMPRESA' ? 150 : 80)],
  };
  const especificos = datos.tipo === 'EMPRESA'
    ? { localidad: [reglas.requerido(), reglas.longitudMax(100)] }
    : { apellidos: [reglas.requerido(), reglas.longitudMax(120)], cicloId: [reglas.requerido('Elige tu ciclo formativo.'), reglas.enteroPositivo('Ciclo no válido.')] };
  validar(datos, { ...comunes, ...especificos });
  // RGPD: el consentimiento tiene que ser expreso (una casilla marcada por el usuario)
  if (cuerpo.aceptaPrivacidad !== true) {
    throw new HttpError(400, 'Revisa los datos del formulario.', { aceptaPrivacidad: 'Debes aceptar la política de privacidad para crear la cuenta.' });
  }

  if (datos.tipo === 'ALUMNO' && !(await Ciclo.existe(datos.cicloId))) {
    throw new HttpError(400, 'Revisa los datos del formulario.', { cicloId: 'El ciclo elegido no existe.' });
  }
  if (await Usuario.existeEmail(datos.email)) {
    throw new HttpError(409, 'Ya existe una cuenta con este correo.', { email: 'Ya existe una cuenta con este correo.' });
  }

  const passwordHash = await bcrypt.hash(datos.password, COSTE_BCRYPT);

  // Usuario y perfil se crean juntos: si falla uno, no se crea ninguno
  const id = await transaction(async (conn) => {
    const usuarioId = await Usuario.crear(conn, { email: datos.email, passwordHash, rol: datos.tipo, aceptaPrivacidad: true });
    if (datos.tipo === 'ALUMNO') {
      await Alumno.crear(conn, { usuarioId, nombre: datos.nombre, apellidos: datos.apellidos, cicloId: Number(datos.cicloId) });
    } else {
      await Empresa.crear(conn, { usuarioId, nombre: datos.nombre, localidad: datos.localidad });
    }
    return usuarioId;
  }).catch((err) => {
    // Dos registros simultáneos con el mismo email
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'Ya existe una cuenta con este correo.', { email: 'Ya existe una cuenta con este correo.' });
    throw err;
  });

  const usuario = await Usuario.obtenerSesion(id);
  return { token: firmarToken(usuario), usuario };
}

export async function iniciarSesion(cuerpo = {}) {
  const email = limpiar(cuerpo.email)?.toLowerCase();
  const { password } = cuerpo;
  validar({ email, password }, {
    email: [reglas.requerido('Introduce tu correo.'), reglas.email()],
    password: [reglas.requerido('Introduce tu contraseña.')],
  });

  const usuario = await Usuario.buscarPorEmail(email);
  const coincide = await bcrypt.compare(String(password), usuario?.passwordHash ?? HASH_FICTICIO);
  if (!usuario || !coincide) throw new HttpError(401, 'Correo o contraseña incorrectos.');
  if (!usuario.activo) throw new HttpError(403, 'Esta cuenta está desactivada. Contacta con el administrador.');

  const sesion = await Usuario.obtenerSesion(usuario.id);
  return { token: firmarToken(sesion), usuario: sesion };
}
