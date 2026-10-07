const { getPool } = require("../config/db");

// GET /api/reportes/recaudacion -> usp_RecaudacionPorProfesional
const recaudacionPorProfesional = async (_req, res, next) => {
  try {
    const pool = await getPool();
    const resultado = await pool.request().execute("usp_RecaudacionPorProfesional");
    res.status(200).json(resultado.recordset);
  } catch (error) {
    next(error);
  }
};

module.exports = { recaudacionPorProfesional };
