/**
 * Módulo IO: Carga de datasets JSON
 */
const fs = require('fs');
const path = require('path');

/**
 * Carga mundo.json, pedidos.json y vehiculos.json desde una carpeta dada.
 * @param {string} datasetDir 
 * @returns {{mundo: object, pedidos: Array<object>, vehiculos: Array<object>}}
 */
function cargarDataset(datasetDir) {
  const mundoPath = path.join(datasetDir, 'mundo.json');
  const pedidosPath = path.join(datasetDir, 'pedidos.json');
  const vehiculosPath = path.join(datasetDir, 'vehiculos.json');

  if (!fs.existsSync(mundoPath)) throw new Error(`No se encontró ${mundoPath}`);
  if (!fs.existsSync(pedidosPath)) throw new Error(`No se encontró ${pedidosPath}`);
  if (!fs.existsSync(vehiculosPath)) throw new Error(`No se encontró ${vehiculosPath}`);

  const mundo = JSON.parse(fs.readFileSync(mundoPath, 'utf-8'));
  const pedidos = JSON.parse(fs.readFileSync(pedidosPath, 'utf-8'));
  const vehiculos = JSON.parse(fs.readFileSync(vehiculosPath, 'utf-8'));

  return { mundo, pedidos, vehiculos };
}

module.exports = { cargarDataset };
