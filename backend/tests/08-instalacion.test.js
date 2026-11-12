import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { iniciar, terminar, api, urlBase } from './ayuda.js';

before(iniciar);
after(() => { delete process.env.INSTALACION_TOKEN; return terminar(); });

const instalar = (token, cuerpo = {}) =>
  fetch(`${urlBase()}/instalacion`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { 'X-Token-Instalacion': token } : {}) }, body: JSON.stringify(cuerpo) });

describe('Instalación desde la web', () => {
  it('no existe si no se ha configurado INSTALACION_TOKEN', async () => {
    delete process.env.INSTALACION_TOKEN;
    assert.equal((await instalar('cualquiera')).status, 404);
  });
  it('rechaza un token incorrecto', async () => {
    process.env.INSTALACION_TOKEN = 'a'.repeat(40);
    assert.equal((await instalar('b'.repeat(40))).status, 403);
    assert.equal((await instalar()).status, 403);
  });
  it('nunca borra una base de datos ya instalada', async () => {
    const r = await instalar('a'.repeat(40));
    assert.equal(r.status, 409);
    assert.equal((await api('GET', '/salud')).data.baseDatos.registros.usuarios, 15);
  });
});
