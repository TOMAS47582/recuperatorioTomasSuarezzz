const { Router } = require("express");
const router = Router();

const { recaudacionPorProfesional } = require("../controllers/reportes.controller");

router.get("/recaudacion", recaudacionPorProfesional);

module.exports = router;
