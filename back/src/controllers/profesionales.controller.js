const { getPool } = require("../config/db");


const listarProfesionales = async (_req, res, next) => {
  try {
    const pool = await getPool();
    const resultado = await pool.request().execute("usp_ListarProfesionales");
    res.status(200).json(resultado.recordset);
  } catch (error) {
    next(error);
  }
};

module.exports = { listarProfesionales };
