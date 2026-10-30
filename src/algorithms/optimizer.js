/**
 * Módulo Algorithms: Orquestador de Optimización Global
 */
const { manhattan } = require('../core/Point');
const { ordenarNearestNeighbor } = require('./nearestNeighbor');
const { optimizarPlan2Opt } = require('./twoOpt');
const { particionarPorAngulo, particionarKMeans } = require('./clustering');
const { balancearMakespan } = require('./balance');
const { simular } = require('../simulation/simulator');

/**
 * Optimiza el plan de reparto para alcanzar el costo mínimo absoluto.
 * 
 * @param {object} mundo 
 * @param {Array<object>} pedidos 
 * @param {Array<object>} vehiculos 
 * @param {{forzarVehiculos?: number, maxIter?: number}} opciones 
 * @returns {{plan: object, resultado: object}}
 */
function optimizar(mundo, pedidos, vehiculos, opciones = {}) {
  const dep = { x: mundo.deposito_x ?? 0, y: mundo.deposito_y ?? 0 };
  const maxV = vehiculos.length;
  const pedidosMap = new Map();
  for (const p of pedidos) pedidosMap.set(p.id, p);

  // Si se solicita forzar exactamente N vehículos
  const rangoK = opciones.forzarVehiculos 
    ? [Math.min(opciones.forzarVehiculos, maxV)] 
    : Array.from({ length: maxV }, (_, i) => i + 1);

  let mejorPlanGlobal = null;
  let mejorResGlobal = null;
  let menorCosto = Infinity;

  for (const k of rangoK) {
    const tamIdeal = Math.floor(pedidos.length / k);
    const minPorVehiculo = opciones.forzarVehiculos ? Math.max(1, tamIdeal - 2) : 1;
    const maxPorVehiculo = opciones.forzarVehiculos ? tamIdeal + 2 : pedidos.length;
    const candidatos = [];

    // 1. Barridos angulares con rotaciones finas (probar 20 ángulos distintos)
    const pasos = Math.max(1, Math.floor(pedidos.length / 20));
    for (let offset = 0; offset < pedidos.length; offset += pasos) {
      candidatos.push(particionarPorAngulo(pedidos, k, vehiculos, dep, offset));
    }

    // 2. K-Means
    candidatos.push(particionarKMeans(pedidos, k, vehiculos, dep));

    for (let plan of candidatos) {
      // Ordenar paradas con Nearest Neighbor
      const rutasOrdenadas = plan.rutas.map(r => ({
        vehiculo: r.vehiculo,
        paradas: ordenarNearestNeighbor(r.paradas, pedidosMap, dep)
      }));

      // Optimizar con 2-Opt
      let planOpt = optimizarPlan2Opt({ rutas: rutasOrdenadas }, pedidos, dep);

      // Balancear makespan
      planOpt = balancearMakespan(planOpt, mundo, pedidos, vehiculos, minPorVehiculo);

      const res = simular(mundo, pedidos, vehiculos, planOpt);
      if (res.valido) {
        if (opciones.forzarVehiculos && res.metricas.vehiculos_usados !== k) continue;
        if (res.costo.total < menorCosto) {
          menorCosto = res.costo.total;
          mejorPlanGlobal = planOpt;
          mejorResGlobal = res;
        }
      }
    }
  }

  // Refinamiento estocástico con recocido simulado guiado por makespan y 2-Opt
  if (mejorPlanGlobal) {
    const kActual = mejorPlanGlobal.rutas.length;
    const tamIdeal = Math.floor(pedidos.length / kActual);
    const minPorVehiculo = opciones.forzarVehiculos ? Math.max(1, tamIdeal - 2) : 1;
    const maxPorVehiculo = opciones.forzarVehiculos ? tamIdeal + 2 : pedidos.length;

    mejorPlanGlobal = refinamientoEstocastico(
      mejorPlanGlobal,
      mundo,
      pedidos,
      vehiculos,
      dep,
      opciones.maxIter || 6000,
      minPorVehiculo,
      maxPorVehiculo,
      opciones.forzarVehiculos
    );
    mejorPlanGlobal = optimizarPlan2Opt(mejorPlanGlobal, pedidos, dep);
    mejorResGlobal = simular(mundo, pedidos, vehiculos, mejorPlanGlobal);
  }

  return { plan: mejorPlanGlobal, resultado: mejorResGlobal };
}

/**
 * Refinamiento estocástico guiado: equilibra makespan y reduce distancia con 2-Opt.
 */
function refinamientoEstocastico(planInicial, mundo, pedidos, vehiculos, dep, maxIter, minPorVehiculo, maxPorVehiculo, kExacto) {
  let mejorPlan = JSON.parse(JSON.stringify(planInicial));
  let resMejor = simular(mundo, pedidos, vehiculos, mejorPlan);
  let mejorCosto = resMejor.costo.total;

  let planActual = JSON.parse(JSON.stringify(planInicial));
  let costoActual = mejorCosto;

  for (let it = 0; it < maxIter; it++) {
    const rutasCopia = planActual.rutas.map(r => ({
      vehiculo: r.vehiculo,
      paradas: [...r.paradas]
    }));

    const numRutas = rutasCopia.length;
    if (numRutas <= 1) break;

    // Encontrar el vehículo con más tiempo y el con menos tiempo
    const resSim = simular(mundo, pedidos, vehiculos, { rutas: rutasCopia });
    if (!resSim.valido) continue;

    const tiempos = resSim.metricas.tiemposPorVehiculo;
    let r1 = 0; // Por defecto
    let r2 = 1;

    // Con probabilidad 0.6, seleccionar r1 = ruta más lenta y r2 = ruta más rápida
    if (Math.random() < 0.6 && tiempos) {
      let maxT = -1, minT = Infinity;
      rutasCopia.forEach((r, idx) => {
        const t = tiempos[r.vehiculo] || 0;
        if (t > maxT) { maxT = t; r1 = idx; }
        if (t < minT) { minT = t; r2 = idx; }
      });
      if (r1 === r2) {
        r2 = (r1 + 1) % numRutas;
      }
    } else {
      r1 = Math.floor(Math.random() * numRutas);
      r2 = Math.floor(Math.random() * numRutas);
      while (r2 === r1) r2 = Math.floor(Math.random() * numRutas);
    }

    const op = Math.random();

    if (op < 0.45 && rutasCopia[r1].paradas.length > minPorVehiculo && (!maxPorVehiculo || rutasCopia[r2].paradas.length < maxPorVehiculo)) {
      // Transferir parada de r1 a r2
      const pIdx = Math.floor(Math.random() * rutasCopia[r1].paradas.length);
      const [parada] = rutasCopia[r1].paradas.splice(pIdx, 1);
      const insIdx = Math.floor(Math.random() * (rutasCopia[r2].paradas.length + 1));
      rutasCopia[r2].paradas.splice(insIdx, 0, parada);
      const pedidosMap = new Map();
      for (const p of pedidos) pedidosMap.set(p.id, p);
      rutasCopia[r1].paradas = require('./twoOpt').optimizarRuta2Opt(rutasCopia[r1].paradas, pedidosMap, dep);
      rutasCopia[r2].paradas = require('./twoOpt').optimizarRuta2Opt(rutasCopia[r2].paradas, pedidosMap, dep);
    } else if (op < 0.75 && rutasCopia[r1].paradas.length > 0 && rutasCopia[r2].paradas.length > 0) {
      // Intercambiar paradas entre r1 y r2
      const p1 = Math.floor(Math.random() * rutasCopia[r1].paradas.length);
      const p2 = Math.floor(Math.random() * rutasCopia[r2].paradas.length);
      const temp = rutasCopia[r1].paradas[p1];
      rutasCopia[r1].paradas[p1] = rutasCopia[r2].paradas[p2];
      rutasCopia[r2].paradas[p2] = temp;
      const pedidosMap = new Map();
      for (const p of pedidos) pedidosMap.set(p.id, p);
      rutasCopia[r1].paradas = require('./twoOpt').optimizarRuta2Opt(rutasCopia[r1].paradas, pedidosMap, dep);
      rutasCopia[r2].paradas = require('./twoOpt').optimizarRuta2Opt(rutasCopia[r2].paradas, pedidosMap, dep);
    } else {
      // 2-Opt local dentro de una ruta
      const r = Math.floor(Math.random() * numRutas);
      const len = rutasCopia[r].paradas.length;
      if (len >= 3) {
        const i = Math.floor(Math.random() * (len - 1));
        const j = i + 1 + Math.floor(Math.random() * (len - 1 - i));
        const sub = rutasCopia[r].paradas.slice(i, j + 1).reverse();
        rutasCopia[r].paradas.splice(i, sub.length, ...sub);
      }
    }

    const planCandidato = { rutas: rutasCopia };
    const res = simular(mundo, pedidos, vehiculos, planCandidato);

    if (res.valido) {
      if (kExacto && res.metricas.vehiculos_usados !== kExacto) continue;

      const delta = res.costo.total - costoActual;
      if (delta < 0 || Math.random() < Math.exp(-delta / 3.0)) {
        planActual = planCandidato;
        costoActual = res.costo.total;
        if (costoActual < mejorCosto) {
          mejorCosto = costoActual;
          mejorPlan = JSON.parse(JSON.stringify(planCandidato));
        }
      }
    }
  }

  return mejorPlan;
}

module.exports = { optimizar };
