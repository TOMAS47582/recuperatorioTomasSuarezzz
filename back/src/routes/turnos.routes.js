const { Router } = require("express");
const router = Router();

const {
  listarTurnos,
  crearTurno,
  registrarPago
} = require("../controllers/turnos.controller");

router.get("/", listarTurnos);
router.post("/", crearTurno);
router.put("/:id/pago", registrarPago);

module.exports = router;
