/**
 * Módulo Algorithms: Balanceo de carga y minimización de makespan inter-rutas
 */
const { simular } = require('../simulation/simulator');
const { optimizarPlan2Opt } = require('./twoOpt');

/**
 * Balancea las rutas para minimizar el makespan y el costo global total.
 * Transfiere pedidos del vehículo más lento a vehículos con menor tiempo.
 * 
 * @param {object} planInicial 
 * @param {object} mundo 
 * @param {Array<object>} pedidos 
 * @param {Array<object>} vehiculos 
 * @param {number} minParadasPorVehiculo Mínimo de paradas que debe conservar cada vehículo
 * @returns {object} Plan balanceado
 */
function balancearMakespan(planInicial, mundo, pedidos, vehiculos, minParadasPorVehiculo = 1) {
  const dep = { x: mundo.deposito_x ?? 0, y: mundo.deposito_y ?? 0 };
  let mejorPlan = optimizarPlan2Opt(planInicial, pedidos, dep);
  let resActual = simular(mundo, pedidos, vehiculos, mejorPlan);
  if (!resActual.valido) return planInicial;

  let menorCosto = resActual.costo.total;
  let huboMejora = true;
  let rondas = 0;

  while (huboMejora && rondas < 20) {
    huboMejora = false;
    rondas++;

    // Encontrar el vehículo cuello de botella (el de mayor hora fin)
    const tiempos = resActual.metricas.tiemposPorVehiculo;
    let vehiculoMax = null;
    let tiempoMax = -1;

    for (const [vId, tFin] of Object.entries(tiempos)) {
      if (tFin > tiempoMax) {
        tiempoMax = tFin;
        vehiculoMax = vId;
      }
    }

    const idxRutaCuello = mejorPlan.rutas.findIndex(r => r.vehiculo === vehiculoMax);
    if (idxRutaCuello === -1 || mejorPlan.rutas[idxRutaCuello].paradas.length <= minParadasPorVehiculo) break;

    const rutaCuello = mejorPlan.rutas[idxRutaCuello];

    // Intentar mover cada parada de la ruta cuello de botella a las demás rutas
    for (let pIdx = 0; pIdx < rutaCuello.paradas.length; pIdx++) {
      const pedidoAMover = rutaCuello.paradas[pIdx];

      for (let rDest = 0; rDest < mejorPlan.rutas.length; rDest++) {
        if (rDest === idxRutaCuello) continue;
        const rutaDest = mejorPlan.rutas[rDest];

        // Probar inserción en cada posición posible de rutaDest
        for (let insIdx = 0; insIdx <= rutaDest.paradas.length; insIdx++) {
          const nuevasRutas = mejorPlan.rutas.map((r, i) => {
            if (i === idxRutaCuello) {
              return {
                vehiculo: r.vehiculo,
                paradas: r.paradas.filter((_, idx) => idx !== pIdx)
              };
            }
            if (i === rDest) {
              const p = [...r.paradas];
              p.splice(insIdx, 0, pedidoAMover);
              return { vehiculo: r.vehiculo, paradas: p };
            }
            return { vehiculo: r.vehiculo, paradas: [...r.paradas] };
          });

          // Optimizar con 2-Opt las rutas modificadas
          let planCandidato = { rutas: nuevasRutas };
          planCandidato = optimizarPlan2Opt(planCandidato, pedidos, dep);

          const resCandidato = simular(mundo, pedidos, vehiculos, planCandidato);
          if (resCandidato.valido && resCandidato.costo.total < menorCosto) {
            menorCosto = resCandidato.costo.total;
            mejorPlan = planCandidato;
            resActual = resCandidato;
            huboMejora = true;
            break;
          }
        }
        if (huboMejora) break;
      }
      if (huboMejora) break;
    }
  }

  return mejorPlan;
}

module.exports = { balancearMakespan };
