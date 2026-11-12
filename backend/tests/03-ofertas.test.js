import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, terminar, api, entrar, fechaDentroDe } from './ayuda.js';

let nubalia, turia, lucia;
before(async () => {
  await iniciar();
  [nubalia, turia, lucia] = await Promise.all(['nubalia', 'turia', 'lucia'].map(entrar));
});
after(terminar);

const total = async (q) => (await api('GET', `/ofertas?${q}`)).data.total;

describe('Búsqueda de ofertas', () => {
  it('por defecto muestra solo las abiertas', async () => {
    assert.equal(await total(''), 10);
    assert.equal(await total('abiertas=no'), 12);
  });
  it('combina filtros', async () => {
    assert.equal(await total('ciclo=DAW'), 4);
    assert.equal(await total('modalidad=REMOTA&remunerada=si'), 2);
    assert.equal(await total('localidad=Madrid&empresa=1'), 2);
    assert.equal(await total('ciclo=XXX'), 0);
  });
  it('las tecnologías elegidas deben estar todas en la oferta', async () => {
    const r = await api('GET', '/ofertas?tecnologias=1,4');
    assert.deepEqual(r.data.ofertas.map((o) => o.id), [6]);
  });
  it('la búsqueda por texto no se puede usar para inyectar SQL', async () => {
    assert.equal(await total('q=react'), 1);
    assert.equal(await total(`q=${encodeURIComponent("' OR 1=1 --")}`), 0);
    assert.equal(await total('q=%25'), 0);
  });
  it('detalle de oferta y 404 si no existe', async () => {
    const r = await api('GET', '/ofertas/1');
    assert.equal(r.data.empresa.nombre, 'Nubalia Software');
    assert.equal((await api('GET', '/ofertas/999')).status, 404);
    assert.equal((await api('GET', '/ofertas/abc')).status, 404);
  });
});

describe('Gestión de ofertas por la empresa', () => {
  const base = { titulo: 'Prácticas de QA', descripcion: 'Pruebas automáticas y manuales de nuestras apps.', cicloId: 1, localidad: 'Madrid', modalidad: 'HIBRIDA', remunerada: true, salario: 350, plazas: 2, fechaLimite: fechaDentroDe(20), activa: true, tecnologias: [{ id: 8, obligatoria: true }, { id: 15, obligatoria: false }] };
  let id;

  it('un alumno no puede publicar ofertas', async () => {
    assert.equal((await api('POST', '/ofertas', { token: lucia, cuerpo: base })).status, 403);
  });
  it('valida los datos (plazas > 0, salario ≥ 0, fecha, tecnologías)', async () => {
    const r = await api('POST', '/ofertas', { token: nubalia, cuerpo: { ...base, titulo: '', plazas: 0, salario: -5, fechaLimite: '2020-01-01', modalidad: 'X', tecnologias: [] } });
    assert.equal(r.status, 400);
    for (const c of ['titulo', 'plazas', 'salario', 'fechaLimite', 'modalidad', 'tecnologias']) assert.ok(r.error.detalles[c], c);
    assert.equal((await api('POST', '/ofertas', { token: nubalia, cuerpo: { ...base, tecnologias: [{ id: 8 }, { id: 8 }] } })).status, 400);
  });
  it('publica una oferta', async () => {
    const r = await api('POST', '/ofertas', { token: nubalia, cuerpo: base });
    assert.equal(r.status, 201);
    assert.equal(r.data.tecnologias.length, 2);
    id = r.data.id;
    assert.equal(await total('q=QA'), 1);
  });
  it('otra empresa no puede editarla, desactivarla ni borrarla', async () => {
    assert.equal((await api('PUT', `/ofertas/${id}`, { token: turia, cuerpo: base })).status, 403);
    assert.equal((await api('PATCH', `/ofertas/${id}/estado`, { token: turia, cuerpo: { activa: false } })).status, 403);
    assert.equal((await api('DELETE', `/ofertas/${id}`, { token: turia })).status, 403);
  });
  it('la empresa la edita, la desactiva y la elimina', async () => {
    const e = await api('PUT', `/ofertas/${id}`, { token: nubalia, cuerpo: { ...base, titulo: 'QA y testing', tecnologias: [{ id: 1, obligatoria: true }] } });
    assert.equal(e.data.titulo, 'QA y testing');
    const d = await api('PATCH', `/ofertas/${id}/estado`, { token: nubalia, cuerpo: { activa: false } });
    assert.equal(d.data.abierta, false);
    assert.equal(await total('q=QA'), 0);
    assert.equal((await api('DELETE', `/ofertas/${id}`, { token: nubalia })).status, 200);
    assert.equal((await api('GET', `/ofertas/${id}`)).status, 404);
  });
  it('lista sus ofertas, también las inactivas, con el número de candidaturas', async () => {
    const r = await api('GET', '/empresas/yo/ofertas', { token: nubalia });
    assert.equal(r.data.length, 3);
    assert.equal(r.data.find((o) => o.id === 2).candidaturas, 3);
  });
  it('al eliminar una oferta se borran en cascada sus candidaturas', async () => {
    const r = await api('DELETE', '/ofertas/2', { token: nubalia });
    assert.equal(r.data.candidaturasEliminadas, 3);
    const c = await api('GET', '/alumnos/yo/candidaturas', { token: lucia });
    assert.ok(!c.data.some((x) => x.oferta.id === 2));
  });
});

describe('Listado de empresas', () => {
  it('filtra por nombre y localidad', async () => {
    assert.equal((await api('GET', '/empresas')).data.empresas.length, 8);
    assert.equal((await api('GET', '/empresas?q=cloud')).data.empresas.length, 1);
    assert.equal((await api('GET', '/empresas?localidad=Sevilla')).data.empresas.length, 1);
  });
});
