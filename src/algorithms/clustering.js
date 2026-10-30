/**
 * Módulo Algorithms: Particionamiento y Clustering de pedidos por vehículo
 */
const { manhattan } = require('../core/Point');

/**
 * Particiona pedidos usando barrido angular (Sweep Algorithm) respecto al depósito.
 * @param {Array<object>} pedidos 
 * @param {number} k Cantidad de vehículos activos
 * @param {Array<object>} vehiculos 
 * @param {{x: number, y: number}} dep Depósito
 * @param {number} offset Desplazamiento de ángulo inicial
 * @returns {object} Plan particionado
 */
function particionarPorAngulo(pedidos, k, vehiculos, dep, offset = 0) {
  const conAngulo = pedidos.map(p => {
    const angulo = Math.atan2(p.y - dep.y, p.x - dep.x);
    return { id: p.id, angulo, x: p.x, y: p.y };
  });

  conAngulo.sort((a, b) => a.angulo - b.angulo);

  // Aplicar rotación offset
  const n = conAngulo.length;
  const rotada = offset === 0 ? conAngulo : [...conAngulo.slice(offset), ...conAngulo.slice(0, offset)];

  const rutas = [];
  const tamBase = Math.floor(n / k);
  const sobrantes = n % k;

  let inicio = 0;
  for (let i = 0; i < k; i++) {
    const tam = tamBase + (i < sobrantes ? 1 : 0);
    const slice = rotada.slice(inicio, inicio + tam);
    rutas.push({
      vehiculo: vehiculos[i].id,
      paradas: slice.map(p => p.id)
    });
    inicio += tam;
  }

  return { rutas };
}

/**
 * Particiona pedidos usando K-Means espacial para generar clusters compactos.
 * @param {Array<object>} pedidos 
 * @param {number} k Cantidad de vehículos
 * @param {Array<object>} vehiculos 
 * @param {{x: number, y: number}} dep 
 * @returns {object} Plan particionado
 */
function particionarKMeans(pedidos, k, vehiculos, dep) {
  const n = pedidos.length;
  const centroides = [];

  // Inicializar centroides distribuidos
  for (let i = 0; i < k; i++) {
    const idx = Math.floor((i / k) * n);
    centroides.push({ x: pedidos[idx].x, y: pedidos[idx].y });
  }

  let clusters = Array.from({ length: k }, () => []);

  for (let iter = 0; iter < 10; iter++) {
    clusters = Array.from({ length: k }, () => []);
    for (const p of pedidos) {
      let minDist = Infinity;
      let mejorC = 0;
      for (let c = 0; c < k; c++) {
        const d = manhattan(p, centroides[c]);
        if (d < minDist) {
          minDist = d;
          mejorC = c;
        }
      }
      clusters[mejorC].push(p);
    }

    // Recalcular centroides
    for (let c = 0; c < k; c++) {
      if (clusters[c].length > 0) {
        centroides[c].x = clusters[c].reduce((s, p) => s + p.x, 0) / clusters[c].length;
        centroides[c].y = clusters[c].reduce((s, p) => s + p.y, 0) / clusters[c].length;
      }
    }
  }

  // Si algún cluster quedó vacío, redistribuir
  const pedidosAsignados = [];
  for (let i = 0; i < k; i++) {
    pedidosAsignados.push(...clusters[i]);
  }

  const rutas = [];
  for (let i = 0; i < k; i++) {
    rutas.push({
      vehiculo: vehiculos[i].id,
      paradas: clusters[i].map(p => p.id)
    });
  }

  return { rutas };
}

module.exports = { particionarPorAngulo, particionarKMeans };
