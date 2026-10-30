/**
 * Módulo Algorithms: Algoritmo 2-Opt para optimización de rutas TSP con soporte Premium
 */
const { manhattan } = require('../core/Point');

/**
 * Optimiza una secuencia de paradas usando 2-Opt con evaluación delta O(1).
 * Respeta la prioridad de pedidos premium para evitar demoras costosas.
 * 
 * @param {Array<number>} paradas Lista de IDs de pedidos
 * @param {Map<number, object>} pedidosMap Mapa de ID a objeto de pedido
 * @param {{x: number, y: number}} deposito Coordenadas del depósito
 * @returns {Array<number>} Paradas optimizadas
 */
function optimizarRuta2Opt(paradas, pedidosMap, deposito) {
  if (paradas.length <= 2) return [...paradas];

  // Si la ruta contiene pedidos premium, optimizar respetando su prioridad al frente
  const tienePremium = paradas.some(pid => pedidosMap.get(pid)?.premium);
  if (tienePremium) {
    const premiumPart = paradas.filter(pid => pedidosMap.get(pid)?.premium);
    const normalPart = paradas.filter(pid => !pedidosMap.get(pid)?.premium);

    const optPremium = optimizarRuta2OptPuro(premiumPart, pedidosMap, deposito);
    const posFinalPremium = optPremium.length > 0 ? pedidosMap.get(optPremium[optPremium.length - 1]) : deposito;
    const optNormal = optimizarRuta2OptPuro(normalPart, pedidosMap, posFinalPremium);

    return [...optPremium, ...optNormal];
  }

  return optimizarRuta2OptPuro(paradas, pedidosMap, deposito);
}

/**
 * 2-Opt puro estándar para un subsegmento continuo.
 */
function optimizarRuta2OptPuro(paradas, pedidosMap, posInicio) {
  if (paradas.length <= 2) return [...paradas];

  let ruta = [...paradas];
  let mejoro = true;
  let iteraciones = 0;
  const maxIteraciones = 500;

  while (mejoro && iteraciones < maxIteraciones) {
    mejoro = false;
    iteraciones++;

    const n = ruta.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const prevI = i === 0 ? posInicio : pedidosMap.get(ruta[i - 1]);
        const nodoI = pedidosMap.get(ruta[i]);
        const nodoJ = pedidosMap.get(ruta[j]);
        const nextJ = j === n - 1 ? posInicio : pedidosMap.get(ruta[j + 1]);

        // Cálculo delta O(1)
        const dActual = manhattan(prevI, nodoI) + manhattan(nodoJ, nextJ);
        const dNueva = manhattan(prevI, nodoJ) + manhattan(nodoI, nextJ);

        if (dNueva < dActual) {
          const sub = ruta.slice(i, j + 1).reverse();
          ruta.splice(i, sub.length, ...sub);
          mejoro = true;
          break;
        }
      }
      if (mejoro) break;
    }
  }

  return ruta;
}

/**
 * Aplica 2-Opt a todas las rutas de un plan.
 * @param {object} plan 
 * @param {Array<object>} pedidos 
 * @param {{x: number, y: number}} deposito 
 * @returns {object} Plan optimizado
 */
function optimizarPlan2Opt(plan, pedidos, deposito) {
  const pedidosMap = new Map();
  for (const p of pedidos) pedidosMap.set(p.id, p);

  const nuevasRutas = plan.rutas.map(r => ({
    vehiculo: r.vehiculo,
    paradas: optimizarRuta2Opt(r.paradas, pedidosMap, deposito)
  }));

  return { rutas: nuevasRutas };
}

module.exports = { optimizarRuta2Opt, optimizarPlan2Opt };
