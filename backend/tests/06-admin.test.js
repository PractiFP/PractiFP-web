import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, terminar, api, entrar, CUENTAS, PASSWORD } from './ayuda.js';

let admin, lucia, nubalia;
before(async () => {
  await iniciar();
  [admin, lucia, nubalia] = await Promise.all(['admin', 'lucia', 'nubalia'].map(entrar));
});
after(terminar);

describe('Acceso al panel de administración', () => {
  it('solo los administradores', async () => {
    assert.equal((await api('GET', '/admin/usuarios')).status, 401);
    assert.equal((await api('GET', '/admin/usuarios', { token: lucia })).status, 403);
    assert.equal((await api('GET', '/admin/usuarios', { token: nubalia })).status, 403);
    assert.equal((await api('GET', '/admin/usuarios', { token: admin })).status, 200);
  });
});

describe('Usuarios', () => {
  it('filtra por rol, estado y texto', async () => {
    assert.equal((await api('GET', '/admin/usuarios', { token: admin })).data.length, 15);
    const r = await api('GET', '/admin/usuarios?rol=ALUMNO&activo=no', { token: admin });
    assert.deepEqual(r.data.map((u) => u.nombre), ['Pablo Sanz Ortega']);
  });
  it('desactivar una cuenta le quita el acceso al momento y oculta su perfil', async () => {
    assert.equal((await api('PATCH', '/admin/usuarios/1/activo', { token: admin, cuerpo: { activo: false } })).status, 400);
    assert.equal((await api('PATCH', '/admin/usuarios/2/activo', { token: admin, cuerpo: { activo: false } })).status, 200);
    assert.equal((await api('GET', '/auth/yo', { token: lucia })).status, 403);
    assert.equal((await api('POST', '/auth/login', { cuerpo: { email: CUENTAS.lucia, password: PASSWORD } })).status, 403);
    assert.equal((await api('GET', '/alumnos/1')).status, 404);
    assert.equal((await api('PATCH', '/admin/usuarios/2/activo', { token: admin, cuerpo: { activo: true } })).status, 200);
  });
  it('las ofertas de una empresa desactivada dejan de verse', async () => {
    await api('PATCH', '/admin/usuarios/8/activo', { token: admin, cuerpo: { activo: false } });
    assert.equal((await api('GET', '/ofertas?empresa=1')).data.total, 0);
    assert.equal((await api('GET', '/ofertas/1')).status, 404);
    await api('PATCH', '/admin/usuarios/8/activo', { token: admin, cuerpo: { activo: true } });
    assert.equal((await api('GET', '/ofertas?empresa=1')).data.total, 2);
  });
});

describe('Empresas, ofertas y valoraciones', () => {
  it('verifica y quita la verificación de una empresa', async () => {
    assert.equal((await api('GET', '/admin/empresas?verificada=no', { token: admin })).data.length, 2);
    await api('PATCH', '/admin/empresas/4/verificada', { token: admin, cuerpo: { verificada: true } });
    assert.equal((await api('GET', '/empresas/4')).data.verificada, true);
  });
  it('desactiva y elimina ofertas', async () => {
    assert.equal((await api('PATCH', '/admin/ofertas/11/activa', { token: admin, cuerpo: { activa: false } })).status, 200);
    assert.equal((await api('GET', '/ofertas?q=ciberseguridad')).data.total, 0);
    assert.equal((await api('DELETE', '/admin/ofertas/11', { token: admin })).status, 200);
    assert.equal((await api('DELETE', '/admin/ofertas/11', { token: admin })).status, 404);
  });
  it('modera valoraciones: aprobar las publica y rechazar las oculta', async () => {
    const { data } = await api('GET', '/admin/valoraciones', { token: admin });
    const v = data.valoraciones[0];
    assert.equal((await api('PATCH', `/admin/valoraciones/${v.id}`, { token: admin, cuerpo: { estado: 'PUBLICADA' } })).status, 400);
    await api('PATCH', `/admin/valoraciones/${v.id}`, { token: admin, cuerpo: { estado: 'APROBADA' } });
    assert.ok((await api('GET', `/empresas/${v.empresa.id}/valoraciones`)).data.valoraciones.some((x) => x.id === v.id));
    await api('PATCH', `/admin/valoraciones/${v.id}`, { token: admin, cuerpo: { estado: 'RECHAZADA' } });
    assert.ok(!(await api('GET', `/empresas/${v.empresa.id}/valoraciones`)).data.valoraciones.some((x) => x.id === v.id));
    assert.equal((await api('DELETE', `/admin/valoraciones/${v.id}`, { token: admin })).status, 200);
  });
});
