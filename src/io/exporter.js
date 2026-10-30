/**
 * Módulo IO: Exportación del plan oficial JSON
 */
const fs = require('fs');

/**
 * Guarda el plan en formato JSON oficial.
 * @param {string} rutaDestino 
 * @param {object} plan 
 */
function guardarPlan(rutaDestino, plan) {
  const contenido = JSON.stringify(plan, null, 2);
  fs.writeFileSync(rutaDestino, contenido, 'utf-8');
}

module.exports = { guardarPlan };
