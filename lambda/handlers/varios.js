'use strict';
const R = require('../lib/ranking');

const HelpHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && r.intent.name === 'AMAZON.HelpIntent';
  },
  handle(h) {
    const s = h.attributesManager.getSessionAttributes() || {};
    const base = 'Te digo una definición por letra. Responde con una palabra, o di la p-palabra para saltar, o salir para guardar. ';
    if (s.juego && s.juego.fase === 'EN_JUEGO') {
      const { getActual, preguntaTexto } = require('../lib/game');
      const actual = getActual(s.juego);
      return h.responseBuilder.speak(`${base} Vamos: ${preguntaTexto(actual)}.`).reprompt(`Te repito: ${preguntaTexto(actual)}.`).getResponse();
    }
    return h.responseBuilder.speak(`${base} ¿Empezamos un rosco?`).reprompt('¿Empezamos?').getResponse();
  }
};

const StopHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && ['AMAZON.StopIntent', 'AMAZON.CancelIntent', 'SalirIntent'].includes(r.intent.name);
  },
  async handle(h) {
    const s = h.attributesManager.getSessionAttributes() || {};
    if (s.juego && s.juego.fase === 'EN_JUEGO') {
      try {
        const p = (await h.attributesManager.getPersistentAttributes()) || {};
        const ranking = R.load(p);
        R.saveEnCurso(ranking, s.juego);
        Object.assign(p, ranking);
        h.attributesManager.setPersistentAttributes(p);
        await h.attributesManager.savePersistentAttributes();
      } catch (e) { /* local */ }
      return h.responseBuilder.speak('Guardo tu rosco. Cuando vuelvas te pregunto si seguirlo. Hasta luego.').withShouldEndSession(true).getResponse();
    }
    return h.responseBuilder.speak('Hasta luego.').withShouldEndSession(true).getResponse();
  }
};

const FallbackHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && r.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(h) {
    const s = h.attributesManager.getSessionAttributes() || {};
    if (s.juego && s.juego.fase === 'EN_JUEGO') {
      const { getActual, preguntaTexto } = require('../lib/game');
      const actual = getActual(s.juego);
      return h.responseBuilder.speak(`No te he entendido. ${preguntaTexto(actual)}.`).reprompt('Repite o di la p-palabra.').getResponse();
    }
    return h.responseBuilder.speak('No te he entendido. ¿Quieres empezar un rosco?').reprompt('¿Empezamos?').getResponse();
  }
};

const SessionEndedHandler = {
  canHandle(h) { return h.requestEnvelope.request.type === 'SessionEndedRequest'; },
  async handle(h) {
    try {
      const s = h.attributesManager.getSessionAttributes() || {};
      if (s.juego && s.juego.fase === 'EN_JUEGO') {
        const p = (await h.attributesManager.getPersistentAttributes()) || {};
        const ranking = R.load(p);
        R.saveEnCurso(ranking, s.juego);
        Object.assign(p, ranking);
        h.attributesManager.setPersistentAttributes(p);
        await h.attributesManager.savePersistentAttributes();
      }
    } catch (e) { /* noop */ }
    return h.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() { return true; },
  handle(h, err) {
    console.error(err);
    return h.responseBuilder.speak('Perdona, hubo un error. ¿Seguimos con el rosco?').reprompt('¿Seguimos?').getResponse();
  }
};

module.exports = { HelpHandler, StopHandler, FallbackHandler, SessionEndedHandler, ErrorHandler };
