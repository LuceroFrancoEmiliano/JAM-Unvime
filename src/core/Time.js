/**
 * Módulo Core: Conversión y manejo de horarios
 */

/**
 * Convierte una cadena de hora "HH:MM" a minutos enteros desde las 00:00.
 * @param {string|number} hora 
 * @returns {number} Minutos
 */
function aMinutos(hora) {
  if (typeof hora === 'number') return hora;
  if (!hora || typeof hora !== 'string') return 480; // 08:00 por defecto
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convierte minutos enteros desde las 00:00 a formato "HH:MM".
 * @param {number} minutos 
 * @returns {string} Formato "HH:MM"
 */
function aHora(minutos) {
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

module.exports = { aMinutos, aHora };
