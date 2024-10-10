"use strict";

const router = require("express").Router();
const controller = require("./user.controller");
const auth = require('../../auth/auth.service')



/////////////////////   USER    ///////////////////////////

router.post("/signin", controller.signIn);

router.post("/signup", controller.signUp);

router.put("/update-chips-limits", auth.isAuthenticated(), controller.updateChipsLimits);

router.get("/chips-balance", auth.isAuthenticated(), controller.getChipsBalance);

router.get("/get-user-name", auth.isAuthenticated(), controller.getUserName);

router.post("/forgotPassword", controller.forgotPassword);

router.post("/enterPasscode", controller.enterPasscode);

router.post("/setNewPassword", controller.setNewPassword)


module.exports = router;
