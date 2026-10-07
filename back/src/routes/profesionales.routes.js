const { Router } = require("express");
const router = Router();

const { listarProfesionales } = require("../controllers/profesionales.controller");

router.get("/", listarProfesionales);

module.exports = router;
