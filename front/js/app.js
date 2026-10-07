const API_URL = "http://localhost:3000/api";

const formulario = document.querySelector("#form-turno");
const comboProfesionales = document.querySelector("#profesional");
const listaTurnos = document.querySelector("#lista-turnos");
const tablaRecaudacion = document.querySelector("#tabla-recaudacion");
const mensaje = document.querySelector("#mensaje");

const formatearPrecio = (valor) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
  }).format(valor);

// "2026-10-07T00:00:00.000Z" -> "07/10/2026" (sin pasar por Date para evitar corrimientos de zona horaria)
const formatearFecha = (valor) => {
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
};

const mostrarMensaje = (texto, tipo) => {
  mensaje.textContent = texto;
  mensaje.className = tipo;
};

// Pide a la API y devuelve el JSON. Si la respuesta no es exitosa, lanza un Error
// con el mensaje que mandó el servidor (por ejemplo "El horario ya está ocupado.").
const pedirApi = async (ruta, opciones) => {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verificá que la API esté encendida.");
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    datos = null;
  }

  if (!respuesta.ok) {
    throw new Error(datos?.mensaje || "Ocurrió un error inesperado.");
  }
  return datos;
};

const crearCelda = (texto) => {
  const celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
};

// ---- Profesionales: combo poblado desde la API (nombre + precio) ----
const cargarProfesionales = async () => {
  const profesionales = await pedirApi("/profesionales");

  comboProfesionales.length = 1; // conserva la opción "Seleccione un profesional"
  profesionales.forEach((profesional) => {
    const opcion = document.createElement("option");
    opcion.value = profesional.IdProfesional;
    opcion.textContent = `${profesional.Nombre} - ${formatearPrecio(profesional.PrecioPorTurno)}`;
    comboProfesionales.appendChild(opcion);
  });
};

// ---- Turnos: tabla con estado Pagado/Pendiente y botón solo en los pendientes ----
const cargarTurnos = async () => {
  const turnos = await pedirApi("/turnos");

  listaTurnos.replaceChildren();
  if (turnos.length === 0) {
    const fila = document.createElement("tr");
    const celda = crearCelda("Todavía no hay turnos cargados.");
    celda.colSpan = 6;
    fila.appendChild(celda);
    listaTurnos.appendChild(fila);
    return;
  }

  turnos.forEach((turno) => {
    const fila = document.createElement("tr");
    fila.append(
      crearCelda(turno.Cliente),
      crearCelda(turno.Profesional),
      crearCelda(formatearFecha(turno.Fecha)),
      crearCelda(turno.Hora),
      crearCelda(turno.Pagado ? "Pagado" : "Pendiente")
    );

    const celdaAccion = document.createElement("td");
    if (!turno.Pagado) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = "Registrar pago";
      boton.dataset.id = turno.IdTurno;
      celdaAccion.appendChild(boton);
    }
    fila.appendChild(celdaAccion);

    listaTurnos.appendChild(fila);
  });
};

// ---- Recaudación por profesional ----
const cargarRecaudacion = async () => {
  const filas = await pedirApi("/reportes/recaudacion");

  tablaRecaudacion.replaceChildren();
  filas.forEach((datos) => {
    const fila = document.createElement("tr");
    fila.append(
      crearCelda(datos.Profesional),
      crearCelda(datos.CantidadTurnos),
      crearCelda(formatearPrecio(datos.TotalCobrado)),
      crearCelda(formatearPrecio(datos.TotalPendiente))
    );
    tablaRecaudacion.appendChild(fila);
  });
};

// Actualiza ambas tablas después de crear un turno o registrar un pago.
const actualizarTablas = async () => {
  await Promise.all([cargarTurnos(), cargarRecaudacion()]);
};

// ---- Registrar un turno ----
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const datos = {
    cliente: formulario.cliente.value,
    idProfesional: formulario.idProfesional.value,
    fecha: formulario.fecha.value,
    hora: formulario.hora.value
  };

  try {
    const resultado = await pedirApi("/turnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    mostrarMensaje(`${resultado.mensaje} (turno n.º ${resultado.idTurno})`, "ok");
    formulario.reset();
    await actualizarTablas();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
});

// ---- Registrar pagos (delegación de eventos sobre el cuerpo de la tabla) ----
listaTurnos.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button[data-id]");
  if (!boton) return;

  boton.disabled = true;
  try {
    const resultado = await pedirApi(`/turnos/${boton.dataset.id}/pago`, { method: "PUT" });
    mostrarMensaje(resultado.mensaje, "ok");
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
  await actualizarTablas().catch((error) => mostrarMensaje(error.message, "error"));
});

// ---- Carga inicial ----
(async () => {
  try {
    await Promise.all([cargarProfesionales(), cargarTurnos(), cargarRecaudacion()]);
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
})();
