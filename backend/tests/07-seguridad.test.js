import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { iniciar, terminar, api, entrar, CUENTAS, urlBase } from './ayuda.js';

let tokens;
before(async () => {
  await iniciar();
  tokens = { visitante: null, alumno: await entrar('lucia'), empresa: await entrar('nubalia'), admin: await entrar('admin') };
});
after(terminar);

describe('Cabeceras y tokens', () => {
  it('las respuestas incluyen cabeceras de seguridad', async () => {
    const { headers } = await api('GET', '/salud');
    assert.equal(headers.get('x-content-type-options'), 'nosniff');
    assert.equal(headers.get('x-frame-options'), 'DENY');
    assert.match(headers.get('content-security-policy'), /default-src 'none'/);
    assert.equal(headers.get('x-powered-by'), null);
  });
  it('rechaza tokens sin firma ("none") o firmados con otro secreto', async () => {
    const sinFirma = jwt.sign({ rol: 'ADMIN' }, null, { algorithm: 'none', subject: '1' });
    const otroSecreto = jwt.sign({ rol: 'ADMIN' }, 'otro-secreto-cualquiera', { subject: '1' });
    assert.equal((await api('GET', '/admin/usuarios', { token: sinFirma })).status, 401);
    assert.equal((await api('GET', '/admin/usuarios', { token: otroSecreto })).status, 401);
  });
  it('un token caducado devuelve 401 con un mensaje claro', async () => {
    const caducado = jwt.sign({ rol: 'ALUMNO' }, process.env.JWT_SECRET, { subject: '2', expiresIn: -10 });
    const r = await api('GET', '/auth/yo', { token: caducado });
    assert.equal(r.status, 401);
    assert.match(r.error.mensaje, /caducado/);
  });
  it('un JSON mal formado devuelve 400 con un mensaje claro', async () => {
    const res = await fetch(`${urlBase()}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email": ' });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error.mensaje, /JSON/);
  });
  it('un cuerpo de más de 100 KB se rechaza', async () => {
    const res = await fetch(`${urlBase()}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a'.repeat(200 * 1024) }) });
    assert.equal(res.status, 413);
    assert.match((await res.json()).error.mensaje, /demasiado grandes/);
  });
});

describe('Datos personales', () => {
  const rutas = ['/ofertas', '/ofertas/1', '/empresas', '/empresas/1', '/empresas/1/valoraciones', '/alumnos/1', '/auth/yo',
    '/alumnos/yo', '/alumnos/yo/candidaturas', '/alumnos/yo/favoritos', '/alumnos/yo/proyectos',
    '/empresas/yo', '/empresas/yo/ofertas', '/empresas/yo/candidaturas', '/empresas/yo/valoraciones',
    '/admin/usuarios', '/admin/empresas', '/admin/valoraciones'];

  it('ninguna respuesta incluye contraseñas, hashes ni rutas internas de archivos', async () => {
    for (const [rol, token] of Object.entries(tokens)) {
      for (const ruta of rutas) {
        const res = await api('GET', ruta, { token });
        if (res.status >= 400) continue;
        const texto = JSON.stringify(res.data);
        assert.doesNotMatch(texto, /password|hash|\$2[aby]\$|cv_?ruta|imagen_?ruta/i, `${rol} ${ruta}`);
      }
    }
  });
  it('los correos de los alumnos solo los ven el propio alumno y los administradores', async () => {
    const publicas = ['/ofertas', '/empresas', '/empresas/1/valoraciones', '/alumnos/1', '/alumnos/2'];
    for (const ruta of publicas) {
      for (const token of [null, tokens.empresa]) {
        const texto = JSON.stringify((await api('GET', ruta, { token })).data);
        assert.ok(!texto.includes(CUENTAS.lucia) && !texto.includes(CUENTAS.carlos), ruta);
      }
    }
    const candidatos = JSON.stringify((await api('GET', '/empresas/yo/candidaturas', { token: tokens.empresa })).data);
    assert.ok(!candidatos.includes('@correo.example'), 'la empresa no ve el correo de sus candidatos');
  });
});
