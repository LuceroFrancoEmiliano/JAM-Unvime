#!/usr/bin/env node
/**
 * QuickDrop Solver — CLI Principal
 * Equipo: Franco Lucero, Soto Díaz, Facundo Guzmán
 */
const path = require('path');
const { cargarDataset } = require('./io/loader');
const { guardarPlan } = require('./io/exporter');
const { optimizar } = require('./algorithms/optimizer');
const { aHora } = require('./core/Time');

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log(`
Uso:
  node src/index.js <directorio_dataset> [opciones]

Opciones:
  --vehiculos <N>   Fuerza el uso de exactamente N vehículos (ej. 5)
  --salida <ruta>   Ruta específica para guardar el plan.json
  --iter <N>        Número de iteraciones de refinamiento (defecto: 6000)

Ejemplos:
  node src/index.js "practica-Práctica Niveles 2 y 3" --vehiculos 5
  node src/index.js "datos/ejemplo"
`);
    process.exit(1);
  }

  const datasetDir = args[0];
  let forzarVehiculos = null;
  let salidaPath = path.join(datasetDir, 'plan.json');
  let maxIter = 6000;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--vehiculos' || args[i] === '-v') {
      forzarVehiculos = parseInt(args[++i], 10);
    } else if (args[i] === '--salida' || args[i] === '-o') {
      salidaPath = args[++i];
    } else if (args[i] === '--iter') {
      maxIter = parseInt(args[++i], 10);
    }
  }

  console.log(`\n========================================`);
  console.log(`🚀 QUICKDROP SOLVER — JAM UNViMe`);
  console.log(`Dataset: ${datasetDir}`);
  if (forzarVehiculos) console.log(`Configuración: Forzando uso de los ${forzarVehiculos} vehículos`);
  console.log(`========================================\n`);

  const tInicio = Date.now();
  const { mundo, pedidos, vehiculos } = cargarDataset(datasetDir);

  const { plan, resultado } = optimizar(mundo, pedidos, vehiculos, {
    forzarVehiculos,
    maxIter
  });

  const tTotal = ((Date.now() - tInicio) / 1000).toFixed(2);

  guardarPlan(salidaPath, plan);

  console.log(`✅ Plan generado exitosamente en: ${salidaPath}`);
  console.log(`⏱️ Tiempo de cálculo: ${tTotal} segundos\n`);

  console.log(`--- REPORTE DE SIMULACIÓN ---`);
  console.log(`Estado:                ${resultado.valido ? 'VALIDO ✔' : 'INVALIDO ❌'}`);
  console.log(`Pedidos entregados:    ${resultado.metricas.entregados} de ${pedidos.length} (Fallas: ${resultado.metricas.fallidos})`);
  console.log(`Vehículos utilizados:  ${resultado.metricas.vehiculos_usados} de ${vehiculos.length}`);
  console.log(`Distancia total:       ${resultado.metricas.distancia_total} cuadras (Costo: $${resultado.costo.distancia})`);
  console.log(`Costo de vehículos:    $${resultado.costo.vehiculos}`);
  console.log(`Makespan (duración):   ${resultado.metricas.makespan} min [Finaliza a las ${aHora(resultado.metricas.hora_fin)}] (Costo: $${resultado.costo.tiempo})`);
  console.log(`Costo de fallas:       $${resultado.costo.fallas}`);
  if (resultado.costo.premium !== undefined && resultado.costo.premium > 0) {
    console.log(`Costo clientes premium: $${resultado.costo.premium} (${resultado.metricas.demora_premium} min acumulados)`);
  }
  console.log(`-----------------------------`);
  console.log(`🏆 COSTO TOTAL FINAL:  $${resultado.costo.total}`);
  console.log(`=============================\n`);

  // Detalle por vehículo
  console.log(`Detalle por vehículo:`);
  for (const ruta of plan.rutas) {
    const tFin = resultado.metricas.tiemposPorVehiculo[ruta.vehiculo];
    console.log(`  • ${ruta.vehiculo}: ${ruta.paradas.length} pedidos | Regreso: ${aHora(tFin)} (${tFin - (mundo.hora_salida ? parseInt(mundo.hora_salida.split(':')[0])*60 + parseInt(mundo.hora_salida.split(':')[1]) : 480)} min)`);
  }
  console.log(``);
}

if (require.main === module) {
  main();
}
