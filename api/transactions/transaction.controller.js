
"use strict";

const stripe = require('stripe')(process?.env?.STRIPE_KEY);

const { selectQuery, insertQuery } = require('../../utils/helper')
const sqlConnection = require("../../config/sqlConnection");
const { sendResponse, errReturned } = require("../../config/dto");
const { SUCCESS, BADREQUEST, NOTFOUND } = require("../../config/ResponseCodes");


// Purchase Chips //
exports.purchaseChips = async (req, res) => {
    try {
        let userId = req.user.id;
        let { paymentMethodId, amount, cardType } = req.body;
        let required = ['paymentMethodId', 'amount', 'cardType'];
        for (const field of required) {
            if (!req.body[field]) return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);
        }

        let [userResult] = await sqlConnection.query(selectQuery('*', 'users', 'id'), [userId]);

        if (!userResult || userResult.length === 0) return sendResponse(res, NOTFOUND, 'User not found');

        let user = userResult[0];
        let processingFee = amount * 0.05;

        if (cardType === 'new') {
            await stripe.paymentMethods.attach(paymentMethodId, { customer: user.customerId });

            let insertCardQuery = insertQuery('cards', ['userId', 'paymentMethodId']);
            let insertCardValues = [userId, paymentMethodId];
            await sqlConnection.query(insertCardQuery, insertCardValues);
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.floor(amount * 100),
            currency: 'usd',
            payment_method: paymentMethodId,
            customer: user.customerId,
            confirmation_method: 'manual',
            confirm: true,
            return_url: 'http://localhost:3000/#/home',
        });

        amount = paymentIntent['amount'] / 100;

        let bodegaAccount = process.env.STRIPE_OWNER_ACCOUNT;

        await stripe.transfers.create({
            amount: Math.floor(processingFee * 100),
            currency: 'usd',
            destination: bodegaAccount,
            description: 'Processing fee for chip purchase',
        });

        const usdToChipsRate = 8521 / 4.50;
        const chips = Math.round(amount * usdToChipsRate);

        const updateUserChipsQuery = `UPDATE users SET chips = chips + ? WHERE id = ?`;
        await sqlConnection.execute(updateUserChipsQuery, [chips, user['id']]);

        let transactionQuery = insertQuery("transactions", ["transactionId", "amount", "currency", "description", "payment_method", "status", "payment_type", "chips_exchange", "user_id"]);
        let values = [paymentIntent['id'], amount, paymentIntent['currency'], paymentIntent['description:'], paymentIntent['payment_method'], paymentIntent['status'], "MAIN TRANSFER", chips, user['id']];
        await sqlConnection.query(transactionQuery, values);

        return sendResponse(res, SUCCESS, 'Chips purchased successfully', paymentIntent);
    } catch (error) { errReturned(res, error) }
};


// Refund Chips //
exports.refundChips = async (req, res) => {
    try {
        let userId = req.user.id;
        let { paymentMethodId, cardType, refundType } = req.body;
        let required = ['paymentMethodId', 'cardType', 'refundType'];
        for (const field of required) {
            if (!req.body[field]) return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);
        }

        let [userResult] = await sqlConnection.query(selectQuery('*', 'users', 'id'), [userId]);
        if (!userResult || userResult.length === 0) return sendResponse(res, NOTFOUND, 'User not found');

        let user = userResult[0];
        let chipsAmount = Math.floor((user.chips * 4.5) / 8521);

        if (user.chips < 950) return sendResponse(res, BADREQUEST, `User doesn't have enough chips to refund`, []);

        let refundAmount, updatedChips, refund, status;

        if (refundType == 'full') {
            refundAmount = Math.floor(chipsAmount * 0.7 * 100);
            updatedChips = Math.floor(user.chips);
        } else if (refundType == 'partial') {
            refundAmount = Math.floor(chipsAmount * 0.4 * 100);
            updatedChips = Math.floor(user.chips / 2);
        } else return sendResponse(res, BADREQUEST, 'Invalid refund percentage');

        if (cardType === 'new') {
            await stripe.paymentMethods.attach(paymentMethodId, { customer: user.customerId });

            let insertCardQuery = insertQuery('cards', ['userId', 'paymentMethodId']);
            let insertCardValues = [userId, paymentMethodId];
            await sqlConnection.query(insertCardQuery, insertCardValues);
        }

        const paymentIntent = await stripe.paymentIntents.create({
            payment_method: paymentMethodId,
            customer: user.customerId,
            amount: refundAmount, // Amount in cents
            currency: 'usd',
            confirmation_method: 'manual',
            confirm: true,
            return_url: 'https://www.google.com',
        });

        refund = await stripe.refunds.create({ payment_intent: paymentIntent.id });
        status = 'REFUND';

        let inserTransactionQuery = insertQuery("transactions", ["transactionId", "amount", "currency", "description", "payment_method", "status", "payment_type", "chips_exchange", "user_id"]);
        let inserTransactionValues = [refund.id, refund.amount, refund.currency, refund.reason, refund.payment_intent, refund.status, status, updatedChips, userId];
        await sqlConnection.query(inserTransactionQuery, inserTransactionValues);

        const updateUserChipsQuery = `UPDATE users SET chips = chips - ? WHERE id = ?`;
        await sqlConnection.execute(updateUserChipsQuery, [updatedChips, userId]);

        return sendResponse(res, SUCCESS, "Refund initiated successfully, it will take 5-10 business days", refund);
    } catch (error) { errReturned(res, error) }
};


// Get User Cards //
exports.getUserCards = async (req, res) => {
    try {
        let userId = req.user.id;

        let [userResult] = await sqlConnection.query(selectQuery('*', 'users', 'id'), [userId]);
        if (!userResult || userResult.length === 0) return sendResponse(res, NOTFOUND, 'User not found');

        let user = userResult[0];

        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.customerId,
            type: 'card',
        });

        const userCards = paymentMethods.data.map(paymentMethod => {
            let card = {
                paymentMethodId: paymentMethod?.id,
                brand: paymentMethod?.card?.brand,
                last4Digits: paymentMethod?.card?.last4,
                expiryMonth: paymentMethod?.card?.exp_month,
                expiryYear: paymentMethod?.card?.exp_year,
                zipCode: paymentMethod?.billing_details?.address?.postal_code,
            };

            return card;
        });

        return sendResponse(res, SUCCESS, 'User cards', userCards);
    } catch (error) { errReturned(res, error) }
};


// Get All Transactions //
exports.getAllTransaction = async (req, res) => {
    try {
        let { user } = req;
        if (!user) return sendResponse(res, NOTFOUND, "User not found");

        let [user_details] = await sqlConnection.query(`SELECT * FROM users WHERE id = ?`, [user['id']])
        if (user_details.length === 0) return sendResponse(res, NOTFOUND, "User not found");

        let [transactions] = await sqlConnection.query(`SELECT * FROM transactions WHERE user_id = ?`, [user['id']])
        if (transactions.length === 0) return sendResponse(res, NOTFOUND, "Transactions not found");

        return sendResponse(res, SUCCESS, "Transactions found", transactions)
    } catch (error) { errReturned(res, error) }
};