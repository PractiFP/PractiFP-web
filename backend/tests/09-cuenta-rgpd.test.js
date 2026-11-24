// Recuperación de contraseña, cierre de sesiones, derechos del RGPD (descargar y eliminar
// los datos), actualización automática del esquema y límite de intentos en la base de datos.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, terminar, api, entrar, CUENTAS, PASSWORD } from './ayuda.js';

const { query } = await import('../src/config/db.js');
const { enviadosEnPruebas } = await import('../src/services/correo.js');
const { env } = await import('../src/config/env.js');
const almacen = await import('../src/services/almacen.js');
const { actualizarEsquema } = await import('../src/config/migraciones.js');

const esperar = (ms) => new Promise((ok) => { setTimeout(ok, ms); });
// Los tokens JWT llevan la hora en segundos: se espera algo más de 1 s para que el token viejo sea "anterior"
const pasarUnSegundo = () => esperar(1100);

before(iniciar);
after(terminar);

describe('Consentimiento al registrarse', () => {
  const nuevo = { tipo: 'ALUMNO', email: 'consiente@correo.example', password: 'secreta123', nombre: 'Ana', apellidos: 'Prueba', cicloId: 1 };

  it('sin aceptar la política de privacidad no se crea la cuenta', async () => {
    const r = await api('POST', '/auth/registro', { cuerpo: nuevo });
    assert.equal(r.status, 400);
    assert.ok(r.error.detalles.aceptaPrivacidad);
    const r2 = await api('POST', '/auth/registro', { cuerpo: { ...nuevo, aceptaPrivacidad: 'sí' } });
    assert.equal(r2.status, 400, 'solo vale el valor true');
  });

  it('al aceptarla se guarda la fecha del consentimiento', async () => {
    const r = await api('POST', '/auth/registro', { cuerpo: { ...nuevo, aceptaPrivacidad: true } });
    assert.equal(r.status, 201);
    const datos = await api('GET', '/cuenta/datos', { token: r.data.token });
    assert.ok(datos.data.cuenta.privacidadAceptada);
  });
});

describe('Recuperar la contraseña', () => {
  const MENSAJE = /Si hay una cuenta con ese correo/;
  let enlace;

  it('con un correo que no existe responde lo mismo y no envía nada', async () => {
    const r = await api('POST', '/auth/recuperar', { cuerpo: { email: 'nadie@nada.example' } });
    assert.equal(r.status, 200);
    assert.match(r.data.mensaje, MENSAJE);
    assert.equal(enviadosEnPruebas.length, 0);
  });

  it('con un correo registrado envía un enlace de un solo uso', async () => {
    const r = await api('POST', '/auth/recuperar', { cuerpo: { email: CUENTAS.ana.toUpperCase() } });
    assert.equal(r.status, 200);
    assert.match(r.data.mensaje, MENSAJE);
    assert.equal(enviadosEnPruebas.length, 1);
    const correo = enviadosEnPruebas[0];
    assert.equal(correo.para, CUENTAS.ana);
    enlace = correo.texto.match(/\/restablecer-contrasena#([\w-]+)/)?.[1];
    assert.ok(enlace, 'el correo lleva el enlace');
    // En la base de datos solo está el hash, no el código del enlace
    const filas = await query('SELECT token_hash FROM RECUPERACIONES');
    assert.equal(filas.length, 1);
    assert.notEqual(filas[0].token_hash, enlace);
  });

  it('no envía otro correo a la misma cuenta antes de 2 minutos', async () => {
    const r = await api('POST', '/auth/recuperar', { cuerpo: { email: CUENTAS.ana } });
    assert.equal(r.status, 200);
    assert.equal(enviadosEnPruebas.length, 1);
  });

  it('rechaza un enlace inventado', async () => {
    const r = await api('POST', '/auth/restablecer', { cuerpo: { token: 'a'.repeat(43), password: 'nueva-clave-1' } });
    assert.equal(r.status, 400);
    assert.match(r.error.mensaje, /no es válido o ha caducado/);
  });

  it('cambia la contraseña, cierra las sesiones abiertas y el enlace ya no vale', async () => {
    const tokenViejo = await entrar('ana');
    await pasarUnSegundo();

    const corta = await api('POST', '/auth/restablecer', { cuerpo: { token: enlace, password: '123' } });
    assert.equal(corta.status, 400);
    assert.ok(corta.error.detalles.password);

    const r = await api('POST', '/auth/restablecer', { cuerpo: { token: enlace, password: 'nueva-clave-1' } });
    assert.equal(r.status, 200);

    const yo = await api('GET', '/auth/yo', { token: tokenViejo });
    assert.equal(yo.status, 401);
    assert.match(yo.error.mensaje, /contraseña ha cambiado/);

    assert.equal((await api('POST', '/auth/login', { cuerpo: { email: CUENTAS.ana, password: 'nueva-clave-1' } })).status, 200);
    assert.equal((await api('POST', '/auth/restablecer', { cuerpo: { token: enlace, password: 'otra-clave-2' } })).status, 400);
  });

  it('un enlace caducado no vale', async () => {
    await query('DELETE FROM RECUPERACIONES');
    const r = await api('POST', '/auth/recuperar', { cuerpo: { email: CUENTAS.nubalia } });
    assert.equal(r.status, 200);
    const codigo = enviadosEnPruebas.at(-1).texto.match(/#([\w-]+)/)[1];
    await query('UPDATE RECUPERACIONES SET caduca = NOW() - INTERVAL 1 MINUTE');
    assert.equal((await api('POST', '/auth/restablecer', { cuerpo: { token: codigo, password: 'nueva-clave-1' } })).status, 400);
  });

  it('en producción sin correo configurado avisa de que no está disponible', async () => {
    const anterior = env.nodeEnv;
    env.nodeEnv = 'production';
    try {
      const r = await api('POST', '/auth/recuperar', { cuerpo: { email: CUENTAS.carlos } });
      assert.equal(r.status, 503);
    } finally {
      env.nodeEnv = anterior;
    }
  });
});

describe('Cambiar la contraseña desde la configuración', () => {
  it('devuelve un token nuevo y cierra las demás sesiones', async () => {
    const otroDispositivo = await entrar('carlos');
    const esteDispositivo = await entrar('carlos');
    await pasarUnSegundo();
    const r = await api('PUT', '/cuenta/password', { token: esteDispositivo, cuerpo: { actual: PASSWORD, nueva: 'carlos-nueva-1' } });
    assert.equal(r.status, 200);
    assert.ok(r.data.token);
    assert.equal((await api('GET', '/auth/yo', { token: r.data.token })).status, 200);
    assert.equal((await api('GET', '/auth/yo', { token: otroDispositivo })).status, 401);
  });
});

describe('Descargar mis datos', () => {
  it('un alumno descarga su perfil, candidaturas, favoritos y proyectos', async () => {
    const r = await api('GET', '/cuenta/datos', { token: await entrar('lucia') });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-disposition'), /attachment/);
    assert.equal(r.data.cuenta.email, CUENTAS.lucia);
    assert.equal(r.data.perfil.nombre, 'Lucía');
    assert.equal(r.data.candidaturas.length, 4);
    for (const clave of ['tecnologias', 'proyectos', 'favoritos', 'valoracionesEscritas']) assert.ok(Array.isArray(r.data[clave]), clave);
    // No incluye el correo de ninguna otra persona
    const correos = JSON.stringify(r.data).match(/[\w.+-]+@[\w-]+\.[\w.]+/g);
    assert.deepEqual([...new Set(correos)], [CUENTAS.lucia]);
  });

  it('una empresa descarga su perfil y sus ofertas, sin datos de los candidatos', async () => {
    const r = await api('GET', '/cuenta/datos', { token: await entrar('nubalia') });
    assert.equal(r.status, 200);
    assert.ok(r.data.ofertas.length > 0);
    assert.equal(typeof r.data.ofertas[0].candidaturasRecibidas, 'number');
    assert.doesNotMatch(JSON.stringify(r.data), /Lucía|correo\.example/);
  });

  it('hace falta iniciar sesión', async () => {
    assert.equal((await api('GET', '/cuenta/datos')).status, 401);
  });
});

describe('Eliminar la cuenta', () => {
  it('pide la contraseña correcta', async () => {
    const token = await entrar('lucia');
    assert.equal((await api('DELETE', '/cuenta', { token, cuerpo: {} })).status, 400);
    const r = await api('DELETE', '/cuenta', { token, cuerpo: { password: 'incorrecta' } });
    assert.equal(r.status, 400);
    assert.ok(r.error.detalles.password);
  });

  it('un alumno borra su cuenta con todos sus datos y su currículum', async () => {
    const token = await entrar('lucia');
    assert.ok(await almacen.leer('cv_seed_1.pdf'), 'el currículum existe antes');
    const r = await api('DELETE', '/cuenta', { token, cuerpo: { password: PASSWORD } });
    assert.equal(r.status, 200);

    assert.equal((await api('POST', '/auth/login', { cuerpo: { email: CUENTAS.lucia, password: PASSWORD } })).status, 401);
    assert.equal((await api('GET', '/auth/yo', { token })).status, 401);
    assert.equal(await almacen.leer('cv_seed_1.pdf'), null);
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM CANDIDATURAS WHERE alumno_id = 1');
    assert.equal(n, 0);
    assert.equal((await api('GET', '/alumnos/1')).status, 404);
  });

  it('una empresa borra su cuenta y sus ofertas', async () => {
    const r = await api('DELETE', '/cuenta', { token: await entrar('turia'), cuerpo: { password: PASSWORD } });
    assert.equal(r.status, 200);
    const [{ n }] = await query('SELECT COUNT(*) AS n FROM OFERTAS WHERE empresa_id = 3');
    assert.equal(n, 0);
  });

  it('no se puede borrar la única cuenta de administración', async () => {
    const r = await api('DELETE', '/cuenta', { token: await entrar('admin'), cuerpo: { password: PASSWORD } });
    assert.equal(r.status, 409);
  });
});

describe('Actualización automática de una base de datos antigua', () => {
  it('añade las columnas y tablas nuevas sin tocar los datos', async () => {
    const [{ antes }] = await query('SELECT COUNT(*) AS antes FROM USUARIOS');
    await query('DROP TABLE INTENTOS');
    await query('DROP TABLE RECUPERACIONES');
    await query('ALTER TABLE USUARIOS DROP COLUMN sesiones_desde');
    await query('ALTER TABLE USUARIOS DROP COLUMN privacidad_aceptada');

    await actualizarEsquema();
    await actualizarEsquema(); // la segunda vez no hace nada

    const columnas = (await query("SHOW COLUMNS FROM USUARIOS")).map((c) => c.Field);
    assert.ok(columnas.includes('sesiones_desde') && columnas.includes('privacidad_aceptada'));
    assert.equal((await query("SHOW TABLES LIKE 'INTENTOS'")).length, 1);
    assert.equal((await query("SHOW TABLES LIKE 'RECUPERACIONES'")).length, 1);
    const [{ despues }] = await query('SELECT COUNT(*) AS despues FROM USUARIOS');
    assert.equal(despues, antes);
  });
});

describe('Límite de intentos guardado en la base de datos', () => {
  it('los inicios de sesión correctos no cuentan', async () => {
    for (let i = 0; i < 15; i++) await entrar('nubalia');
  });

  it('tras 10 intentos fallidos bloquea el inicio de sesión, también con la contraseña buena', async () => {
    let bloqueado = null;
    for (let i = 1; i <= 11 && !bloqueado; i++) {
      const r = await api('POST', '/auth/login', { cuerpo: { email: CUENTAS.carlos, password: 'mala' } });
      if (r.status === 429) bloqueado = { intento: i, r };
      else assert.equal(r.status, 401);
    }
    assert.equal(bloqueado?.intento, 11, 'el intento 11 se bloquea');
    assert.ok(Number(bloqueado.r.headers.get('retry-after')) > 0);
    assert.match(bloqueado.r.error.mensaje, /Demasiados intentos/);
    assert.equal((await api('POST', '/auth/login', { cuerpo: { email: CUENTAS.nubalia, password: PASSWORD } })).status, 429);
  });

  it('el contador no guarda direcciones IP', async () => {
    const filas = await query('SELECT clave FROM INTENTOS');
    assert.ok(filas.length > 0);
    for (const f of filas) assert.match(f.clave, /^[0-9a-f]{64}$/);
  });

  it('pedir correos de recuperación cuenta siempre, aunque la respuesta sea correcta', async () => {
    let bloqueado = false;
    for (let i = 0; i < 6 && !bloqueado; i++) {
      const r = await api('POST', '/auth/recuperar', { cuerpo: { email: `alguien${i}@nada.example` } });
      bloqueado = r.status === 429;
    }
    assert.ok(bloqueado);
  });
});
