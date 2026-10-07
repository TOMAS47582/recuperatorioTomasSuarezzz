require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");

const profesionalesRoutes = require("./routes/profesionales.routes");
const turnosRoutes = require("./routes/turnos.routes");
const reportesRoutes = require("./routes/reportes.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/profesionales", profesionalesRoutes);
app.use("/api/turnos", turnosRoutes);
app.use("/api/reportes", reportesRoutes);

app.get("/", (_req, res) => {
  res.json({ mensaje: "API de turnos de peluquería" });
});

app.use((error, _req, res, _next) => {
  // JSON mal formado en el cuerpo del pedido: error del cliente, no del servidor.
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ mensaje: "El cuerpo del pedido no es un JSON válido." });
  }
  console.error(error);
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
