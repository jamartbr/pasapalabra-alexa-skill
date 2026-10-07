'use strict';
const R = require('../lambda/lib/ranking');

test('load defaults primera vez', () => {
  const r = R.load(null);
  expect(r.partidas).toBe(0);
  expect(r.roscoEnCurso).toBeNull();
});
test('esRecord y saveFin', () => {
  const r = R.load(null);
  expect(R.esRecord(r, { aciertos: 10, fallos: 5 })).toBe(true);
  R.saveFin(r, { aciertos: 10, fallos: 5 });
  expect(r.partidas).toBe(1);
  expect(r.mejorMarca.aciertos).toBe(10);
  expect(r.roscoEnCurso).toBeNull();
  expect(R.esRecord(r, { aciertos: 5, fallos: 0 })).toBe(false);
});
test('saveEnCurso guarda parcial', () => {
  const r = R.load(null);
  const juego = { rosco: [], pos: 0, aciertos: 3, fallos: 1, fase: 'EN_JUEGO' };
  R.saveEnCurso(r, juego);
  expect(r.roscoEnCurso.aciertos).toBe(3);
});
