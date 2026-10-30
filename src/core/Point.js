/**
 * Módulo Core: Operaciones geométricas y distancia Manhattan
 */

/**
 * Calcula la distancia Manhattan entre dos puntos.
 * @param {{x: number, y: number}} p1 
 * @param {{x: number, y: number}} p2 
 * @returns {number} Distancia en cuadras
 */
function manhattan(p1, p2) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

module.exports = { manhattan };
