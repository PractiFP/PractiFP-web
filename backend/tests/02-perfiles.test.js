import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, terminar, api, entrar, formulario, PDF_DE_PRUEBA } from './ayuda.js';

let lucia, carlos, nubalia, ebro, admin;
before(async () => {
  await iniciar();
  [lucia, carlos, nubalia, ebro, admin] = await Promise.all(['lucia', 'carlos', 'nubalia', 'ebro', 'admin'].map(entrar));
});
after(terminar);

const cv = (contenido, tipo = 'application/pdf') => formulario({}, { campo: 'cv', contenido, tipo, nombre: 'cv.pdf' });

describe('Perfil del alumno', () => {
  it('devuelve el perfil propio con ciclo y tecnologías', async () => {
    const r = await api('GET', '/alumnos/yo', { token: lucia });
    assert.equal(r.status, 200);
    assert.equal(r.data.ciclo.codigo, 'DAM');
    assert.equal(r.data.tecnologias.length, 6);
  });
  it('valida los datos al editar', async () => {
    const r = await api('PUT', '/alumnos/yo', { token: lucia, cuerpo: { nombre: '', apellidos: 'X', cicloId: 99, curso: 3, descripcion: 'a'.repeat(1001) } });
    assert.equal(r.status, 400);
    for (const c of ['nombre', 'curso', 'descripcion']) assert.ok(r.error.detalles[c], c);
  });
  it('guarda los cambios', async () => {
    const r = await api('PUT', '/alumnos/yo', { token: lucia, cuerpo: { nombre: 'Lucía', apellidos: 'Martín Herrera', cicloId: 1, curso: 2, centro: 'IES Clara del Rey', localidad: 'Madrid', descripcion: 'Nueva descripción' } });
    assert.equal(r.status, 200);
    assert.equal(r.data.descripcion, 'Nueva descripción');
  });
  it('gestiona las tecnologías: añadir, cambiar nivel y quitar', async () => {
    let r = await api('PUT', '/alumnos/yo/tecnologias/12', { token: lucia, cuerpo: { nivel: 'BASICO' } });
    assert.ok(r.data.some((t) => t.id === 12 && t.nivel === 'BASICO'));
    r = await api('PUT', '/alumnos/yo/tecnologias/12', { token: lucia, cuerpo: { nivel: 'EXPERTO' } });
    assert.equal(r.status, 400);
    r = await api('DELETE', '/alumnos/yo/tecnologias/12', { token: lucia });
    assert.ok(!r.data.some((t) => t.id === 12));
  });
  it('el perfil público no incluye el correo y oculta cuentas desactivadas', async () => {
    const r = await api('GET', '/alumnos/1');
    assert.equal(r.status, 200);
    assert.ok(!('email' in r.data));
    assert.equal((await api('GET', '/alumnos/6')).status, 404);
    assert.equal((await api('GET', '/alumnos/6', { token: admin })).status, 200);
  });
});

describe('Currículum', () => {
  it('solo pueden verlo el alumno, un administrador o una empresa en la que se ha inscrito', async () => {
    assert.equal((await api('GET', '/alumnos/1/cv', { binario: true })).status, 401);
    assert.equal((await api('GET', '/alumnos/1/cv', { token: ebro, binario: true })).status, 403);
    assert.equal((await api('GET', '/alumnos/1/cv', { token: carlos, binario: true })).status, 403);
    const r = await api('GET', '/alumnos/1/cv', { token: nubalia, binario: true });
    assert.equal(r.status, 200);
    assert.equal(r.buffer.subarray(0, 5).toString(), '%PDF-');
    assert.equal((await api('GET', '/alumnos/1/cv', { token: admin, binario: true })).status, 200);
  });
  it('rechaza archivos que no son PDF aunque digan serlo y los de más de 4 MB', async () => {
    assert.equal((await api('POST', '/alumnos/yo/cv', { token: lucia, cuerpo: cv(Buffer.from('no soy un pdf')) })).status, 400);
    assert.equal((await api('POST', '/alumnos/yo/cv', { token: lucia, cuerpo: cv(PDF_DE_PRUEBA, 'image/png') })).status, 400);
    const r = await api('POST', '/alumnos/yo/cv', { token: lucia, cuerpo: cv(Buffer.alloc(4 * 1024 * 1024 + 10)) });
    assert.equal(r.status, 400);
    assert.match(r.error.mensaje, /4 MB/);
  });
  it('sube, reemplaza y elimina el currículum', async () => {
    assert.equal((await api('POST', '/alumnos/yo/cv', { token: lucia, cuerpo: cv(PDF_DE_PRUEBA) })).status, 201);
    assert.equal((await api('GET', '/alumnos/1/cv', { token: lucia, binario: true })).status, 200);
    assert.equal((await api('DELETE', '/alumnos/yo/cv', { token: lucia })).status, 200);
    assert.equal((await api('GET', '/alumnos/1/cv', { token: lucia, binario: true })).status, 404);
  });
});

describe('Perfil de empresa', () => {
  it('valida web, teléfono y coordenadas', async () => {
    const r = await api('PUT', '/empresas/yo', { token: nubalia, cuerpo: { nombre: 'Nubalia', localidad: 'Madrid', web: 'ftp://x', telefono: 'abc', latitud: 95, longitud: '' } });
    assert.equal(r.status, 400);
    for (const c of ['web', 'telefono', 'latitud']) assert.ok(r.error.detalles[c], c);
    const s = await api('PUT', '/empresas/yo', { token: nubalia, cuerpo: { nombre: 'Nubalia', localidad: 'Madrid', latitud: 40 } });
    assert.ok(s.error.detalles.longitud);
  });
  it('guarda los cambios y la ficha pública no expone datos internos', async () => {
    const r = await api('PUT', '/empresas/yo', { token: nubalia, cuerpo: { nombre: 'Nubalia Software', descripcion: 'Nueva', web: 'https://nubalia.example', telefono: '910 000 120', direccion: 'Calle de Alcalá 120', localidad: 'Madrid', latitud: '40.4245', longitud: '-3.6745' } });
    assert.equal(r.status, 200);
    const p = await api('GET', '/empresas/1');
    assert.equal(p.data.descripcion, 'Nueva');
    assert.ok(!('usuarioId' in p.data) && !('email' in p.data));
  });
});
