const BASE_URL = "https://lapticon-backend.onrender.com";
const FIREBASE_API_KEY = "AIzaSyAuh64b_I2OtC7KYuubCVx9plEe2pojp2M";

let idToken = null;
let uid = null;

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const status = document.getElementById("login-status");

  status.textContent = "Ingresando...";

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();

  if (!res.ok) {
    status.textContent = "Error: " + data.error.message;
    return;
  }

  idToken = data.idToken;
  uid = data.localId;

  document.getElementById("login-section").hidden = true;
  document.getElementById("app-section").hidden = false;
  document.getElementById("welcome-message").textContent = "Bienvenido/a, " + data.email;

  cargarCiudades();
  cargarEncomiendas();
});

async function cargarCiudades() {
  const paisesRes = await fetch(`${BASE_URL}/api/ciudades/paises`);
  const ciudadesRes = await fetch(`${BASE_URL}/api/ciudades/ciudades`);

  const paises = await paisesRes.json();
  const ciudades = await ciudadesRes.json();

  const lista = Array.isArray(ciudades) ? ciudades : ciudades.ciudades || [];

  const origen = document.getElementById("origen-select");
  const destino = document.getElementById("destino-select");
  origen.innerHTML = "";
  destino.innerHTML = "";

  lista.forEach((ciudad) => {
    const nombre = ciudad.nombre || ciudad;
    origen.innerHTML += `<option value="${nombre}">${nombre}</option>`;
    destino.innerHTML += `<option value="${nombre}">${nombre}</option>`;
  });
}

document.getElementById("encomienda-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("encomienda-status");

  const body = {
    ciudadOrigen: document.getElementById("origen-select").value,
    ciudadDestino: document.getElementById("destino-select").value,
    valor: Number(document.getElementById("valor-input").value),
    moneda: document.getElementById("moneda-select").value,
    observaciones: document.getElementById("observaciones-input").value,
  };

  if (!body.ciudadOrigen || !body.ciudadDestino || !body.valor || !body.moneda || !body.observaciones) {
    status.textContent = "Completa todos los campos.";
    return;
  }

  status.textContent = "Creando...";

  const res = await fetch(`${BASE_URL}/api/encomiendas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  if (!res.ok) {
    status.textContent = "Error: " + (data.error || "no se pudo crear");
    return;
  }

  status.textContent = "Encomienda creada correctamente.";
  cargarEncomiendas();
});

async function cargarEncomiendas() {
  const tbody = document.getElementById("encomiendas-body");
  tbody.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";

  const res = await fetch(`${BASE_URL}/api/encomiendas`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await res.json();

  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan='5'>Error: ${data.error}</td></tr>`;
    return;
  }

  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No tienes encomiendas.</td></tr>";
    return;
  }

  data.forEach((encomienda) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${encomienda.ciudadOrigen}</td>
      <td>${encomienda.ciudadDestino}</td>
      <td class="estado">${encomienda.estado}</td>
      <td>${encomienda.valor} ${encomienda.moneda}</td>
      <td><button onclick="cancelarEncomienda('${encomienda._id}', this)">Cancelar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

async function cancelarEncomienda(encomiendaId, boton) {
  const res = await fetch(`${BASE_URL}/api/encomiendas/${encomiendaId}/estado`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ estado: "cancelada" }),
  });
  const data = await res.json();

  if (!res.ok) {
    alert("Error: " + (data.error || "no se pudo cancelar"));
    return;
  }

  const fila = boton.closest("tr");
  fila.querySelector(".estado").textContent = "cancelada";
  boton.disabled = true;
}