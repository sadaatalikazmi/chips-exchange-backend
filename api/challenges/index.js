"use strict";

const router = require("express").Router();
const controller = require("./challenge.controller");
const auth = require('../../auth/auth.service')



router.post("/", auth.isAuthenticated(), controller.createChallenge);

router.put("/handle", auth.isAuthenticated(), controller.handleChallenge);

router.get("/challenges", auth.isAuthenticated(), controller.challenges);

router.put("/winner", auth.isAuthenticated(), controller.handleChallengeWinner);



module.exports = router;
