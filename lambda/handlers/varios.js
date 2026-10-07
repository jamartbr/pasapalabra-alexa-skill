'use strict';
const R = require('../lib/ranking');

const RankingHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && r.intent.name === 'RankingIntent';
  },
  async handle(h) {
    let p = {};
    try { p = await h.attributesManager.getPersistentAttributes(); } catch (e) { p = {}; }
    const ranking = R.load(p);
    const m = ranking.mejorMarca;
    const txt = m.fecha
      ? `Tu mejor marca es ${m.aciertos} aciertos y ${m.fallos} fallos en ${ranking.partidas} partidas.`
      : 'Aún no tienes partidas terminadas. Juega un rosco completo.';
    const s = h.attributesManager.getSessionAttributes() || {};
    const juego = s.juego;
    if (juego && juego.fase === 'EN_JUEGO') {
      const { getActual, preguntaTexto } = require('../lib/game');
      const actual = getActual(juego);
      return h.responseBuilder.speak(`${txt} Sigues en juego con ${juego.aciertos} aciertos. ${preguntaTexto(actual)}.`).reprompt(`Te repito: ${preguntaTexto(actual)}.`).getResponse();
    }
    return h.responseBuilder.speak(`${txt} ¿Quieres empezar un nuevo rosco?`).reprompt('¿Empezamos?').getResponse();
  }
};

const HelpHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && r.intent.name === 'AMAZON.HelpIntent';
  },
  handle(h) {
    const s = h.attributesManager.getSessionAttributes() || {};
    const base = 'Te digo una definición por letra. Responde con una palabra, o di pasapalabra para saltar, o salir para guardar. ';
    if (s.juego && s.juego.fase === 'EN_JUEGO') {
      const { getActual, preguntaTexto } = require('../lib/game');
      const actual = getActual(s.juego);
      return h.responseBuilder.speak(`${base} Vamos: ${preguntaTexto(actual)}.`).reprompt(`Te repito: ${preguntaTexto(actual)}.`).getResponse();
    }
    return h.responseBuilder.speak(`${base} ¿Empezamos un rosco?`).reprompt('¿Empezamos?').getResponse();
  }
};

const EstadoHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && r.intent.name === 'EstadoRoscoIntent';
  },
  handle(h) {
    const s = h.attributesManager.getSessionAttributes() || {};
    const juego = s.juego;
    if (!juego) return h.responseBuilder.speak('Aún no hay rosco. ¿Empezamos uno?').reprompt('¿Empezamos?').getResponse();
    const { getActual, preguntaTexto } = require('../lib/game');
    const actual = getActual(juego);
    return h.responseBuilder.speak(`Llevas ${juego.aciertos} aciertos y ${juego.fallos} fallos. Ahora: ${preguntaTexto(actual)}.`).reprompt(`Te repito: ${preguntaTexto(actual)}.`).getResponse();
  }
};

const SalirHandler = {
  canHandle(h) {
    const r = h.requestEnvelope.request;
    return r.type === 'IntentRequest' && ['AMAZON.StopIntent', 'AMAZON.CancelIntent', 'SalirIntent', 'AMAZON.NoIntent'].includes(r.intent ? r.intent.name : '') && false;
  },
  async handle(h) { return h.responseBuilder.speak('Hasta luego.').getResponse(); }
};
// Stop real (sin colisión con Nuevo que usa NoIntent solo sin juego): lo registramos aparte
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
      return h.responseBuilder.speak(`No te he entendido. ${preguntaTexto(actual)}.`).reprompt('Repite o di pasapalabra.').getResponse();
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

module.exports = { RankingHandler, HelpHandler, EstadoHandler, StopHandler, FallbackHandler, SessionEndedHandler, ErrorHandler };
