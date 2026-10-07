'use strict';
const { initRosco, answer, pass, isFinished, getScore, normaliza, getActual, pistaPara, preguntaTexto, pendientes } = require('../lambda/lib/game');
const { ROSCO_27 } = require('../lambda/lib/config');
const BANCO = require('../lambda/lib/questions');

test('init crea 27 en orden A-Z+Ñ', () => {
  const j = initRosco(BANCO);
  expect(j.rosco.length).toBe(27);
  expect(j.rosco.map((e) => e.letra)).toEqual(ROSCO_27);
  expect(j.fase).toBe('EN_JUEGO');
});

test('normaliza tildes y mayúsculas', () => {
  expect(normaliza('Árbol')).toBe('arbol');
  expect(normaliza('  MaÑana ')).toBe('manana');
});

test('acierto avanza y cuenta', () => {
  const j = initRosco(BANCO);
  const a = getActual(j);
  const r = answer(j, a.a);
  expect(r.resultado).toBe('acierto');
  expect(j.aciertos).toBe(1);
});

test('fallo informa correcta y cuenta', () => {
  const j = initRosco(BANCO);
  const a = getActual(j);
  const r = answer(j, 'zzz-no-existe');
  expect(r.resultado).toBe('fallo');
  expect(r.correcta).toBe(a.a);
  expect(j.fallos).toBe(1);
});

test('pass marca pasada y loop circular sin rondas', () => {
  const j = initRosco(BANCO);
  for (let i = 0; i < 27; i += 1) pass(j);
  expect(j.fase).toBe('EN_JUEGO');
  expect(j.rosco.every((e) => e.estado === 'pasada')).toBe(true);
  // responder una tras loop
  const a = getActual(j);
  answer(j, a.a);
  expect(j.aciertos).toBe(1);
});

test('FIN con 27 resueltas', () => {
  const j = initRosco(BANCO);
  for (let i = 0; i < 27; i += 1) {
    const a = getActual(j);
    answer(j, a.a);
  }
  expect(isFinished(j)).toBe(true);
  expect(getScore(j).aciertos).toBe(27);
});

test('pista Empieza vs Contiene y preguntaTexto', () => {
  expect(pistaPara('A', 'avion')).toMatch(/Empieza/);
  expect(pistaPara('A', 'pijama')).toMatch(/Contiene/);
  expect(preguntaTexto({ letra: 'B', q: 'demo', a: 'bota' })).toMatch(/Empieza con B/);
  expect(pendientes(initRosco(BANCO)).length).toBe(27);
});

test('getActual null tras FIN', () => {
  const j = initRosco(BANCO);
  for (let i = 0; i < 27; i += 1) answer(j, getActual(j).a);
  expect(getActual(j)).toBeNull();
  expect(answer(j, 'x').resultado).toBe('fin');
  expect(pass(j).resultado).toBe('fin');
});
