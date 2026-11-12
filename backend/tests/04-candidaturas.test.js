import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, terminar, api, entrar } from './ayuda.js';

let lucia, ana, nubalia, turia;
before(async () => {
  await iniciar();
  [lucia, ana, nubalia, turia] = await Promise.all(['lucia', 'ana', 'nubalia', 'turia'].map(entrar));
});
after(terminar);

describe('Inscripción en ofertas', () => {
  it('no se puede inscribir dos veces, ni en ofertas cerradas, ni siendo empresa', async () => {
    assert.equal((await api('POST', '/ofertas/1/candidaturas', { token: lucia })).status, 409);
    assert.equal((await api('POST', '/ofertas/3/candidaturas', { token: ana })).status, 409);
    assert.equal((await api('POST', '/ofertas/6/candidaturas', { token: nubalia })).status, 403);
    assert.equal((await api('POST', '/ofertas/6/candidaturas')).status, 401);
  });
  it('dos inscripciones simultáneas crean una sola candidatura', async () => {
    const [a, b] = await Promise.all([api('POST', '/ofertas/6/candidaturas', { token: ana }), api('POST', '/ofertas/6/candidaturas', { token: ana })]);
    assert.deepEqual([a.status, b.status].sort(), [201, 409]);
  });
  it('el detalle y la búsqueda muestran al alumno su candidatura y sus favoritos', async () => {
    const d = await api('GET', '/ofertas/6', { token: ana });
    assert.equal(d.data.miCandidatura.estado, 'ENVIADA');
    const b = await api('GET', '/ofertas?ciclo=DAW', { token: lucia });
    assert.equal(b.data.ofertas.find((o) => o.id === 6).esFavorita, true);
    assert.equal(b.data.ofertas.find((o) => o.id === 2).miEstado, 'RECHAZADA');
  });
});

describe('Favoritos', () => {
  it('guardar dos veces no duplica y quitar dos veces da 404', async () => {
    assert.equal((await api('PUT', '/alumnos/yo/favoritos/4', { token: lucia })).data.yaEstaba, false);
    assert.equal((await api('PUT', '/alumnos/yo/favoritos/4', { token: lucia })).data.yaEstaba, true);
    assert.equal((await api('GET', '/alumnos/yo/favoritos', { token: lucia })).data.length, 3);
    assert.equal((await api('DELETE', '/alumnos/yo/favoritos/4', { token: lucia })).status, 200);
    assert.equal((await api('DELETE', '/alumnos/yo/favoritos/4', { token: lucia })).status, 404);
  });
});

describe('Gestión de candidatos por la empresa', () => {
  it('lista sus candidatos con la coincidencia de tecnologías', async () => {
    const r = await api('GET', '/empresas/yo/candidaturas', { token: nubalia });
    assert.equal(r.data.length, 5);
    const c = r.data.find((x) => x.alumno.nombre === 'Lucía' && x.oferta.id === 1);
    assert.deepEqual(c.coincidencia, { obligatorias: 2, tiene: 2 });
    assert.equal((await api('GET', '/empresas/yo/candidaturas?oferta=2&estado=ENVIADA', { token: nubalia })).data.length, 1);
  });
  it('solo la empresa de la oferta puede cambiar el estado, y solo a estados válidos', async () => {
    const { data } = await api('GET', '/empresas/yo/candidaturas?oferta=1', { token: nubalia });
    const id = data[0].id;
    assert.equal((await api('PATCH', `/candidaturas/${id}/estado`, { token: nubalia, cuerpo: { estado: 'CONTRATADA' } })).status, 400);
    assert.equal((await api('PATCH', `/candidaturas/${id}/estado`, { token: turia, cuerpo: { estado: 'ACEPTADA' } })).status, 403);
    assert.equal((await api('PATCH', `/candidaturas/${id}/estado`, { token: lucia, cuerpo: { estado: 'ACEPTADA' } })).status, 403);
    assert.equal((await api('PATCH', `/candidaturas/${id}/estado`, { token: nubalia, cuerpo: { estado: 'ACEPTADA' } })).status, 200);
    const mias = await api('GET', '/alumnos/yo/candidaturas', { token: lucia });
    assert.equal(mias.data.find((c) => c.oferta.id === 1).estado, 'ACEPTADA');
  });
});
