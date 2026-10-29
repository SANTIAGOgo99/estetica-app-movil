import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assessZap } from '../scripts/check-security.mjs';

const report = alerts => ({ site: [{ '@name': 'http://127.0.0.1:4173', alerts }] });
test('DAST: bloquea riesgo alto y no acepta reportes vacíos o de otro objetivo', () => {
  assert.deepEqual(assessZap(report([])), { sites: 1, alerts: 0, high: 0 });
  assert.equal(assessZap(report([{ riskcode: '2', name: 'Revisar CSP' }])).alerts, 1);
  assert.throws(() => assessZap(report([{ riskcode: '3', name: 'Fuga' }])), /bloqueado/);
  assert.throws(() => assessZap({ site: [] }), /ningún sitio/);
  assert.throws(() => assessZap({ site: [{ '@name': 'https://produccion.example', alerts: [] }] }), /local/);
  assert.throws(() => assessZap(report([{ riskcode: 'desconocido' }])), /inválido/);
});
