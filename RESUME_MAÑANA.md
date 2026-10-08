# Reanudar mañana — Pasapalabra Alexa Skill (2026-10-08)

## Dónde estamos
Skill completa en código y subida a GitHub. Falta crearla en la consola
Amazon e importarla para probarla en el Echo real. El usuario mañana tendrá
acceso a la cuenta Amazon vinculada a su Alexa.

- Repo: `github.com/jamartbr/pasapalabra-alexa-skill` (PÚBLICO a propósito,
  para el importador de Alexa que solo acepta repos públicos).
- Rama `main`, 12 commits, push al día (`6f2fe79`), árbol limpio.
- Remoto por SSH: `git@github.com:jamartbr/pasapalabra-alexa-skill.git`
  (el HTTPS pedía login; el SSH ya autentica como jamartbr).
- Tests: 23/23 verde (`npm test` desde `lambda/`), `game.js` 84.9%.

## Verificado para importar (266KB << 50MB)
Estructura oficial v2: `skill-package/` + `lambda/index.js`, Node 20,
idioma `es-ES`, sin `node_modules`. Riesgo conocido: extras en raíz
(`test/`, `ask-resources.json`, `opencode.json`) podrían quejarse al
importador → plan B: skill vacía + Code → Import Code (ZIP de `lambda/`)
+ pegar `skill-package/interactionModels/custom/es-ES.json` en el editor.

## Contratos cerrados (no reabrir sin pedir)
1. Invocación: **"rosco de palabras"** ("jugar a rosco de palabras").
2. `jugar / nuevo rosco` (EmpezarRoscoIntent) SIEMPRE crea rosco nuevo.
3. `continuar / seguir` (ContinuarRoscoIntent) o Sí retoma; No = nuevo si
   había partida, despedida si no.
4. `pasapalabra` salta letra (PasarIntent prioritario, nunca fallo).
5. `salir` (+Stop/Cancel) guarda `roscoEnCurso` y cierra.
6. Cualquier otra palabra = respuesta (ResponderIntent SearchQuery).
7. DELIBERADO: PasarIntent solo oye `pasapalabra, la p-palabra, paso
   palabra`; `pasa/paso` seco cae en Fallback a propósito. No ampliar.
8. Ranking LOCAL (mejor marca + partidas), sin temporizador, loop circular
   sin rondas, `normaliza()` preserva la Ñ, banco 27x25 con cuota
   1 autor + 3 conjugaciones + 21 definiciones y unicidad global de
   respuestas (conflicto: se queda en la letra por la que empieza; si
   ninguna, fuera de ambas + rellenar).
9. Autores = primer apellido / nombre / artístico según se le conozca
   (ej. neruda, lope, rembrandt). Verificado 27/27.

## Privado vs público (experimento)
`.opencode/` (4 agentes), `*.local`, `.ask/`, `node_modules/`,
`lambda/coverage/`, `.obsidian/` están en `.gitignore` y NO se suben.
Agentes: planificador-rosco, coder-rosco, tester-rosco, revisor-mentor
(`mode: subagent`, invocar con @). Tras crear agentes hay que reiniciar
opencode. Commits en español conventional; el revisor explica el diff y
pregunta ¿commiteo? ¿push? antes de actuar.

## Próximos pasos mañana (guía ya dada al usuario)
1. `developer.amazon.com` con el email del Echo → Create Skill →
   `Rosco de palabras`, es-ES, Custom, Alexa-Hosted (Node.js) → Import
   skill con la URL del repo → Build Model → Deploy.
2. Test → Development → simulador (abrir, jugar, responder, pasapalabra,
   salir, reabrir, continuar). El simulador NO corta a los 8s.
3. Echo real (misma cuenta, locale ES): "Alexa, jugar a rosco de palabras".
   Revisar app Alexa → Historial y Skill I/O (consideredIntents) si algo
   se enruta mal. DynamoDB se autocrea al primer uso.
4. Tras importar OK, el repo puede volver a privado.
