'use strict';
const { getActual, answer, preguntaTexto, isFinished, getScore } = require('../lib/game');
const R = require('../lib/ranking');

function getJuego(h) {
  const s = h.attributesManager.getSessionAttributes() || {};
  return s.juego || null;
}
async function saveAll(h, juego, finishedScore) {
  h.attributesManager.setSessionAttributes({ juego });
  try {
    const p = (await h.attributesManager.getPersistentAttributes()) || {};
    const ranking = R.load(p);
    R.saveEnCurso(ranking, juego);
    if (finishedScore) R.saveFin(ranking, finishedScore);
    Object.assign(p, ranking);
    h.attributesManager.setPersistentAttributes(p);
    await h.attributesManager.savePersistentAttributes();
  } catch (e) { /* local sin dynamo */ }
}
function ask(entry) {
  return {
    speak: `${preguntaTexto(entry)}.`,
    reprompt: `Si no sabes una respuesta di la p-palabra. Te repito: ${preguntaTexto(entry)}.`
  };
}

const PasarHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && r.intent.name === 'PasarIntent';
  },
  async handle(h) {
    const { pass } = require('../lib/game');
    const juego = getJuego(h);
    const b = h.responseBuilder;
    if (!juego) return b.speak('Primero dime si quieres empezar un nuevo rosco.').reprompt('¿Empezamos un rosco?').getResponse();
    pass(juego);
    await saveAll(h, juego);
    if (isFinished(juego)) {
      const s = getScore(juego);
      await saveAll(h, juego, s);
      return b.speak(`Rosco terminado. ${s.aciertos} aciertos y ${s.fallos} fallos.`).getResponse();
    }
    const actual = getActual(juego);
    const t = { speak: `Pasapalabra. Vamos con la siguiente. ${preguntaTexto(actual)}.`, reprompt: `Si no sabes di pasapalabra. Te repito: ${preguntaTexto(actual)}.` };
    return b.speak(t.speak).reprompt(t.reprompt).getResponse();
  }
};

const ResponderHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && r.intent.name === 'ResponderIntent';
  },
  async handle(h) {
    const r = h.requestEnvelope.request;
    const slot = r.intent.slots && r.intent.slots.Respuesta;
    const texto = (slot && (slot.value || (slot.slotValue && slot.slotValue.value))) || '';
    const juego = getJuego(h);
    const b = h.responseBuilder;
    if (!juego) return b.speak('Primero dime si quieres empezar un nuevo rosco.').reprompt('¿Empezamos?').getResponse();
    if (!texto) {
      const actual = getActual(juego);
      return b.speak(`No te he entendido. ${preguntaTexto(actual)}.`).reprompt('Repite o di pasapalabra.').getResponse();
    }
    const res = answer(juego, texto);
    if (res.finished || isFinished(juego)) {
      const s = getScore(juego);
      await saveAll(h, juego, s);
      if (res.resultado === 'acierto') return b.speak(`Correcto. Rosco terminado con ${s.aciertos} aciertos y ${s.fallos} fallos.`).getResponse();
      return b.speak(`Lo siento, la respuesta correcta era ${res.correcta}. Llevas ${s.aciertos} aciertos y ${s.fallos} fallos. Rosco terminado.`).getResponse();
    }
    await saveAll(h, juego);
    const actual = getActual(juego);
    if (res.resultado === 'acierto') {
      const t = ask(actual);
      return b.speak(`Correcto. Siguiente: ${t.speak}`).reprompt(t.reprompt).getResponse();
    }
    const s = getScore(juego);
    return b.speak(`Lo siento, la respuesta correcta era ${res.correcta}. Llevas ${s.aciertos} aciertos y ${s.fallos} fallos. Siguiente: ${preguntaTexto(actual)}.`).reprompt(`Te repito: ${preguntaTexto(actual)}.`).getResponse();
  }
};

module.exports = { PasarHandler, ResponderHandler };
