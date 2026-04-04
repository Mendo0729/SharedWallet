# Estructura de Google Sheets

## Hoja `MOVIMIENTOS`

Cada fila representa un gasto, ingreso o transferencia.

Columnas:

- `fecha`
- `tipo`
- `owner`
- `scope`
- `cuenta`
- `categoria`
- `subcategoria`
- `monto`
- `metodo_pago`
- `descripcion`
- `recurrente`
- `mes`

## Hoja `CATEGORIAS`

Columnas:

- `categoria`
- `tipo`
- `activa`

## Hoja `PRESUPUESTO_MENSUAL`

Columnas:

- `mes`
- `owner`
- `scope`
- `categoria`
- `presupuesto_monto`

## Hoja `AHORROS_METAS`

Columnas:

- `meta`
- `owner`
- `scope`
- `objetivo_monto`
- `fecha_objetivo`
- `saldo_actual`
- `estado`

## Hoja `CONFIG`

Columnas:

- `grupo`
- `clave`
- `valor`

Valores iniciales previstos:

- owners
- scopes
- cuentas
- metodos de pago
- limites o reglas futuras

Owners iniciales del sistema:

- `ABDIEL`
- `AYSAH`

## Hoja `USUARIOS`

Columnas:

- `username`
- `password_hash`
- `nombre`
- `owner_key`
- `estado`

## Hoja `SESIONES`

Columnas:

- `token`
- `username`
- `owner_key`
- `expires_at`
- `estado`
