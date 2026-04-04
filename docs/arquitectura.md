# Arquitectura Base

## Vision general

La aplicacion se divide en tres capas:

1. `Frontend`
   Interfaz en `HTML`, `CSS` y `JavaScript`.

2. `Backend ligero`
   `Google Apps Script` expuesto como Web App con `doGet` y `doPost`.

3. `Persistencia`
   `Google Sheets` como base de datos y fuente de configuracion.

## Modulos principales

- `Dashboard`
  Resume ingresos, gastos, balance y ahorro.

- `Movimientos`
  Registra ingresos, gastos y transferencias.

- `Presupuesto`
  Compara lo planificado con lo ejecutado.

- `Metas de ahorro`
  Lleva objetivos privados o compartidos.

## Enfoque de usuarios

El sistema usa autenticacion simple y separa dos conceptos:

- `owner`
  Quien registra o a quien pertenece un dato privado.

- `scope`
  Define si un registro es `PRIVADO` o `COMPARTIDO`.

Regla base:

- `ABDIEL` ve lo suyo y lo compartido
- `AYSAH` ve lo suyo y lo compartido

Esto aplica a:

- movimientos
- metas de ahorro
- presupuestos futuros

## Principio de construccion

El proyecto se construira por capas:

1. infraestructura
2. autenticacion y sesiones
3. modulo de movimientos
4. dashboard real
5. presupuesto mensual y metas
