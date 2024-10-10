'use strict';

const router = require('express').Router();
const controller = require('./transaction.controller');
const auth = require('../../auth/auth.service')


router.post('/purchaseChips', auth.isAuthenticated(), controller.purchaseChips);
router.post('/refundChips', auth.isAuthenticated(), controller.refundChips);

router.get('/getUserCards', auth.isAuthenticated(), controller.getUserCards);
router.get('/getAllTransaction', auth.isAuthenticated(), controller.getAllTransaction);



module.exports = router;