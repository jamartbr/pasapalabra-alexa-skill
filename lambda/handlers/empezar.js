'use strict';
const { initRosco, getActual, preguntaTexto } = require('../lib/game');
const BANCO = require('../lib/questions');

async function persistEnCurso(h, juego) {
  h.attributesManager.setSessionAttributes({ juego });
  try {
    const p = await h.attributesManager.getPersistentAttributes();
    p.roscoEnCurso = juego;
    h.attributesManager.setPersistentAttributes(p);
    await h.attributesManager.savePersistentAttributes();
  } catch (e) { /* sin Dynamo en local */ }
}

function ask(entry) {
  return {
    speak: `Comencemos. ${preguntaTexto(entry)}.`,
    reprompt: `Si no sabes una respuesta di la p-palabra. Te repito: ${preguntaTexto(entry)}.`
  };
}

const SiSeguirHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return (r.type === 'IntentRequest' && ['AMAZON.YesIntent', 'ContinuarRoscoIntent'].includes(r.intent.name));
  },
  async handle(h) {
    let stored = {};
    try { stored = await h.attributesManager.getPersistentAttributes(); } catch (e) { stored = {}; }
    const b = h.responseBuilder;
    if (stored.roscoEnCurso && stored.roscoEnCurso.fase === 'EN_JUEGO') {
      const juego = stored.roscoEnCurso;
      h.attributesManager.setSessionAttributes({ juego });
      const actual = getActual(juego);
      const t = ask(actual);
      return b.speak(t.speak).reprompt(t.reprompt).getResponse();
    }
    const juego = initRosco(BANCO);
    await persistEnCurso(h, juego);
    const actual = getActual(juego);
    const t = ask(actual);
    return b.speak(t.speak).reprompt(t.reprompt).getResponse();
  }
};

const EmpezarHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return (r.type === 'IntentRequest' && r.intent.name === 'EmpezarRoscoIntent');
  },
  async handle(h) {
    // Regla voz: jugar / nuevo rosco SIEMPRE crea rosco nuevo, aunque haya partida guardada
    const juego = initRosco(BANCO);
    await persistEnCurso(h, juego);
    const actual = getActual(juego);
    const t = ask(actual);
    return h.responseBuilder.speak(t.speak).reprompt(t.reprompt).getResponse();
  }
};

const NuevoRoscoHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return (r.type === 'IntentRequest' && r.intent.name === 'AMAZON.NoIntent');
  },
  async handle(h) {
    let stored = {};
    try { stored = await h.attributesManager.getPersistentAttributes(); } catch (e) { stored = {}; }
    // No ante "¿seguimos o nuevo?" -> rosco nuevo; No ante "¿empezamos?" -> despedida
    if (stored.roscoEnCurso && stored.roscoEnCurso.fase === 'EN_JUEGO') {
      const juego = initRosco(BANCO);
      await persistEnCurso(h, juego);
      const actual = getActual(juego);
      const t = ask(actual);
      return h.responseBuilder.speak(`De acuerdo, empezamos otro. ${t.speak}`).reprompt(t.reprompt).getResponse();
    }
    return h.responseBuilder.speak('De acuerdo, cuando quieras jugamos. ¡Hasta luego!').withShouldEndSession(true).getResponse();
  }
};

module.exports = { SiSeguirHandler, EmpezarHandler, NuevoRoscoHandler };
