/**
 * Módulo Simulation: Simulación y cálculo de costos oficiales QuickDrop
 */
const { manhattan } = require('../core/Point');
const { aMinutos } = require('../core/Time');

/**
 * Simula el recorrido de cada vehículo minuto a minuto y calcula el costo exacto.
 * @param {object} mundo 
 * @param {Array<object>} pedidos 
 * @param {Array<object>} vehiculos 
 * @param {object} plan 
 * @returns {object} Resultado detallado de la simulación
 */
function simular(mundo, pedidos, vehiculos, plan) {
  const dep = { x: mundo.deposito_x ?? 0, y: mundo.deposito_y ?? 0 };
  const horaSalida = aMinutos(mundo.hora_salida ?? "08:00");
  const tiempoServicio = mundo.tiempo_servicio ?? 5;
  const tiempoCarga = mundo.tiempo_carga ?? 10;
  const minPorCuadra = mundo.min_por_cuadra ?? 3;
  const costoPorCuadra = mundo.costo_por_cuadra ?? 3;
  const costoPorVehiculo = mundo.costo_por_vehiculo ?? 60;
  const costoPorMinutoTotal = mundo.costo_por_minuto_total ?? 1;
  const costoPorFalla = mundo.costo_por_falla ?? 200;
  const costoPorMinutoPremium = mundo.costo_por_minuto_premium ?? 1;

  const pedidosMap = new Map();
  for (const p of pedidos) pedidosMap.set(p.id, p);

  const vehiculosMap = new Map();
  for (const v of vehiculos) vehiculosMap.set(v.id, v);

  // Validación estricta
  const vehiculosVistos = new Set();
  const pedidosVistos = new Map();
  const errores = [];

  for (let i = 0; i < plan.rutas.length; i++) {
    const r = plan.rutas[i];
    if (!vehiculosMap.has(r.vehiculo)) {
      errores.push(`Ruta ${i + 1}: el vehículo '${r.vehiculo}' no existe.`);
      continue;
    }
    if (vehiculosVistos.has(r.vehiculo)) {
      errores.push(`El vehículo '${r.vehiculo}' aparece en más de una ruta.`);
      continue;
    }
    vehiculosVistos.add(r.vehiculo);

    for (const parada of r.paradas) {
      if (parada === "DEPOSITO") continue;
      if (!pedidosMap.has(parada)) {
        errores.push(`Vehículo ${r.vehiculo}: el pedido ${parada} no existe.`);
        continue;
      }
      if (pedidosVistos.has(parada)) {
        errores.push(`El pedido ${parada} aparece más de una vez.`);
        continue;
      }
      pedidosVistos.set(parada, r.vehiculo);
    }
  }

  if (errores.length > 0) {
    return { valido: false, errores, costo: null };
  }

  const asignados = new Set();
  const usados = [];
  let distanciaTotal = 0;
  let finUltimo = horaSalida;
  let entregados = 0;
  let demoraPremiumTotal = 0;
  const tiemposPorVehiculo = {};

  for (const ruta of plan.rutas) {
    const tienePedidos = ruta.paradas.some(p => p !== "DEPOSITO");
    if (!tienePedidos) continue;

    usados.push(ruta.vehiculo);
    let t = horaSalida;
    let pos = dep;

    for (const parada of ruta.paradas) {
      if (parada === "DEPOSITO") {
        const d = manhattan(pos, dep);
        t += d * minPorCuadra;
        distanciaTotal += d;
        t += tiempoCarga;
        pos = dep;
      } else {
        const p = pedidosMap.get(parada);
        asignados.add(p.id);
        const d = manhattan(pos, { x: p.x, y: p.y });
        distanciaTotal += d;
        t += d * minPorCuadra;
        const llegada = t;
        if (p.premium) {
          demoraPremiumTotal += (llegada - horaSalida);
        }
        pos = { x: p.x, y: p.y };
        t += tiempoServicio;
        entregados++;
      }
    }

    // Retorno final implícito al depósito
    const dVuelta = manhattan(pos, dep);
    t += dVuelta * minPorCuadra;
    distanciaTotal += dVuelta;
    tiemposPorVehiculo[ruta.vehiculo] = t;

    if (t > finUltimo) finUltimo = t;
  }

  const noAsignados = pedidos.filter(p => !asignados.has(p.id)).map(p => p.id);
  const fallidos = noAsignados.length;
  const makespan = finUltimo - horaSalida;

  const componentes = {
    distancia: distanciaTotal * costoPorCuadra,
    vehiculos: usados.length * costoPorVehiculo,
    tiempo: makespan * costoPorMinutoTotal,
    fallas: fallidos * costoPorFalla,
    premium: demoraPremiumTotal * costoPorMinutoPremium,
  };
  componentes.total = componentes.distancia + componentes.vehiculos + componentes.tiempo + componentes.fallas + componentes.premium;

  return {
    valido: true,
    errores: [],
    metricas: {
      pedidos: pedidos.length,
      entregados,
      fallidos,
      distancia_total: distanciaTotal,
      vehiculos_usados: usados.length,
      makespan,
      hora_fin: finUltimo,
      demora_premium: demoraPremiumTotal,
      tiemposPorVehiculo,
    },
    costo: componentes,
  };
}

module.exports = { simular };
