# API Base

## GET

### `?action=health`

Verifica que la API esta activa.

### `?action=getSession&token=...`

Valida la sesion actual y devuelve:

- `username`
- `nombre`
- `ownerKey`
- `expiresAt`

### `?action=bootstrap&token=...`

Devuelve catalogos y configuracion base:

- usuario actual
- owners
- scopes
- cuentas
- categorias

### `?action=listMovements&token=...`

Devuelve movimientos guardados en `MOVIMIENTOS`.

La API solo devuelve:

- movimientos privados del usuario actual
- movimientos `COMPARTIDO`

### `?action=listGoals&token=...`

Devuelve metas guardadas en `AHORROS_METAS` con la misma regla de visibilidad.

## POST

### `action=login`

Payload esperado:

```json
{
  "action": "login",
  "payload": {
    "username": "abdiel",
    "password": "abdiel123"
  }
}
```

### `action=logout`

Payload esperado:

```json
{
  "action": "logout",
  "token": "session-token"
}
```

### `action=addMovement`

Registra un movimiento nuevo.

Payload esperado:

```json
{
  "action": "addMovement",
  "token": "session-token",
  "payload": {
    "fecha": "2026-04-01",
    "tipo": "GASTO",
    "scope": "COMPARTIDO",
    "cuenta": "Banco",
    "categoria": "Comida",
    "subcategoria": "",
    "monto": 12.5,
    "metodo_pago": "Tarjeta",
    "descripcion": "Almuerzo",
    "recurrente": "NO"
  }
}
```

El `owner` lo asigna automaticamente la API segun el usuario autenticado.

### `action=addGoal`

Payload esperado:

```json
{
  "action": "addGoal",
  "token": "session-token",
  "payload": {
    "meta": "Fondo de emergencia",
    "scope": "COMPARTIDO",
    "objetivo_monto": 2000,
    "fecha_objetivo": "2026-12-31",
    "saldo_actual": 0,
    "estado": "ACTIVA"
  }
}
```

## Acciones internas

### `setupInfrastructure()`

Crea y prepara todas las hojas base del sistema.

### `seedCatalogs()`

Carga categorias, owners, scopes, cuentas y metodos de pago iniciales.

### `seedUsers()`

Crea los usuarios iniciales y deja la hoja `USUARIOS` lista.
