/**
 * Módulo Algorithms: Heurística Nearest Neighbor con Prioridad Premium
 */
const { manhattan } = require('../core/Point');

/**
 * Ordena una lista de pedidos usando vecino más cercano.
 * Si existen pedidos premium, se atienden con máxima prioridad al inicio de la ruta.
 * 
 * @param {Array<number>} listaPedidosIds 
 * @param {Map<number, object>} pedidosMap 
 * @param {{x: number, y: number}} inicio 
 * @returns {Array<number>}
 */
function ordenarNearestNeighbor(listaPedidosIds, pedidosMap, inicio) {
  if (listaPedidosIds.length <= 1) return [...listaPedidosIds];

  const premiumIds = listaPedidosIds.filter(id => pedidosMap.get(id)?.premium);
  const normalIds = listaPedidosIds.filter(id => !pedidosMap.get(id)?.premium);

  // Si no hay pedidos premium, tour estándar de mínima distancia
  if (premiumIds.length === 0) {
    return ordenarSubconjunto(listaPedidosIds, pedidosMap, inicio);
  }

  // Si hay pedidos premium, se entregan primero para minimizar la demora acumulada
  const ordenPremium = ordenarSubconjunto(premiumIds, pedidosMap, inicio);
  const posTrasPremium = ordenPremium.length > 0 ? pedidosMap.get(ordenPremium[ordenPremium.length - 1]) : inicio;
  const ordenNormal = ordenarSubconjunto(normalIds, pedidosMap, posTrasPremium);

  return [...ordenPremium, ...ordenNormal];
}

function ordenarSubconjunto(ids, pedidosMap, posInicial) {
  const restantes = new Set(ids);
  const ordenados = [];
  let posActual = posInicial;

  while (restantes.size > 0) {
    let mejorId = null;
    let menorDist = Infinity;

    for (const id of restantes) {
      const p = pedidosMap.get(id);
      const d = manhattan(posActual, p);
      if (d < menorDist) {
        menorDist = d;
        mejorId = id;
      }
    }

    restantes.delete(mejorId);
    ordenados.push(mejorId);
    posActual = pedidosMap.get(mejorId);
  }

  return ordenados;
}

module.exports = { ordenarNearestNeighbor };
