'use strict';
const Alexa = require('ask-sdk-core');
const { LaunchHandler } = require('./handlers/launch');
const { SiSeguirHandler, NuevoRoscoHandler } = require('./handlers/empezar');
const { PasarHandler, ResponderHandler } = require('./handlers/juego');
const { RankingHandler, HelpHandler, EstadoHandler, StopHandler, FallbackHandler, SessionEndedHandler, ErrorHandler } = require('./handlers/varios');

let persistenceAdapter;
try {
  const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
  persistenceAdapter = new DynamoDbPersistenceAdapter({ tableName: process.env.DYNAMODB_TABLE || 'rosco-de-palabras', createTable: true });
} catch (e) {
  persistenceAdapter = undefined;
}

const builder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LaunchHandler, PasarHandler, ResponderHandler, SiSeguirHandler, NuevoRoscoHandler, RankingHandler, EstadoHandler, HelpHandler, StopHandler, FallbackHandler, SessionEndedHandler)
  .addErrorHandlers(ErrorHandler);

if (persistenceAdapter) builder.withPersistenceAdapter(persistenceAdapter);

exports.handler = builder.lambda();
