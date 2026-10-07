'use strict';
function defaults() {
  return { mejorMarca: { aciertos: 0, fallos: 0, fecha: null }, partidas: 0, ultimoRosco: null, roscoEnCurso: null };
}
function load(attrs) {
  const d = defaults();
  if (!attrs) return d;
  return {
    mejorMarca: attrs.mejorMarca || d.mejorMarca,
    partidas: attrs.partidas || 0,
    ultimoRosco: attrs.ultimoRosco || null,
    roscoEnCurso: attrs.roscoEnCurso || null
  };
}
function esRecord(ranking, score) {
  return score.aciertos > (ranking.mejorMarca.aciertos || 0);
}
function saveFin(ranking, score) {
  ranking.partidas += 1;
  ranking.ultimoRosco = { ...score, fecha: new Date().toISOString() };
  if (esRecord(ranking, score)) ranking.mejorMarca = { ...score, fecha: new Date().toISOString() };
  ranking.roscoEnCurso = null;
  return ranking;
}
function saveEnCurso(ranking, juego) {
  ranking.roscoEnCurso = juego.fase === 'FIN' ? null : juego;
  return ranking;
}
function clearEnCurso(ranking) { ranking.roscoEnCurso = null; return ranking; }
module.exports = { load, esRecord, saveFin, saveEnCurso, clearEnCurso };
