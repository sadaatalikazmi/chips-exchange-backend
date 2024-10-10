"use strict";
const { errReturned } = require("../../config/dto");
const sqlConnection = require("../../config/sqlConnection");


/********************** ACCEPT CHALLENGE ***********************/

exports.handleAcceptedStatus = async (user_details, challenge_details) => {
    try {
        if (user_details['chips'] < challenge_details['challenged_amount']) return "Not enough chips"
        let updatedChips = user_details['chips'] - challenge_details['challenged_amount'];

        // Add challenged_amount to the user's pool
        let updatedPool = challenge_details['pool'] + challenge_details['challenged_amount'];

        await Promise.all([
            sqlConnection.query(`UPDATE users SET chips = ${updatedChips} WHERE id = ${user_details['id']}`),
            sqlConnection.query(`UPDATE challenges SET pool = ${updatedPool} WHERE id = ${challenge_details['id']}`),
        ]);
        return null;
    } catch (error) { return "Failed to Update" }
}

/********************** REJECT CHALLENGE ***********************/

exports.handleRejectedStatus = async (challenger_user_details, challenge_details) => {
    try {
        let updatedChips = challenger_user_details['chips'] + challenge_details['challenged_amount'];

        // Deduct challenged_amount from the pool and close the pool
        let updatedPool = challenge_details['pool'] - challenge_details['challenged_amount'];

        await Promise.all([
            sqlConnection.query(`UPDATE challenges SET pool = ?, pool_status = 'close' WHERE id = ?`, [updatedPool, challenge_details['id']]),
            sqlConnection.query(`UPDATE users SET chips = ? WHERE id = ?`, [updatedChips, challenge_details['challenger_userId']])
        ]);

        return null;
    } catch (error) { return "Failed to Update" }
}

/********************** COUNTER CHALLENGE ***********************/

exports.handleCounterStatus = async (user_details, challenger_user_details, challenge_details, counter_challenge_amount) => {
    try {
        if (!counter_challenge_amount) return "Please provide counter_challenge_amount"
        if (counter_challenge_amount <= challenge_details['challenged_amount']) return `Counter amount must be greater than ${challenge_details['challenged_amount']}`

        // Check if counter_challenge_amount is within the user's chip limits
        if (
            counter_challenge_amount < user_details['minChipsLimit'] ||
            counter_challenge_amount > user_details['maxChipsLimit']
        ) return "Counter challenge amount is outside your chip limits";

        // Check if counter_challenge_amount is within the challenger user's chip limits
        if (
            counter_challenge_amount < challenger_user_details['minChipsLimit'] ||
            counter_challenge_amount > challenger_user_details['maxChipsLimit']
        ) return "Counter challenge amount is outside challenger user's chip limits";

        //previous challenge
        let updatedChips = challenger_user_details['chips'] + challenge_details['challenged_amount'];
        let newChallengeChips = user_details['chips'] - counter_challenge_amount;
        await Promise.all([
            sqlConnection.query(`UPDATE users SET chips = ${updatedChips} where id = ${challenge_details['challenger_userId']}`),
            sqlConnection.query(`UPDATE users SET chips = ${newChallengeChips} where id = ${user_details['id']}`),
            sqlConnection.query(`UPDATE challenges SET challenger_userId = ?, challenged_userId = ?, challenged_amount = ?, pool = ? WHERE id = ?`,
                [user_details['id'], challenge_details['challenger_userId'], counter_challenge_amount, counter_challenge_amount, challenge_details['id']]),
        ])
        return null;
    } catch (error) { return "Failed to Update" }
}