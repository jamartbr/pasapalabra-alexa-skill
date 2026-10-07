'use strict';
const { ROSCO_27 } = require('./config');

function normaliza(s) {
  return (s || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zñ]/g, '');
}

function pistaPara(letra, respuesta) {
  const a = normaliza(respuesta);
  const l = normaliza(letra);
  if (a.startsWith(l)) return `Empieza con ${letra}`;
  return `Contiene la ${letra}`;
}

function initRosco(banco) {
  const rosco = ROSCO_27.map((letra) => {
    const opts = banco[letra];
    if (!opts || !opts.length) throw new Error(`Sin preguntas para ${letra}`);
    const pick = opts[Math.floor(Math.random() * opts.length)];
    return { letra, estado: 'pendiente', q: pick.q, a: pick.a };
  });
  return { rosco, pos: 0, aciertos: 0, fallos: 0, fase: 'EN_JUEGO' };
}

function pendientes(juego) {
  return juego.rosco.filter((e) => e.estado === 'pendiente' || e.estado === 'pasada');
}

function getActual(juego) {
  if (juego.fase === 'FIN') return null;
  const actual = juego.rosco[juego.pos];
  if (actual.estado === 'pendiente' || actual.estado === 'pasada') return actual;
  const nxt = avanzar(juego);
  return nxt ? juego.rosco[juego.pos] : null;
}

function avanzar(juego) {
  for (let i = 0; i < juego.rosco.length; i += 1) {
    juego.pos = (juego.pos + 1) % juego.rosco.length;
    const e = juego.rosco[juego.pos];
    if (e.estado === 'pendiente' || e.estado === 'pasada') return true;
  }
  const restan = pendientes(juego);
  if (restan.length === 0) {
    juego.fase = 'FIN';
    return false;
  }
  // Si la posición actual sigue pendiente/pasada quédate
  const actual = juego.rosco[juego.pos];
  if (actual.estado === 'pendiente' || actual.estado === 'pasada') return true;
  // Buscar primera pendiente
  const idx = juego.rosco.findIndex((e) => e.estado === 'pendiente' || e.estado === 'pasada');
  if (idx >= 0) { juego.pos = idx; return true; }
  juego.fase = 'FIN';
  return false;
}

function preguntaTexto(entry) {
  return `${pistaPara(entry.letra, entry.a)}, ${entry.q}`;
}

function answer(juego, texto) {
  const actual = getActual(juego);
  if (!actual) return { resultado: 'fin' };
  const ok = normaliza(texto) === normaliza(actual.a);
  if (ok) {
    actual.estado = 'acierto';
    juego.aciertos += 1;
  } else {
    actual.estado = 'fallo';
    juego.fallos += 1;
  }
  const correcta = actual.a;
  const hayMas = avanzar(juego);
  if (!hayMas) juego.fase = 'FIN';
  return { resultado: ok ? 'acierto' : 'fallo', correcta, finished: juego.fase === 'FIN' };
}

function pass(juego) {
  const actual = getActual(juego);
  if (!actual) return { resultado: 'fin' };
  actual.estado = 'pasada';
  avanzar(juego);
  return { resultado: 'pasada', finished: juego.fase === 'FIN' };
}

function isFinished(juego) { return juego.fase === 'FIN'; }
function getScore(juego) { return { aciertos: juego.aciertos, fallos: juego.fallos }; }

module.exports = { normaliza, pistaPara, initRosco, getActual, answer, pass, isFinished, getScore, preguntaTexto, pendientes };
