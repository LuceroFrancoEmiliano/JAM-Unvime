# 🚀 QuickDrop Solver — JAM UNViMe

Solución de alto rendimiento para el problema de ruteo vehicular multicriterio **QuickDrop**, desarrollada durante la Jam de Programación de la Universidad Nacional de Villa Mercedes (UNViMe).

---

## 👥 Integrantes del Equipo

* **Franco Lucero**
* **Soto Díaz**
* **Facundo Guzmán**

---

## 📖 Descripción del Proyecto

El sistema resuelve el problema de ruteo de vehículos (VRP) sobre una grilla Manhattan de $20 \times 20$, minimizando una función de costo combinada:

$$\text{Costo} = (c_{\text{cuadra}} \times \text{distancia}) + (c_{\text{vehículo}} \times V_{\text{usados}}) + (c_{\text{tiempo}} \times \text{makespan}) + (c_{\text{falla}} \times \text{fallas}) + (c_{\text{premium}} \times \text{demora\_premium})$$

### 🧠 Estrategia Algorítmica
1. **Barrido Angular (Sweep Algorithm):** Particionamiento radial polar desde el depósito para evitar cruces entre flotas.
2. **Nearest Neighbor con Prioridad VIP:** Los pedidos premium se atienden al inicio de la jornada para minimizar la demora acumulada.
3. **2-Opt con Evaluación Delta $O(1)$:** Eliminación sistemática de cruces de trayectorias en tiempo ultrarrápido.
4. **Balanceo de Makespan (Cuello de Botella):** Nivelación milimétrica del retorno de los vehículos para minimizar el tiempo del último auto.
5. **Decisión Inteligente de Flota:** Selección automática del número óptimo de vehículos para minimizar el costo fijo y de retorno.

---

## 🏗️ Arquitectura Modular

Desarrollado en **Node.js nativo (v24)**, sin librerías externas:

```
JAM/
├── src/
│   ├── core/
│   │   ├── Point.js          # Distancia Manhattan pura
│   │   └── Time.js           # Conversiones HH:MM a minutos
│   ├── io/
│   │   ├── loader.js         # Lector robusto de datasets JSON
│   │   └── exporter.js       # Generador de plan.json
│   ├── simulation/
│   │   └── simulator.js      # Réplica del simulador oficial y validador
│   ├── algorithms/
│   │   ├── nearestNeighbor.js # Tour inicial con prioridad premium
│   │   ├── twoOpt.js         # Algoritmo 2-Opt con delta O(1)
│   │   ├── clustering.js     # Particionamiento espacial (Sweep)
│   │   ├── balance.js        # Balanceador de makespan inter-rutas
│   │   └── optimizer.js      # Orquestador con búsqueda local
│   └── index.js              # Entrypoint y CLI principal
├── ESPECIFICACION.md         # Reglamento oficial de la competencia
├── PLAN_IMPLEMENTACION.md    # Estrategia y defensa del jurado
└── README.md
```

---

## 🚀 Uso y Ejecución

### Requisitos
* [Node.js](https://nodejs.org/) v18 o superior.
* Sin dependencias (`npm install` no requerido).

### Ejecutar el Solver
```bash
# Modo automático (encuentra el menor costo global)
node src/index.js "<ruta_al_dataset>"

# Forzar una cantidad específica de vehículos
node src/index.js "<ruta_al_dataset>" --vehiculos 5
```

### Ejemplo con el dataset de práctica:
```bash
node src/index.js "practica-Práctica Niveles 2 y 3"
```
El programa generará automáticamente el archivo `plan.json` en la carpeta del dataset listo para entregar.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
