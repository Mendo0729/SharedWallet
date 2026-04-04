# Mis Finanzas

Aplicacion web para manejar finanzas personales y compartidas usando:

- `HTML + CSS + JavaScript` para la interfaz
- `Google Apps Script` como backend tipo API
- `Google Sheets` como base de datos

Esta infraestructura esta pensada para:

- `ABDIEL`
- `AYSAH`
- `COMPARTIDO`

Ahora incluye:

- login simple con usuarios propios
- sesiones basicas en Apps Script
- visibilidad por `owner` y `scope`
- datos privados y compartidos

## Arquitectura

```text
Mis_Finanzas/
|-- index.html
|-- styles.css
|-- app.js
|-- README.md
|-- docs/
|   |-- arquitectura.md
|   |-- api.md
|   `-- sheets.md
`-- apps-script/
    |-- Code.gs
    `-- appsscript.json
```

## Estado actual

La aplicacion principal vive en `index.html` y ya incluye una primera interfaz usable para:

- iniciar sesion
- registrar movimientos
- ver resumen mensual
- filtrar movimientos
- crear metas de ahorro simples
- trabajar conectada a Apps Script

La explicacion de infraestructura, hojas y API se mantiene en este `README` y en la carpeta `docs/`.

## Hojas del Google Sheet

El proyecto usa estas pestañas:

- `MOVIMIENTOS`
- `CATEGORIAS`
- `PRESUPUESTO_MENSUAL`
- `AHORROS_METAS`
- `CONFIG`
- `USUARIOS`
- `SESIONES`

Los detalles de columnas estan en [docs/sheets.md](./docs/sheets.md).

## API base

Los endpoints iniciales estan documentados en [docs/api.md](./docs/api.md).

## Configuracion inicial

1. Crea un Google Sheet nuevo.
2. Abre `Extensiones > Apps Script`.
3. Copia el contenido de [apps-script/Code.gs](./apps-script/Code.gs).
4. Reemplaza el manifiesto con [apps-script/appsscript.json](./apps-script/appsscript.json).
5. Ejecuta la funcion `setupInfrastructure` una vez desde Apps Script.
6. Publica el proyecto como `Aplicacion web`.
7. Pega la URL publicada en el frontend.

## Credenciales iniciales

Despues de ejecutar `setupInfrastructure`, el script crea estos usuarios de prueba:

- usuario `abdiel` con contrasena `abdiel123`
- usuario `aysah` con contrasena `aysah123`

Conviene cambiarlas manualmente en la hoja `USUARIOS` antes de usar la app en serio.

## Flujo previsto

1. El usuario inicia sesion.
2. El frontend consulta la sesion, catalogos y datos visibles.
3. Apps Script valida permisos y guarda en Sheets.
4. El frontend muestra solo lo privado del usuario y lo compartido.

## Siguiente paso recomendado

El siguiente bloque natural es reforzar la integracion completa con Google Sheets:

- editar y eliminar movimientos
- editar y eliminar metas
- leer presupuestos desde `PRESUPUESTO_MENSUAL`
- calcular dashboard y ahorro acumulado desde consultas agregadas de la API
