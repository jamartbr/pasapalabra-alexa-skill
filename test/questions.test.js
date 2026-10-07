'use strict';
const BANCO = require('../lambda/lib/questions');
const { ROSCO_27 } = require('../lambda/lib/config');
const { normaliza } = require('../lambda/lib/game');

const isAutorQ = (q) => /Pintor|Escritor|Compositor|Cineasta|Poeta|Dramaturgo|Escritora|Filósofo|Historiador/i.test(q);
const isConjQ = (q) => /persona del|Participio|Gerundio/i.test(q);

test('27 claves con 25 cada una', () => {
  expect(Object.keys(BANCO).sort()).toEqual([...ROSCO_27].sort());
  ROSCO_27.forEach((l) => expect(BANCO[l].length).toBe(25));
});
test('respuestas 1 palabra y contienen/empiezan letra (eñe preservada)', () => {
  expect(normaliza('Niñez')).toBe('niñez');
  ROSCO_27.forEach((letra) => {
    BANCO[letra].forEach(({ q, a }) => {
      expect(q.length).toBeGreaterThan(5);
      expect(a).toMatch(/^[a-zñ]+$/);
      const na = normaliza(a);
      const nl = normaliza(letra);
      expect(na.includes(nl) || na.startsWith(nl)).toBe(true);
    });
  });
});
test('sin duplicados dentro de letra ni entre letras (unicidad global)', () => {
  const seen = {};
  ROSCO_27.forEach((letra) => {
    const as = BANCO[letra].map((e) => normaliza(e.a));
    expect(new Set(as).size).toBe(as.length);
    as.forEach((a) => {
      expect(seen[a]).toBeUndefined();
      seen[a] = letra;
    });
  });
  expect(Object.keys(seen).length).toBe(27 * 25);
});
test('cuota por letra: 1 autor + 3 conjugaciones + 21 definiciones', () => {
  ROSCO_27.forEach((letra) => {
    const arr = BANCO[letra];
    const aut = arr.filter((e) => isAutorQ(e.q));
    const con = arr.filter((e) => !isAutorQ(e.q) && isConjQ(e.q));
    const def = arr.filter((e) => !isAutorQ(e.q) && !isConjQ(e.q));
    expect(aut.length).toBe(1);
    expect(con.length).toBe(3);
    expect(def.length).toBe(21);
  });
});
test('prioriza empieza-sobre-contiene', () => {
  let empieza = 0, total = 0;
  ROSCO_27.forEach((letra) => {
    BANCO[letra].forEach(({ a }) => {
      total += 1;
      if (normaliza(a).startsWith(normaliza(letra))) empieza += 1;
    });
  });
  expect(empieza / total).toBeGreaterThan(0.5);
});
