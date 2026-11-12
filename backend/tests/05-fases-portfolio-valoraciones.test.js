import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, terminar, api, entrar, formulario, pngDePrueba } from './ayuda.js';

let lucia, carlos, nubalia, turia, png;
before(async () => {
  await iniciar();
  [lucia, carlos, nubalia, turia] = await Promise.all(['lucia', 'carlos', 'nubalia', 'turia'].map(entrar));
  png = await pngDePrueba();
});
after(terminar);

describe('Fases del proceso de selección', () => {
  it('el detalle de la oferta incluye las fases y la duración estimada', async () => {
    const r = await api('GET', '/ofertas/1');
    assert.equal(r.data.fases.length, 5);
    assert.deepEqual([r.data.resumenFases.diasMinimo, r.data.resumenFases.diasMaximo], [20, 27]);
  });
  it('valida cada fase y solo la empresa de la oferta puede cambiarlas', async () => {
    assert.equal((await api('PUT', '/ofertas/1/fases', { token: turia, cuerpo: { fases: [] } })).status, 403);
    const r = await api('PUT', '/ofertas/1/fases', { token: nubalia, cuerpo: { fases: [{ nombre: '', duracionDias: -1 }] } });
    assert.equal(r.status, 400);
    assert.ok(r.error.detalles.fases[0].nombre && r.error.detalles.fases[0].duracionDias);
  });
  it('al reordenar se conserva la fase actual de los candidatos', async () => {
    const { data } = await api('GET', '/ofertas/1');
    const f = data.fases;
    const entrevista = f.find((x) => x.nombre === 'Entrevista');
    const r = await api('PUT', '/ofertas/1/fases', { token: nubalia, cuerpo: { fases: [f[0], entrevista, f[1], { nombre: 'Visita', duracionDias: 1, obligatoria: false }, f[4]] } });
    assert.equal(r.status, 200);
    assert.equal(r.data.fases[1].id, entrevista.id);
    assert.equal(r.data.fases[1].orden, 2);
    const mias = await api('GET', '/alumnos/yo/candidaturas', { token: lucia });
    assert.deepEqual(mias.data.find((c) => c.oferta.id === 1).faseActual, { nombre: 'Entrevista', orden: 2 });
  });
  it('la empresa indica la fase actual de un candidato, solo con fases de esa oferta', async () => {
    const { data } = await api('GET', '/empresas/yo/candidaturas?oferta=1', { token: nubalia });
    const c = data[0];
    assert.equal((await api('PATCH', `/candidaturas/${c.id}/fase`, { token: nubalia, cuerpo: { faseId: 99999 } })).status, 400);
    assert.equal((await api('PATCH', `/candidaturas/${c.id}/fase`, { token: nubalia, cuerpo: { faseId: c.fases[3].id } })).status, 200);
    assert.equal((await api('PATCH', `/candidaturas/${c.id}/fase`, { token: turia, cuerpo: { faseId: null } })).status, 403);
  });
});

describe('Portfolio', () => {
  const imagen = (contenido, tipo = 'image/png') => ({ campo: 'imagen', contenido, tipo, nombre: 'imagen.png' });
  let id;
  it('valida los datos y rechaza imágenes falsas', async () => {
    const r = await api('POST', '/alumnos/yo/proyectos', { token: lucia, cuerpo: formulario({ titulo: '', descripcion: '', urlGithub: 'github', fechaCreacion: '2999-01-01' }) });
    assert.equal(r.status, 400);
    for (const c of ['titulo', 'descripcion', 'urlGithub', 'fechaCreacion']) assert.ok(r.error.detalles[c], c);
    const f = await api('POST', '/alumnos/yo/proyectos', { token: lucia, cuerpo: formulario({ titulo: 'X', descripcion: 'Y' }, imagen(Buffer.from('falsa'))) });
    assert.equal(f.status, 400);
  });
  it('crea un proyecto con imagen pública y tecnologías', async () => {
    const r = await api('POST', '/alumnos/yo/proyectos', { token: lucia, cuerpo: formulario({ titulo: 'TaskBoard', descripcion: 'Kanban', urlGithub: 'https://github.com/ejemplo/taskboard', tecnologias: [2, 4, 2] }, imagen(png)) });
    assert.equal(r.status, 201);
    assert.equal(r.data.tecnologias.length, 2);
    assert.ok(!('imagenRuta' in r.data));
    id = r.data.id;
    const i = await api('GET', `/proyectos/${id}/imagen`, { binario: true });
    assert.equal(i.headers.get('content-type'), 'image/png');
    assert.equal((await api('GET', '/alumnos/1')).data.proyectos.length, 4);
  });
  it('solo su autor puede editarlo y borrarlo', async () => {
    assert.equal((await api('PUT', `/proyectos/${id}`, { token: carlos, cuerpo: formulario({ titulo: 'X', descripcion: 'Y' }) })).status, 403);
    const e = await api('PUT', `/proyectos/${id}`, { token: lucia, cuerpo: formulario({ titulo: 'TaskBoard 2', descripcion: 'Kanban', quitarImagen: 'true' }) });
    assert.equal(e.data.tieneImagen, false);
    assert.equal((await api('GET', `/proyectos/${id}/imagen`, { binario: true })).status, 404);
    assert.equal((await api('DELETE', `/proyectos/${id}`, { token: carlos })).status, 403);
    assert.equal((await api('DELETE', `/proyectos/${id}`, { token: lucia })).status, 200);
  });
});

describe('Valoraciones', () => {
  it('solo valora quien tuvo una candidatura aceptada en la empresa', async () => {
    assert.equal((await api('GET', '/empresas/4/valoraciones', { token: lucia })).data.puedeValorar, true);
    assert.equal((await api('GET', '/empresas/1/valoraciones', { token: lucia })).data.puedeValorar, false);
    assert.equal((await api('POST', '/empresas/1/valoraciones', { token: lucia, cuerpo: { puntuacion: 5, comentario: 'Comentario de prueba largo' } })).status, 403);
  });
  it('la puntuación debe ser un entero de 1 a 5', async () => {
    for (const puntuacion of [0, 6, 4.5]) {
      assert.equal((await api('POST', '/empresas/4/valoraciones', { token: lucia, cuerpo: { puntuacion, comentario: 'Comentario de prueba largo' } })).status, 400);
    }
  });
  it('una valoración por alumno y empresa, pendiente hasta su moderación', async () => {
    const r = await api('POST', '/empresas/4/valoraciones', { token: lucia, cuerpo: { puntuacion: 4, comentario: 'Aprendí mucho con datos reales.' } });
    assert.equal(r.status, 201);
    assert.equal(r.data.estado, 'PENDIENTE');
    assert.equal((await api('POST', '/empresas/4/valoraciones', { token: lucia, cuerpo: { puntuacion: 5, comentario: 'Otra valoración más.' } })).status, 409);
    assert.equal((await api('GET', '/empresas/4/valoraciones')).data.valoraciones.length, 0);
  });
  it('en público el autor aparece con la inicial del apellido', async () => {
    const r = await api('GET', '/empresas/1/valoraciones');
    assert.equal(r.data.valoraciones[0].autor, 'Javier T.');
  });
});
