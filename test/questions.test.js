'use strict';
const BANCO = require('../lambda/lib/questions');
const { ROSCO_27 } = require('../lambda/lib/config');
const { normaliza } = require('../lambda/lib/game');

const isAutorQ = (q) => /Pintor|Escritor|Compositor|Cineasta|Poeta|Dramaturgo|Escritora|Filósofo|Historiador|Fotógrafo|Científico|Arquitecto|Compositora|Pintora|Novelista|Ensayista|Matemático|Físico|Médico|Inventor/i.test(q);
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
test('cuota por letra: 2 autores + 3 conjugaciones + 20 definiciones', () => {
  ROSCO_27.forEach((letra) => {
    const arr = BANCO[letra];
    const aut = arr.filter((e) => isAutorQ(e.q));
    const con = arr.filter((e) => !isAutorQ(e.q) && isConjQ(e.q));
    const def = arr.filter((e) => !isAutorQ(e.q) && !isConjQ(e.q));
    expect(aut.length).toBe(2);
    expect(con.length).toBe(3);
    expect(def.length).toBe(20);
  });
});
test('TTS: q entre 5 y 14 palabras y sin ["()0-9]', () => {
  ROSCO_27.forEach((letra) => {
    BANCO[letra].forEach(({ q }) => {
      const nPalabras = q.trim().split(/\s+/).length;
      expect(nPalabras).toBeGreaterThanOrEqual(5);
      expect(nPalabras).toBeLessThanOrEqual(14);
      expect(q).not.toMatch(/["()0-9]/);
    });
  });
});
test('no filtra respuesta: normaliza(q) no contiene normaliza(a) si len>3 salvo conjugación', () => {
  ROSCO_27.forEach((letra) => {
    BANCO[letra].forEach(({ q, a }) => {
      const na = normaliza(a);
      if (na.length <= 3) return;
      if (isConjQ(q)) return;
      expect(normaliza(q)).not.toContain(na);
    });
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
