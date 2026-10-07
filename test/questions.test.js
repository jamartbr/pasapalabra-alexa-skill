'use strict';
const BANCO = require('../lambda/lib/questions');
const { ROSCO_27 } = require('../lambda/lib/config');
const { normaliza } = require('../lambda/lib/game');

test('27 claves con 3 cada una', () => {
  expect(Object.keys(BANCO).sort()).toEqual([...ROSCO_27].sort());
  ROSCO_27.forEach((l) => expect(BANCO[l].length).toBe(3));
});
test('respuestas 1 palabra y contienen/empiezan letra', () => {
  ROSCO_27.forEach((letra) => {
    BANCO[letra].forEach(({ q, a }) => {
      expect(q.length).toBeGreaterThan(5);
      expect(a).toMatch(/^[a-zñ]+$/);
      expect(a.split(' ').length).toBe(1);
      const na = normaliza(a);
      const nl = normaliza(letra);
      expect(na.includes(nl) || na.startsWith(nl)).toBe(true);
    });
  });
});
test('sin duplicados dentro de letra', () => {
  ROSCO_27.forEach((letra) => {
    const as = BANCO[letra].map((e) => e.a);
    expect(new Set(as).size).toBe(as.length);
  });
});
