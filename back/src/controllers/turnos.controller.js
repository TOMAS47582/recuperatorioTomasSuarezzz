const { sql, getPool } = require("../config/db");


const obtenerNumeroError = (error) =>
  error.number ?? error.originalError?.info?.number ?? error.precedingErrors?.[0]?.number;

const responderError = (error, res, next) => {
  const numero = obtenerNumeroError(error);

  if (numero === 50002) {
    return res.status(404).json({ mensaje: error.message });
  }
  if (typeof numero === "number" && numero >= 50000) {
    return res.status(400).json({ mensaje: error.message });
  }
  return next(error);
};

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const fechaValida = (texto) => {
  if (typeof texto !== "string" || !FECHA_REGEX.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
};

// GET /api/turnos -> usp_ListarTurnos
const listarTurnos = async (_req, res, next) => {
  try {
    const pool = await getPool();
    const resultado = await pool.request().execute("usp_ListarTurnos");
    res.status(200).json(resultado.recordset);
  } catch (error) {
    next(error);
  }
};

// POST /api/turnos -> usp_CrearTurno
const crearTurno = async (req, res, next) => {
  try {
    const { idProfesional, cliente, fecha, hora } = req.body ?? {};

    const idNumero = Number(idProfesional);
    if (idProfesional === "" || idProfesional === null || idProfesional === undefined ||
        !Number.isInteger(idNumero)) {
      return res.status(400).json({ mensaje: "Debe seleccionar un profesional válido." });
    }
    if (!fechaValida(fecha)) {
      return res.status(400).json({ mensaje: "La fecha es obligatoria y debe tener formato AAAA-MM-DD." });
    }
    if (typeof hora !== "string" || !HORA_REGEX.test(hora)) {
      return res.status(400).json({ mensaje: "La hora es obligatoria y debe tener formato HH:mm." });
    }

    // El cliente vacío o con solo espacios lo valida el procedimiento (THROW 50003).
    const pool = await getPool();
    const resultado = await pool
      .request()
      .input("IdProfesional", sql.Int, idNumero)
      .input("Cliente", sql.NVarChar(100), typeof cliente === "string" ? cliente : "")
      .input("Fecha", sql.VarChar(10), fecha)
      .input("Hora", sql.NVarChar(5), hora)
      .execute("usp_CrearTurno");

    const idTurno = resultado.recordset[0].IdTurno;
    res.status(201).json({ mensaje: "Turno registrado correctamente.", idTurno });
  } catch (error) {
    responderError(error, res, next);
  }
};

// PUT /api/turnos/:id/pago -> usp_RegistrarPago
const registrarPago = async (req, res, next) => {
  try {
    const idTurno = Number(req.params.id);
    if (!Number.isInteger(idTurno) || idTurno <= 0) {
      return res.status(400).json({ mensaje: "El id del turno debe ser un número entero positivo." });
    }

    const pool = await getPool();
    await pool
      .request()
      .input("IdTurno", sql.Int, idTurno)
      .execute("usp_RegistrarPago");

    res.status(200).json({ mensaje: "Pago registrado correctamente." });
  } catch (error) {
    responderError(error, res, next);
  }
};

module.exports = { listarTurnos, crearTurno, registrarPago };
