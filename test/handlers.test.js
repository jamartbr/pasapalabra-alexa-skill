'use strict';
// Handlers contra el modelo simplificado: Continuar/No, FIN con récord.
const { SiSeguirHandler, NuevoRoscoHandler } = require('../lambda/handlers/empezar');
const { PasarHandler, ResponderHandler } = require('../lambda/handlers/juego');
const { HelpHandler, StopHandler, FallbackHandler } = require('../lambda/handlers/varios');
const { getActual } = require('../lambda/lib/game');

function mockInput(intentName, session, persistent, slots) {
  const rb = {
    speak(t) { this._speak = t; return this; },
    reprompt(t) { this._reprompt = t; return this; },
    withShouldEndSession(b) { this._end = b; return this; },
    getResponse() { return { speak: this._speak, reprompt: this._reprompt, end: this._end }; }
  };
  return {
    requestEnvelope: { request: { type: 'IntentRequest', intent: { name: intentName, slots: slots || {} } } },
    attributesManager: {
      getSessionAttributes: () => session,
      setSessionAttributes: (s) => Object.assign(session, s),
      getPersistentAttributes: async () => persistent,
      setPersistentAttributes: (p) => Object.assign(persistent, p),
      savePersistentAttributes: async () => {}
    },
    responseBuilder: rb
  };
}
const launchReq = (session, persistent) => ({
  requestEnvelope: { request: { type: 'LaunchRequest' } },
  attributesManager: mockInput('X', session, persistent).attributesManager,
  responseBuilder: mockInput('X', session, persistent).responseBuilder
});

test('SiSeguir responde a Yes/Continuar/Empezar y Nuevo solo a No', () => {
  const h = (n) => ({ requestEnvelope: { request: { type: 'IntentRequest', intent: { name: n } } } });
  ['AMAZON.YesIntent', 'ContinuarRoscoIntent', 'EmpezarRoscoIntent'].forEach((n) => {
    expect(SiSeguirHandler.canHandle(h(n))).toBe(true);
    expect(NuevoRoscoHandler.canHandle(h(n))).toBe(false);
  });
  expect(NuevoRoscoHandler.canHandle(h('AMAZON.NoIntent'))).toBe(true);
  expect(SiSeguirHandler.canHandle(h('AMAZON.NoIntent'))).toBe(false);
  expect(PasarHandler.canHandle(h('PasarIntent'))).toBe(true);
  expect(ResponderHandler.canHandle(h('ResponderIntent'))).toBe(true);
  expect(HelpHandler.canHandle(h('AMAZON.HelpIntent'))).toBe(true);
  expect(StopHandler.canHandle(h('SalirIntent'))).toBe(true);
  expect(FallbackHandler.canHandle(h('AMAZON.FallbackIntent'))).toBe(true);
});

test('Empezar crea rosco y No sin partida previa despide', async () => {
  const session = {}, persistent = {};
  const r1 = await SiSeguirHandler.handle(mockInput('EmpezarRoscoIntent', session, persistent));
  expect(session.juego.rosco.length).toBe(27);
  expect(r1.speak).toMatch(/Comencemos/);
  const s2 = {}, p2 = {};
  const r2 = await NuevoRoscoHandler.handle(mockInput('AMAZON.NoIntent', s2, p2));
  expect(r2.speak).toMatch(/Hasta luego/);
  expect(r2.end).toBe(true);
});

test('No con rosco en curso empieza otro', async () => {
  const session = {}, persistent = {};
  await SiSeguirHandler.handle(mockInput('EmpezarRoscoIntent', session, persistent));
  const r = await NuevoRoscoHandler.handle(mockInput('AMAZON.NoIntent', {}, persistent));
  expect(r.speak).toMatch(/empezamos otro/);
});

test('Continuar retoma donde iba', async () => {
  const session = {}, persistent = {};
  await SiSeguirHandler.handle(mockInput('EmpezarRoscoIntent', session, persistent));
  const s2 = {}, r = await SiSeguirHandler.handle(mockInput('ContinuarRoscoIntent', s2, persistent));
  expect(s2.juego.rosco.length).toBe(27);
  expect(r.speak).toMatch(/Comencemos/);
});

test('Pasar nunca es fallo y marca pasada', async () => {
  const session = {}, persistent = {};
  await SiSeguirHandler.handle(mockInput('EmpezarRoscoIntent', session, persistent));
  const fallos = session.juego.fallos;
  const r = await PasarHandler.handle(mockInput('PasarIntent', session, persistent));
  expect(session.juego.fallos).toBe(fallos);
  expect(r.speak).toMatch(/Vamos con la siguiente/);
});

test('Rosco completo: récord la 1ª vez, mejor marca después', async () => {
  const session = {}, persistent = {};
  await SiSeguirHandler.handle(mockInput('EmpezarRoscoIntent', session, persistent));
  let last;
  for (let i = 0; i < 27; i += 1) {
    const a = getActual(session.juego);
    last = await ResponderHandler.handle(
      mockInput('ResponderIntent', session, persistent, { Respuesta: { value: a.a } })
    );
  }
  expect(last.speak).toMatch(/Nuevo récord/);
  expect(persistent.partidas).toBe(1);
  // Segunda partida peor: 27 fallos
  const s2 = {};
  await SiSeguirHandler.handle(mockInput('EmpezarRoscoIntent', s2, persistent));
  let last2;
  for (let i = 0; i < 27; i += 1) {
    last2 = await ResponderHandler.handle(
      mockInput('ResponderIntent', s2, persistent, { Respuesta: { value: 'zzz' } })
    );
  }
  expect(last2.speak).toMatch(/Tu mejor marca es 27/);
  expect(persistent.partidas).toBe(2);
});
