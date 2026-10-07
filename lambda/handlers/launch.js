'use strict';
const { getActual, preguntaTexto } = require('../lib/game');

const BIENVENIDA = "Bienvenidos a Rosco de palabras. Yo no puedo decir 'Pasa', pero tu puedes decir la p-palabra cuando no sepas una respuesta. ¿Quieres empezar un nuevo rosco?";

function speakPregunta(entry) {
  return `Comencemos. ${preguntaTexto(entry)}.`;
}
function repromptPregunta(entry) {
  return `Si no sabes una respuesta di la p-palabra. Te repito: ${preguntaTexto(entry)}.`;
}

const LaunchHandler = {
  canHandle(h) { return h.requestEnvelope.request.type === 'LaunchRequest'; },
  async handle(h) {
    const pers = h.attributesManager.getPersistentAttributes ? {} : {};
    let stored = {};
    try { stored = await h.attributesManager.getPersistentAttributes(); } catch (e) { stored = {}; }
    const enCurso = stored.roscoEnCurso;
    const b = h.responseBuilder;
    if (enCurso && enCurso.fase === 'EN_JUEGO') {
      const actual = enCurso.rosco[enCurso.pos];
      h.attributesManager.setSessionAttributes({ juego: enCurso });
      return b.speak(`Tienes un rosco a medias con ${enCurso.aciertos} aciertos y ${enCurso.fallos} fallos, te toca la ${actual.letra}. ¿Seguimos o empezamos uno nuevo?`)
        .reprompt('¿Seguimos con tu rosco o empezamos uno nuevo?').getResponse();
    }
    return b.speak(BIENVENIDA).reprompt('¿Quieres empezar un nuevo rosco?').getResponse();
  }
};

module.exports = { LaunchHandler, BIENVENIDA, speakPregunta, repromptPregunta };
