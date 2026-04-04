const SESSION_DURATION_DAYS = 7;

const SHEETS = {
  MOVIMIENTOS: [
    "fecha",
    "tipo",
    "owner",
    "scope",
    "cuenta",
    "categoria",
    "subcategoria",
    "monto",
    "metodo_pago",
    "descripcion",
    "recurrente",
    "mes",
  ],
  CATEGORIAS: ["categoria", "tipo", "activa"],
  PRESUPUESTO_MENSUAL: ["mes", "owner", "scope", "categoria", "presupuesto_monto"],
  AHORROS_METAS: ["meta", "owner", "scope", "objetivo_monto", "fecha_objetivo", "saldo_actual", "estado"],
  CONFIG: ["grupo", "clave", "valor"],
  USUARIOS: ["username", "password_hash", "nombre", "owner_key", "estado"],
  SESIONES: ["token", "username", "owner_key", "expires_at", "estado"],
};

const DEFAULT_CONFIG = [
  ["owners", "ABDIEL", "ABDIEL"],
  ["owners", "AYSAH", "AYSAH"],
  ["scopes", "PRIVADO", "PRIVADO"],
  ["scopes", "COMPARTIDO", "COMPARTIDO"],
  ["cuentas", "Efectivo", "Efectivo"],
  ["cuentas", "Banco", "Banco"],
  ["cuentas", "Tarjeta", "Tarjeta"],
  ["metodos_pago", "Efectivo", "Efectivo"],
  ["metodos_pago", "Tarjeta", "Tarjeta"],
  ["metodos_pago", "Transferencia", "Transferencia"],
];

const DEFAULT_CATEGORIES = [
  ["Comida", "GASTO", "SI"],
  ["Transporte", "GASTO", "SI"],
  ["Casa/Servicios", "GASTO", "SI"],
  ["Internet/Telefono", "GASTO", "SI"],
  ["Salud", "GASTO", "SI"],
  ["Educacion", "GASTO", "SI"],
  ["Entretenimiento", "GASTO", "SI"],
  ["Compras", "GASTO", "SI"],
  ["Suscripciones", "GASTO", "SI"],
  ["Ahorro", "TRANSFERENCIA", "SI"],
  ["Otros", "GASTO", "SI"],
  ["Salario", "INGRESO", "SI"],
  ["Extra", "INGRESO", "SI"],
  ["Reembolsos", "INGRESO", "SI"],
  ["Otros", "INGRESO", "SI"],
];

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "health";

  try {
    if (action === "health") {
      return jsonResponse({
        success: true,
        message: "API activa",
      });
    }

    if (action === "getSession") {
      const session = requireSession(getTokenFromGet(e));
      return jsonResponse({
        success: true,
        data: buildSessionPayload(session),
      });
    }

    if (action === "bootstrap") {
      const session = requireSession(getTokenFromGet(e));
      return jsonResponse({
        success: true,
        data: getBootstrapData(session),
      });
    }

    if (action === "listMovements") {
      const session = requireSession(getTokenFromGet(e));
      return jsonResponse({
        success: true,
        data: listMovements(session),
      });
    }

    if (action === "listGoals") {
      const session = requireSession(getTokenFromGet(e));
      return jsonResponse({
        success: true,
        data: listGoals(session),
      });
    }

    return jsonResponse({
      success: false,
      message: "Accion GET no soportada.",
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message,
    });
  }
}

function doPost(e) {
  try {
    const request = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = request.action;

    if (action === "login") {
      const payload = request.payload || {};
      const session = login(payload.username, payload.password);
      return jsonResponse({
        success: true,
        data: {
          token: session.token,
          user: buildSessionPayload(session),
        },
      });
    }

    if (action === "logout") {
      requireSession(request.token);
      logout(request.token);
      return jsonResponse({
        success: true,
        message: "Sesion cerrada correctamente.",
      });
    }

    if (action === "addMovement") {
      const session = requireSession(request.token);
      const payload = request.payload || {};
      const normalizedMovement = normalizeMovementPayload(payload, session);
      validateMovement(normalizedMovement);
      appendMovement(normalizedMovement);

      return jsonResponse({
        success: true,
        message: "Movimiento guardado correctamente.",
      });
    }

    if (action === "addGoal") {
      const session = requireSession(request.token);
      const payload = request.payload || {};
      const normalizedGoal = normalizeGoalPayload(payload, session);
      validateGoal(normalizedGoal);
      appendGoal(normalizedGoal);

      return jsonResponse({
        success: true,
        message: "Meta guardada correctamente.",
      });
    }

    return jsonResponse({
      success: false,
      message: "Accion POST no soportada.",
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error.message,
    });
  }
}

function setupInfrastructure() {
  Object.keys(SHEETS).forEach(function (sheetName) {
    ensureSheet(sheetName, SHEETS[sheetName]);
  });

  seedCatalogs();
  seedUsers();

  return {
    success: true,
    message: "Infraestructura creada correctamente.",
  };
}

function seedCatalogs() {
  const configSheet = ensureSheet("CONFIG", SHEETS.CONFIG);
  const categoriesSheet = ensureSheet("CATEGORIAS", SHEETS.CATEGORIAS);

  writeRowsIfEmpty(configSheet, DEFAULT_CONFIG);
  writeRowsIfEmpty(categoriesSheet, DEFAULT_CATEGORIES);

  return {
    success: true,
    message: "Catalogos iniciales cargados.",
  };
}

function seedUsers() {
  const usersSheet = ensureSheet("USUARIOS", SHEETS.USUARIOS);

  if (usersSheet.getLastRow() > 1) {
    return {
      success: true,
      message: "Usuarios existentes preservados.",
    };
  }

  const defaultUsers = [
    ["abdiel", hashPassword("abdiel123"), "Abdiel", "ABDIEL", "ACTIVO"],
    ["aysah", hashPassword("aysah123"), "Aysah", "AYSAH", "ACTIVO"],
  ];

  usersSheet.getRange(2, 1, defaultUsers.length, defaultUsers[0].length).setValues(defaultUsers);

  return {
    success: true,
    message: "Usuarios iniciales creados.",
  };
}

function login(username, password) {
  setupInfrastructure();

  const normalizedUsername = String(username || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  if (!normalizedUsername || !rawPassword) {
    throw new Error("Usuario y contrasena son obligatorios.");
  }

  const user = findUserByUsername(normalizedUsername);

  if (!user || user.estado !== "ACTIVO") {
    throw new Error("Usuario no valido.");
  }

  if (user.password_hash !== hashPassword(rawPassword)) {
    throw new Error("Credenciales incorrectas.");
  }

  const token = Utilities.getUuid();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const sessionsSheet = ensureSheet("SESIONES", SHEETS.SESIONES);

  sessionsSheet.appendRow([
    token,
    user.username,
    user.owner_key,
    Utilities.formatDate(expiresAt, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss"),
    "ACTIVA",
  ]);

  return {
    token: token,
    username: user.username,
    nombre: user.nombre,
    owner_key: user.owner_key,
    expires_at: Utilities.formatDate(expiresAt, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss"),
  };
}

function logout(token) {
  const sessionSheet = ensureSheet("SESIONES", SHEETS.SESIONES);
  const rows = getDataRows(sessionSheet, SHEETS.SESIONES.length);

  rows.forEach(function (row, index) {
    if (row[0] === token && row[4] === "ACTIVA") {
      sessionSheet.getRange(index + 2, 5).setValue("CERRADA");
    }
  });
}

function getBootstrapData(session) {
  setupInfrastructure();

  return {
    user: buildSessionPayload(session),
    owners: getConfigValuesByGroup("owners"),
    scopes: getConfigValuesByGroup("scopes"),
    cuentas: getConfigValuesByGroup("cuentas"),
    metodosPago: getConfigValuesByGroup("metodos_pago"),
    categorias: getActiveCategories(),
  };
}

function listMovements(session) {
  const rows = getSheetObjects("MOVIMIENTOS");

  return rows.filter(function (movement) {
    return canViewRecord(session, movement.owner, movement.scope);
  });
}

function listGoals(session) {
  const rows = getSheetObjects("AHORROS_METAS");

  return rows.filter(function (goal) {
    return canViewRecord(session, goal.owner, goal.scope);
  });
}

function appendMovement(movement) {
  const sheet = ensureSheet("MOVIMIENTOS", SHEETS.MOVIMIENTOS);

  sheet.appendRow([
    movement.fecha,
    movement.tipo,
    movement.owner,
    movement.scope,
    movement.cuenta,
    movement.categoria,
    movement.subcategoria,
    Number(movement.monto),
    movement.metodo_pago,
    movement.descripcion,
    movement.recurrente,
    movement.mes,
  ]);
}

function appendGoal(goal) {
  const sheet = ensureSheet("AHORROS_METAS", SHEETS.AHORROS_METAS);

  sheet.appendRow([
    goal.meta,
    goal.owner,
    goal.scope,
    Number(goal.objetivo_monto),
    goal.fecha_objetivo,
    Number(goal.saldo_actual),
    goal.estado,
  ]);
}

function normalizeMovementPayload(payload, session) {
  const scope = normalizeScope(payload.scope);
  const fecha = String(payload.fecha || "");

  return {
    fecha: fecha,
    tipo: String(payload.tipo || "GASTO").toUpperCase(),
    owner: session.owner_key,
    scope: scope,
    cuenta: String(payload.cuenta || ""),
    categoria: String(payload.categoria || ""),
    subcategoria: String(payload.subcategoria || ""),
    monto: Number(payload.monto),
    metodo_pago: String(payload.metodo_pago || ""),
    descripcion: String(payload.descripcion || ""),
    recurrente: String(payload.recurrente || "NO").toUpperCase(),
    mes: String(payload.mes || fecha.slice(0, 7)),
  };
}

function normalizeGoalPayload(payload, session) {
  return {
    meta: String(payload.meta || "").trim(),
    owner: session.owner_key,
    scope: normalizeScope(payload.scope),
    objetivo_monto: Number(payload.objetivo_monto),
    fecha_objetivo: String(payload.fecha_objetivo || ""),
    saldo_actual: Number(payload.saldo_actual || 0),
    estado: String(payload.estado || "ACTIVA").toUpperCase(),
  };
}

function validateMovement(movement) {
  if (!movement.fecha) {
    throw new Error("La fecha es obligatoria.");
  }

  if (!["GASTO", "INGRESO", "TRANSFERENCIA"].includes(movement.tipo)) {
    throw new Error("El tipo debe ser GASTO, INGRESO o TRANSFERENCIA.");
  }

  if (!["PRIVADO", "COMPARTIDO"].includes(movement.scope)) {
    throw new Error("El alcance debe ser PRIVADO o COMPARTIDO.");
  }

  if (!movement.cuenta) {
    throw new Error("La cuenta es obligatoria.");
  }

  if (!movement.categoria) {
    throw new Error("La categoria es obligatoria.");
  }

  if (Number(movement.monto) <= 0) {
    throw new Error("El monto debe ser mayor que cero.");
  }

  if (!movement.metodo_pago) {
    throw new Error("El metodo de pago es obligatorio.");
  }
}

function validateGoal(goal) {
  if (!goal.meta) {
    throw new Error("La meta es obligatoria.");
  }

  if (!["PRIVADO", "COMPARTIDO"].includes(goal.scope)) {
    throw new Error("El alcance debe ser PRIVADO o COMPARTIDO.");
  }

  if (Number(goal.objetivo_monto) <= 0) {
    throw new Error("El objetivo debe ser mayor que cero.");
  }

  if (!goal.fecha_objetivo) {
    throw new Error("La fecha objetivo es obligatoria.");
  }
}

function requireSession(token) {
  setupInfrastructure();

  const safeToken = String(token || "").trim();

  if (!safeToken) {
    throw new Error("Sesion no valida.");
  }

  const session = findActiveSession(safeToken);

  if (!session) {
    throw new Error("Sesion no valida o vencida.");
  }

  return session;
}

function findActiveSession(token) {
  const sessionRows = getSheetObjects("SESIONES");
  let matchedSession = null;

  sessionRows.forEach(function (session) {
    if (session.token !== token) {
      return;
    }

    if (session.estado !== "ACTIVA") {
      return;
    }

    const expiresAt = new Date(session.expires_at);

    if (isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      invalidateSession(token);
      return;
    }

    const user = findUserByUsername(session.username);

    if (!user || user.estado !== "ACTIVO") {
      invalidateSession(token);
      return;
    }

    matchedSession = {
      token: session.token,
      username: session.username,
      nombre: user.nombre,
      owner_key: session.owner_key,
      expires_at: session.expires_at,
    };
  });

  return matchedSession;
}

function invalidateSession(token) {
  const sheet = ensureSheet("SESIONES", SHEETS.SESIONES);
  const rows = getDataRows(sheet, SHEETS.SESIONES.length);

  rows.forEach(function (row, index) {
    if (row[0] === token) {
      sheet.getRange(index + 2, 5).setValue("VENCIDA");
    }
  });
}

function findUserByUsername(username) {
  const users = getSheetObjects("USUARIOS");
  let foundUser = null;

  users.forEach(function (user) {
    if (String(user.username || "").toLowerCase() === username) {
      foundUser = user;
    }
  });

  return foundUser;
}

function canViewRecord(session, owner, scope) {
  return scope === "COMPARTIDO" || owner === session.owner_key;
}

function normalizeScope(scope) {
  return String(scope || "PRIVADO").toUpperCase() === "COMPARTIDO" ? "COMPARTIDO" : "PRIVADO";
}

function buildSessionPayload(session) {
  return {
    username: session.username,
    nombre: session.nombre,
    ownerKey: session.owner_key,
    expiresAt: session.expires_at,
  };
}

function getTokenFromGet(e) {
  return e && e.parameter ? e.parameter.token : "";
}

function ensureSheet(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const headersMissing = headers.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

  if (headersMissing) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function writeRowsIfEmpty(sheet, rows) {
  if (sheet.getLastRow() > 1 || !rows.length) {
    return;
  }

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

function getConfigValuesByGroup(group) {
  const rows = getSheetObjects("CONFIG");

  return rows
    .filter(function (row) {
      return row.grupo === group;
    })
    .map(function (row) {
      return row.valor;
    });
}

function getActiveCategories() {
  const rows = getSheetObjects("CATEGORIAS");

  return rows.filter(function (row) {
    return row.activa === "SI";
  });
}

function getSheetObjects(sheetName) {
  const headers = SHEETS[sheetName];
  const sheet = ensureSheet(sheetName, headers);
  const rows = getDataRows(sheet, headers.length);

  return rows.map(function (row) {
    return mapRowToObject(headers, row);
  });
}

function getDataRows(sheet, columnCount) {
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return [];
  }

  return sheet.getRange(2, 1, lastRow - 1, columnCount).getValues()
    .filter(function (row) {
      return row.some(function (cell) {
        return cell !== "";
      });
    });
}

function mapRowToObject(headers, row) {
  const result = {};

  headers.forEach(function (header, index) {
    result[header] = formatValue(row[index]);
  });

  return result;
}

function formatValue(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }

  return value;
}

function hashPassword(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(function (byte) {
    const normalized = byte < 0 ? byte + 256 : byte;
    return ("0" + normalized.toString(16)).slice(-2);
  }).join("");
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
