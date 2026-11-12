import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, terminar, api, entrar, CUENTAS, PASSWORD } from './ayuda.js';

before(iniciar);
after(terminar);

describe('Salud y catálogos', () => {
  it('la API y la base de datos responden', async () => {
    const r = await api('GET', '/salud');
    assert.equal(r.status, 200);
    assert.equal(r.data.baseDatos.conectada, true);
  });
  it('ciclos y tecnologías son públicos', async () => {
    assert.equal((await api('GET', '/ciclos')).data.length, 4);
    assert.equal((await api('GET', '/tecnologias')).data.length, 20);
  });
  it('una ruta inexistente devuelve 404 con el formato de error común', async () => {
    const r = await api('GET', '/no-existe');
    assert.equal(r.status, 404);
    assert.match(r.error.mensaje, /No existe la ruta/);
  });
});

describe('Registro', () => {
  it('valida los campos y devuelve los errores por campo', async () => {
    const r = await api('POST', '/auth/registro', { cuerpo: { tipo: 'ALUMNO', email: 'mal', password: '123' } });
    assert.equal(r.status, 400);
    for (const campo of ['email', 'password', 'nombre', 'apellidos', 'cicloId']) assert.ok(r.error.detalles[campo], campo);
  });
  it('registra un alumno con su perfil y devuelve un token', async () => {
    const r = await api('POST', '/auth/registro', { cuerpo: { tipo: 'ALUMNO', email: 'Nuevo@Correo.example', password: 'secreta123', nombre: 'Nuevo', apellidos: 'Alumno', cicloId: 2 } });
    assert.equal(r.status, 201);
    assert.ok(r.data.token);
    assert.equal(r.data.usuario.email, 'nuevo@correo.example');
    assert.equal(r.data.usuario.ciclo, 'DAW');
  });
  it('registra una empresa sin verificar', async () => {
    const r = await api('POST', '/auth/registro', { cuerpo: { tipo: 'EMPRESA', email: 'empresa@nueva.example', password: 'secreta123', nombre: 'Nueva SL', localidad: 'Soria' } });
    assert.equal(r.status, 201);
    assert.equal(r.data.usuario.verificada, false);
  });
  it('no permite un correo repetido', async () => {
    const r = await api('POST', '/auth/registro', { cuerpo: { tipo: 'EMPRESA', email: CUENTAS.lucia, password: 'secreta123', nombre: 'X', localidad: 'Y' } });
    assert.equal(r.status, 409);
    assert.ok(r.error.detalles.email);
  });
  it('no permite registrarse como administrador', async () => {
    const r = await api('POST', '/auth/registro', { cuerpo: { tipo: 'ADMIN', email: 'x@x.example', password: 'secreta123', nombre: 'X' } });
    assert.equal(r.status, 400);
  });
});

describe('Inicio de sesión y sesión', () => {
  it('rechaza una contraseña incorrecta y un correo inexistente con el mismo mensaje', async () => {
    const a = await api('POST', '/auth/login', { cuerpo: { email: CUENTAS.admin, password: 'mala' } });
    const b = await api('POST', '/auth/login', { cuerpo: { email: 'nadie@nada.example', password: PASSWORD } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.error.mensaje, b.error.mensaje);
  });
  it('una cuenta desactivada no puede entrar', async () => {
    const r = await api('POST', '/auth/login', { cuerpo: { email: CUENTAS.pablo, password: PASSWORD } });
    assert.equal(r.status, 403);
  });
  it('/auth/yo devuelve el usuario sin datos sensibles', async () => {
    const token = await entrar('lucia');
    const r = await api('GET', '/auth/yo', { token });
    assert.equal(r.status, 200);
    assert.equal(r.data.rol, 'ALUMNO');
    assert.ok(!JSON.stringify(r.data).match(/password|hash/i));
  });
  it('sin token o con un token falso devuelve 401', async () => {
    assert.equal((await api('GET', '/auth/yo')).status, 401);
    assert.equal((await api('GET', '/auth/yo', { token: 'a.b.c' })).status, 401);
  });
});

describe('Permisos por rol', () => {
  it('cada panel solo es accesible para su rol', async () => {
    const [alumno, empresa, admin] = await Promise.all([entrar('lucia'), entrar('nubalia'), entrar('admin')]);
    assert.equal((await api('GET', '/panel/alumno', { token: alumno })).status, 200);
    assert.equal((await api('GET', '/panel/empresa', { token: empresa })).status, 200);
    assert.equal((await api('GET', '/panel/admin', { token: admin })).status, 200);
    assert.equal((await api('GET', '/panel/admin', { token: alumno })).status, 403);
    assert.equal((await api('GET', '/panel/empresa', { token: admin })).status, 403);
    assert.equal((await api('GET', '/panel/alumno', { token: empresa })).status, 403);
  });
});

describe('Configuración de la cuenta', () => {
  it('cambia la contraseña comprobando la actual', async () => {
    const token = await entrar('carlos');
    assert.equal((await api('PUT', '/cuenta/password', { token, cuerpo: { actual: 'mala', nueva: 'nuevaclave1' } })).status, 400);
    assert.equal((await api('PUT', '/cuenta/password', { token, cuerpo: { actual: PASSWORD, nueva: 'nuevaclave1' } })).status, 200);
    assert.equal((await api('POST', '/auth/login', { cuerpo: { email: CUENTAS.carlos, password: 'nuevaclave1' } })).status, 200);
  });
  it('no permite cambiar el correo a uno que ya existe', async () => {
    const token = await entrar('ana');
    const r = await api('PUT', '/cuenta/email', { token, cuerpo: { email: CUENTAS.lucia, password: PASSWORD } });
    assert.equal(r.status, 409);
  });
});
