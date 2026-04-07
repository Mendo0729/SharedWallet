const STORAGE_KEYS = {
  apiUrl: "mis_finanzas_api_url",
  sessionToken: "mis_finanzas_session_token",
};

const state = {
  apiUrl: "",
  sessionToken: "",
  sessionUser: null,
  categories: [],
  cuentas: [],
  metodosPago: [],
  movements: [],
  goals: [],
  filters: {
    mes: "",
    scope: "",
    categoria: "",
  },
};

const currencyFormatter = new Intl.NumberFormat("es-PA", {
  style: "currency",
  currency: "USD",
});

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const authStatus = document.querySelector("#authStatus");
const movementForm = document.querySelector("#movementForm");
const filtersForm = document.querySelector("#filtersForm");
const savingGoalForm = document.querySelector("#savingGoalForm");
const logoutButton = document.querySelector("#logoutButton");
const movementsTable = document.querySelector("#movementsTable");
const movementRowTemplate = document.querySelector("#movementRowTemplate");
const goalCardTemplate = document.querySelector("#goalCardTemplate");
const savingsGoals = document.querySelector("#savingsGoals");
const heroBalance = document.querySelector("#heroBalance");
const heroStatus = document.querySelector("#heroStatus");
const sessionUserBadge = document.querySelector("#sessionUserBadge");
const loginApiUrlInput = document.querySelector("#apiUrl");
const movementCategorySelect = movementForm.categoria;
const movementCuentaSelect = movementForm.cuenta;
const movementMetodoPagoSelect = movementForm.metodo_pago;
const filterCategorySelect = filtersForm.categoria;

const summaryNodes = {
  incomeTotal: document.querySelector("#incomeTotal"),
  expenseTotal: document.querySelector("#expenseTotal"),
  balanceTotal: document.querySelector("#balanceTotal"),
  savingTotal: document.querySelector("#savingTotal"),
};

document.addEventListener("DOMContentLoaded", async () => {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  movementForm.fecha.value = today;
  filtersForm.mes.value = currentMonth;
  state.filters.mes = currentMonth;

  restoreConfiguration();
  bindEvents();

  if (state.apiUrl && state.sessionToken) {
    await restoreSession();
  } else {
    showAuthView();
  }
});

function restoreConfiguration() {
  const storedUrl = (localStorage.getItem(STORAGE_KEYS.apiUrl) || "").trim();
  const configUrl = (window.APP_CONFIG && window.APP_CONFIG.apiUrl ? String(window.APP_CONFIG.apiUrl) : "").trim();
  state.apiUrl = storedUrl || configUrl;
  state.sessionToken = (sessionStorage.getItem(STORAGE_KEYS.sessionToken) || "").trim();
  loginApiUrlInput.value = state.apiUrl;
}

function bindEvents() {
  loginForm.addEventListener("submit", handleLoginSubmit);
  movementForm.addEventListener("submit", handleMovementSubmit);
  filtersForm.addEventListener("input", handleFilterChange);
  savingGoalForm.addEventListener("submit", handleGoalSubmit);
  logoutButton.addEventListener("click", handleLogout);
  savingsGoals.addEventListener("click", handleGoalActionClick);
  savingsGoals.addEventListener("submit", handleGoalContributionSubmit);
}

async function restoreSession() {
  setAuthStatus("Restaurando sesion...");

  try {
    const payload = await fetchJson(buildUrl("getSession"), false);
    state.sessionUser = payload.data;
    showAppView();
    await syncAll();
  } catch (error) {
    console.error(error);
    clearSession();
    setAuthStatus("La sesion vencio o no es valida. Inicia sesion nuevamente.");
    showAuthView();
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const apiUrl = String(formData.get("apiUrl") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!apiUrl) {
    setAuthStatus("La URL del Web App es obligatoria.");
    return;
  }

  state.apiUrl = apiUrl;
  loginApiUrlInput.value = apiUrl;
  localStorage.setItem(STORAGE_KEYS.apiUrl, apiUrl);
  setAuthStatus("Iniciando sesion...");

  try {
    const payload = await postJson(apiUrl, {
      action: "login",
      payload: {
        username: username,
        password: password,
      },
    }, false);

    state.sessionToken = payload.data.token;
    state.sessionUser = payload.data.user;
    sessionStorage.setItem(STORAGE_KEYS.sessionToken, state.sessionToken);
    loginForm.reset();
  showAppView();
  await syncAll();
  } catch (error) {
    console.error(error);
    setAuthStatus(error.message || "No fue posible iniciar sesion.");
  }
}

async function handleMovementSubmit(event) {
  event.preventDefault();

  const formData = new FormData(movementForm);
  const movement = {
    fecha: formData.get("fecha"),
    tipo: formData.get("tipo"),
    scope: formData.get("scope"),
    cuenta: formData.get("cuenta"),
    categoria: formData.get("categoria"),
    subcategoria: "",
    monto: Number(formData.get("monto")),
    metodo_pago: formData.get("metodo_pago"),
    descripcion: String(formData.get("descripcion") || "").trim(),
    recurrente: formData.get("recurrente"),
    mes: String(formData.get("fecha") || "").slice(0, 7),
  };

  try {
    await postJson(state.apiUrl, {
      action: "addMovement",
      payload: movement,
    });
    resetMovementForm();
    updateConnectionMessage("Movimiento guardado correctamente.");
    await syncAll();
  } catch (error) {
    console.error(error);
    updateConnectionMessage(error.message || "No se pudo guardar el movimiento.");
  }
}

function handleFilterChange() {
  state.filters = {
    mes: filtersForm.mes.value,
    scope: filtersForm.scope.value,
    categoria: filtersForm.categoria.value,
  };
  render();
}

async function handleGoalSubmit(event) {
  event.preventDefault();

  const formData = new FormData(savingGoalForm);
  const goal = {
    meta: String(formData.get("meta") || "").trim(),
    scope: formData.get("scope"),
    objetivo_monto: Number(formData.get("objetivo_monto")),
    fecha_objetivo: formData.get("fecha_objetivo"),
    saldo_actual: 0,
    estado: "ACTIVA",
  };

  try {
    await postJson(state.apiUrl, {
      action: "addGoal",
      payload: goal,
    });
    savingGoalForm.reset();
    updateConnectionMessage("Meta de ahorro guardada correctamente.");
    await syncAll();
  } catch (error) {
    console.error(error);
    updateConnectionMessage(error.message || "No se pudo guardar la meta.");
  }
}

async function handleLogout() {
  try {
    if (state.apiUrl && state.sessionToken) {
      await postJson(state.apiUrl, {
        action: "logout",
      });
    }
  } catch (error) {
    console.error(error);
  } finally {
    clearSession();
    setAuthStatus("Sesion cerrada. Puedes volver a entrar.");
    showAuthView();
  }
}

async function syncAll() {
  if (!state.apiUrl || !state.sessionToken) {
    return;
  }

  updateConnectionMessage("Sincronizando informacion...");

  try {
    const [bootstrapPayload, movementsPayload, goalsPayload] = await Promise.all([
      fetchJson(buildUrl("bootstrap")),
      fetchJson(buildUrl("listMovements")),
      fetchJson(buildUrl("listGoals")),
    ]);

    state.sessionUser = bootstrapPayload.data.user;
    state.categories = bootstrapPayload.data.categorias || [];
    state.cuentas = bootstrapPayload.data.cuentas || [];
    state.metodosPago = bootstrapPayload.data.metodosPago || [];
    state.movements = (movementsPayload.data || []).map(normalizeMovement);
    state.goals = (goalsPayload.data || []).map(normalizeGoal);

    renderCatalogs();
    render();
    updateConnectionMessage("Datos sincronizados correctamente.");
  } catch (error) {
    console.error(error);
    updateConnectionMessage(error.message || "No se pudo sincronizar la informacion.");
  }
}

function render() {
  renderSessionHeader();
  renderSummary();
  renderMovements();
  renderGoals();
}

function renderSessionHeader() {
  const displayName = state.sessionUser ? state.sessionUser.nombre : "-";
  sessionUserBadge.textContent = displayName;
  heroStatus.textContent = state.sessionUser
    ? `${displayName} ve sus datos privados y todo lo compartido.`
    : "No hay una sesion activa.";
}

function renderSummary() {
  const totals = state.movements.reduce(
    (accumulator, movement) => {
      if (movement.tipo === "INGRESO") {
        accumulator.income += movement.monto;
      }

      if (movement.tipo === "GASTO") {
        accumulator.expense += movement.monto;
      }

      if (movement.tipo === "TRANSFERENCIA" || movement.categoria === "Ahorro") {
        accumulator.saving += movement.monto;
      }

      return accumulator;
    },
    { income: 0, expense: 0, saving: 0 }
  );

  const balance = totals.income - totals.expense;

  heroBalance.textContent = currencyFormatter.format(balance);
  summaryNodes.incomeTotal.textContent = currencyFormatter.format(totals.income);
  summaryNodes.expenseTotal.textContent = currencyFormatter.format(totals.expense);
  summaryNodes.balanceTotal.textContent = currencyFormatter.format(balance);
  summaryNodes.savingTotal.textContent = currencyFormatter.format(totals.saving);
}

function renderMovements() {
  const filteredMovements = getFilteredMovements();
  movementsTable.innerHTML = "";

  if (!filteredMovements.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="9">Todavia no hay movimientos visibles para estos filtros.</td>';
    movementsTable.appendChild(emptyRow);
    return;
  }

  filteredMovements
    .slice()
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .forEach((movement) => {
      const rowFragment = movementRowTemplate.content.cloneNode(true);
      const fields = rowFragment.querySelectorAll("[data-field]");

      fields.forEach((field) => {
        const fieldName = field.dataset.field;

        if (fieldName === "tipo") {
          const badge = document.createElement("span");
          badge.className = typeClass(movement.tipo);
          badge.textContent = movement.tipo;
          field.textContent = "";
          field.appendChild(badge);
          return;
        }

        if (fieldName === "scope") {
          const badge = document.createElement("span");
          badge.className = scopeClass(movement.scope);
          badge.textContent = movement.scope;
          field.textContent = "";
          field.appendChild(badge);
          return;
        }

        if (fieldName === "monto") {
          field.textContent = currencyFormatter.format(movement.monto);
          field.classList.add(typeAmountClass(movement.tipo));
          return;
        }

        field.textContent = movement[fieldName] || "-";
      });

      movementsTable.appendChild(rowFragment);
    });
}

function renderGoals() {
  savingsGoals.innerHTML = "";

  if (!state.goals.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "goal-empty";
    emptyState.textContent = "Todavia no tienes metas visibles para esta sesion.";
    savingsGoals.appendChild(emptyState);
    return;
  }

  state.goals.forEach((goal) => {
    const progress = Math.min((goal.saldo_actual / goal.objetivo_monto) * 100, 100);
    const goalFragment = goalCardTemplate.content.cloneNode(true);
    const goalCard = goalFragment.querySelector(".goal-card");

    goalCard.dataset.goalId = goal.id;

    goalFragment.querySelector('[data-field="scope"]').textContent = goal.scope;
    goalFragment.querySelector('[data-field="meta"]').textContent = goal.meta;
    goalFragment.querySelector('[data-field="owner"]').textContent = goal.owner;
    goalFragment.querySelector('[data-field="fecha_objetivo"]').textContent = goal.fecha_objetivo;
    goalFragment.querySelector('[data-field="saldo_actual"]').textContent = currencyFormatter.format(goal.saldo_actual);
    goalFragment.querySelector('[data-field="objetivo_monto"]').textContent = currencyFormatter.format(goal.objetivo_monto);
    goalFragment.querySelector('[data-field="progressFill"]').style.width = `${progress}%`;

    savingsGoals.appendChild(goalFragment);
  });
}

function handleGoalActionClick(event) {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const goalCard = button.closest(".goal-card");

  if (!goalCard) {
    return;
  }

  const goalId = goalCard.dataset.goalId;

  if (button.dataset.action === "toggle-contribution") {
    const contributionForm = goalCard.querySelector('[data-role="contribution-form"]');
    contributionForm.classList.toggle("is-hidden");
    if (!contributionForm.classList.contains("is-hidden")) {
      contributionForm.querySelector('input[name="amount"]').focus();
    }
    return;
  }

  if (button.dataset.action === "delete-goal") {
    handleGoalDelete(goalId);
  }
}

async function handleGoalContributionSubmit(event) {
  const form = event.target.closest('[data-role="contribution-form"]');

  if (!form) {
    return;
  }

  event.preventDefault();

  const goalCard = form.closest(".goal-card");
  const goalId = goalCard ? goalCard.dataset.goalId : "";
  const amount = Number(new FormData(form).get("amount"));

  try {
    await postJson(state.apiUrl, {
      action: "addGoalContribution",
      payload: {
        goalId: goalId,
        amount: amount,
      },
    });

    form.reset();
    form.classList.add("is-hidden");
    updateConnectionMessage("Aporte agregado correctamente.");
    await syncAll();
  } catch (error) {
    console.error(error);
    updateConnectionMessage(error.message || "No se pudo agregar el aporte.");
  }
}

async function handleGoalDelete(goalId) {
  if (!goalId) {
    updateConnectionMessage("No se encontro la meta seleccionada.");
    return;
  }

  const confirmed = window.confirm("¿Seguro que quieres eliminar esta meta de ahorro?");

  if (!confirmed) {
    return;
  }

  try {
    await postJson(state.apiUrl, {
      action: "deleteGoal",
      payload: {
        goalId: goalId,
      },
    });

    updateConnectionMessage("Meta eliminada correctamente.");
    await syncAll();
  } catch (error) {
    console.error(error);
    updateConnectionMessage(error.message || "No se pudo eliminar la meta.");
  }
}

function renderCatalogs() {
  replaceSelectOptions(movementCategorySelect, state.categories.map((item) => item.categoria));
  replaceSelectOptions(filterCategorySelect, state.categories.map((item) => item.categoria), true);
  replaceSelectOptions(movementCuentaSelect, state.cuentas);
  replaceSelectOptions(movementMetodoPagoSelect, state.metodosPago);
}

function replaceSelectOptions(selectNode, values, allowEmpty) {
  const currentValue = selectNode.value;
  selectNode.innerHTML = "";

  if (allowEmpty) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Todas";
    selectNode.appendChild(emptyOption);
  }

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectNode.appendChild(option);
  });

  if (values.includes(currentValue) || (allowEmpty && currentValue === "")) {
    selectNode.value = currentValue;
  }
}

function getFilteredMovements() {
  return state.movements.filter((movement) => {
    const monthMatch = !state.filters.mes || movement.mes === state.filters.mes;
    const scopeMatch = !state.filters.scope || movement.scope === state.filters.scope;
    const categoryMatch = !state.filters.categoria || movement.categoria === state.filters.categoria;
    return monthMatch && scopeMatch && categoryMatch;
  });
}

function normalizeMovement(movement) {
  return {
    fecha: movement.fecha,
    tipo: String(movement.tipo || "GASTO").toUpperCase(),
    owner: String(movement.owner || ""),
    scope: String(movement.scope || "PRIVADO").toUpperCase(),
    cuenta: String(movement.cuenta || ""),
    categoria: String(movement.categoria || ""),
    subcategoria: String(movement.subcategoria || ""),
    monto: Number(movement.monto) || 0,
    metodo_pago: String(movement.metodo_pago || ""),
    descripcion: String(movement.descripcion || ""),
    recurrente: String(movement.recurrente || "NO"),
    mes: String(movement.mes || String(movement.fecha || "").slice(0, 7)).slice(0, 7),
  };
}

function normalizeGoal(goal) {
  return {
    id: String(goal.id || ""),
    meta: String(goal.meta || ""),
    owner: String(goal.owner || ""),
    scope: String(goal.scope || "PRIVADO").toUpperCase(),
    objetivo_monto: Number(goal.objetivo_monto) || 0,
    fecha_objetivo: String(goal.fecha_objetivo || ""),
    saldo_actual: Number(goal.saldo_actual) || 0,
    estado: String(goal.estado || "ACTIVA"),
  };
}

function typeClass(type) {
  if (type === "INGRESO") {
    return "chip-income";
  }

  if (type === "TRANSFERENCIA") {
    return "chip-transfer";
  }

  return "chip-expense";
}

function typeAmountClass(type) {
  if (type === "INGRESO") {
    return "amount-income";
  }

  if (type === "TRANSFERENCIA") {
    return "amount-transfer";
  }

  return "amount-expense";
}

function scopeClass(scope) {
  return scope === "COMPARTIDO" ? "chip-transfer" : "chip-private";
}

function showAuthView() {
  authView.classList.remove("is-hidden");
  appView.classList.add("is-hidden");
}

function showAppView() {
  authView.classList.add("is-hidden");
  appView.classList.remove("is-hidden");
}

function clearSession() {
  state.sessionToken = "";
  state.sessionUser = null;
  state.movements = [];
  state.goals = [];
  sessionStorage.removeItem(STORAGE_KEYS.sessionToken);
}

function resetMovementForm() {
  movementForm.reset();
  movementForm.fecha.value = new Date().toISOString().split("T")[0];
}

function setAuthStatus(message) {
  authStatus.textContent = message;
}

function updateConnectionMessage(message) {
  if (typeof connectionStatus !== "undefined" && connectionStatus) {
    connectionStatus.textContent = message;
  }
}

function buildUrl(action) {
  const url = new URL(state.apiUrl);
  url.searchParams.set("action", action);
  url.searchParams.set("token", state.sessionToken);
  return url.toString();
}

async function fetchJson(url, requireToken = true) {
  if (requireToken && !state.sessionToken) {
    throw new Error("No hay sesion activa.");
  }

  const response = await fetch(url);
  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "Respuesta invalida");
  }

  return payload;
}

async function postJson(url, data, includeToken = true) {
  const requestBody = includeToken ? { ...data, token: state.sessionToken } : data;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(requestBody),
  });

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || "No se pudo completar la solicitud.");
  }

  return payload;
}
