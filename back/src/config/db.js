const sql = require("mssql");

// DB_SERVER puede ser un servidor común ("localhost") o una instancia con nombre
// ("localhost\SQLEXPRESS"). Con instancia nombrada no se envía el puerto: el driver
// lo averigua solo a través del servicio SQL Server Browser.
const [servidor, instancia] = (process.env.DB_SERVER || "localhost").split("\\");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: servidor,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

if (instancia) {
  config.options.instanceName = instancia;
} else {
  config.port = Number(process.env.DB_PORT || 1433);
}

// Un único pool de conexiones compartido por toda la aplicación.
// Se crea la primera vez que se necesita; si falla, se reintenta en el próximo pedido.
let poolPromise = null;

const getPool = () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }
  return poolPromise;
};

module.exports = { sql, config, getPool };
