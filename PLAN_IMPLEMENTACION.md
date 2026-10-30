# 🚀 Plan de Implementación: QuickDrop Solver (JAM UNViMe)

Este plan define la arquitectura, estrategia algorítmica y protocolo operativo para el equipo (**Franco Lucero, Soto Díaz y Facundo Guzmán**) para competir con la máxima eficiencia en la Jam de Programación.

---

## 🎯 1. Objetivos del Sistema

1. **Eficiencia Extrema**: Tiempo de resolución inferior a 1 segundo por dataset, consumiendo mínimos recursos de CPU y memoria.
2. **Máxima Modularidad y Legibilidad**: Cada archivo tiene una única responsabilidad bien definida (Single Responsibility Principle). Código limpio, auto-documentado y fácil de modificar cuando surjan eventos sorpresa (16:45 y 17:30).
3. **Optimización con 2-Opt**: Eliminación sistemática de cruces de trayectorias en la grilla Manhattan para reducir la distancia total al mínimo.
4. **Cero Dependencias Externas**: 100% JavaScript estándar en **Node.js**, sin `npm install`, ejecutable de forma instantánea en cualquier terminal.

---

## 🏗️ 2. Arquitectura Modular del Proyecto

La estructura de carpetas separa datos, lectura/escritura, lógica de simulación, y algoritmos de optimización:

```
JAM/
├── src/
│   ├── core/
│   │   ├── Point.js            # Manejo de coordenadas y distancia Manhattan
│   │   └── Time.js             # Conversión entre formato "HH:MM" y minutos enteros
│   ├── io/
│   │   ├── loader.js           # Lectura y validación de mundo.json, pedidos.json, vehiculos.json
│   │   └── exporter.js         # Serialización y guardado del plan.json oficial
│   ├── simulation/
│   │   ├── validator.js        # Validación estricta de reglas (evitar plan inválido / puntaje 0)
│   │   └── simulator.js        # Simulación minuto a minuto y cálculo del costo exacto
│   ├── algorithms/
│   │   ├── nearestNeighbor.js  # Heurística voraz para ordenamiento inicial de paradas
│   │   ├── twoOpt.js           # Algoritmo 2-Opt puro para eliminar cruces intra-ruta
│   │   ├── clustering.js       # Asignación de pedidos a vehículos (Sweep polar / K-Means)
│   │   ├── balance.js          # Balanceador de makespan (intercambios inter-rutas)
│   │   └── optimizer.js        # Orquestador: selección del número óptimo de vehículos (K)
│   └── index.js                # Punto de entrada CLI: node src/index.js <directorio_dataset>
├── README.md                   # Documentación del equipo y uso
└── ESPECIFICACION.md           # Reglas oficiales de la competencia
```

---

## 🧠 3. Componentes y Responsabilidades

### 3.1. `src/core/Point.js` y `Time.js`
* **`Point`**: Representa una posición $(x, y)$. Define la función pura `manhattan(p1, p2) = |p1.x - p2.x| + |p1.y - p2.y|`.
* **`Time`**: Conversión bidireccional entre `"08:00"` y $480$ minutos.

### 3.2. `src/io/loader.js` y `exporter.js`
* **`loader.js`**: Lee los tres archivos JSON con tolerancia a campos faltantes o valores por defecto.
* **`exporter.js`**: Formatea el resultado en la estructura requerida y guarda `plan.json`:
  ```json
  {
    "rutas": [
      { "vehiculo": "V1", "paradas": [1, 5, 2] }
    ]
  }
  ```

### 3.3. `src/simulation/simulator.js`
* Calcula el costo matemático oficial exacto:
  $$\text{Costo} = 3 \times \text{Distancia} + 60 \times V_{\text{usados}} + 1 \times \text{Makespan} + 200 \times \text{Fallas}$$
* Permite validar la solución localmente antes de subirla a la web del jurado.

### 3.4. `src/algorithms/twoOpt.js`
* **El corazón de la optimización de distancia**:
  * Dada una ruta $[P_0, P_1, P_2, ..., P_k, P_0]$ (iniciando y terminando en el depósito), evalúa pares de aristas $(i, i+1)$ y $(j, j+1)$.
  * Si invertir el segmento comprendido entre $i$ y $j$ reduce la distancia Manhattan acumulada, se aplica la inversión.
  * Se repite en bucle hasta que ningún movimiento 2-Opt genere mejora (óptimo local 2-opt).

### 3.5. `src/algorithms/clustering.js` y `balance.js`
* **Particionamiento**: Ordena los pedidos según su ángulo polar $\theta = \text{atan2}(y - y_{\text{dep}}, x - x_{\text{dep}})$ para formar sectores contiguos y que ningún vehículo se cruce con otro.
* **Balanceo de Makespan**: Identifica el vehículo que más tarda (el que define el `makespan`) y prueba transferir uno de sus pedidos periféricos al vehículo más desocupado. Si la reducción en makespan supera el incremento marginal de distancia, se confirma el traspaso.

### 3.6. `src/algorithms/optimizer.js`
* Evalúa $K$ vehículos activos (desde $1$ hasta la cantidad total disponible).
* Para cada $K$, genera la solución, aplica 2-Opt, balancea y simula.
* Elige de manera determinista la configuración que arroja el **menor costo total global**.

---

## ⏱️ 4. Protocolo Operativo durante la Jam

| Rol | Integrante | Tarea Principal |
|---|---|---|
| **Operador de Datos & Entregas** | Franco Lucero | Descarga el dataset apenas abre el cierre, ejecuta el solver y sube el `plan.json` a la web. |
| **Control de Calidad & Validación** | Soto Díaz | Verifica que el plan sea 100% válido, 0 fallas y revisa los parámetros en `mundo.json`. |
| **Estrategia & Adaptación a Eventos**| Facundo Guzmán | Analiza los cambios de reglas en los Eventos de las 16:45 y 17:30 (ej. capacidades de peso o ventanas de horario). |

### ⚡ Comando Único de Ejecución
```powershell
node src/index.js "nombre_carpeta_dataset"
```
El script leerá los datos, optimizará las rutas con 2-Opt, validará el resultado e imprimirá el costo desglosado en pantalla, guardando directamente el archivo `plan.json` listo para entregar.
