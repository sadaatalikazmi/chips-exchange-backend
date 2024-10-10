
"use strict";

const { insertQuery, getChallengeById } = require('../../utils/helper')
const sqlConnection = require("../../config/sqlConnection");
const { sendResponse, errReturned } = require("../../config/dto");
const { SUCCESS, BADREQUEST, NOTFOUND } = require("../../config/ResponseCodes");
const { challengeStatus } = require('../../config/environment/const')
const { handleAcceptedStatus, handleRejectedStatus, handleCounterStatus } = require('./helper.challenge.controller')

const common = require('../../config/global-emitter');
const commonEmitter = common.commonEmitter;


exports.createChallenge = async (req, res) => {
    try {
        let { user } = req;
        let { gameName, challenged_userId, challenged_amount } = req['body'];
        let required = ['gameName', 'challenged_userId', 'challenged_amount'];
        for (const field of required) {
            if (!req.body[field])
                return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);
        }
        let [userDetails] = await sqlConnection.query(`SELECT * FROM users WHERE id = ?`, [user['id']])
        if (userDetails.length === 0) return sendResponse(res, BADREQUEST, 'No user found');

        if (userDetails[0]['chips'] < challenged_amount) return sendResponse(res, BADREQUEST, "Don't have enough chips")

        let [challengedUser] = await sqlConnection.query(`SELECT * FROM users WHERE id = ?`, [challenged_userId])
        if (challengedUser.length === 0) return sendResponse(res, BADREQUEST, 'challenged user found');

        // Check if challenged amount is within the user's chip limits
        if (
            challenged_amount < userDetails[0]['minChipsLimit'] ||
            challenged_amount > userDetails[0]['maxChipsLimit']
        ) return sendResponse(res, BADREQUEST, 'Challenged amount is outside your chip limits');

        // Check if challenged amount is within the challenged user's chip limits
        if (
            challenged_amount < challengedUser[0]['minChipsLimit'] ||
            challenged_amount > challengedUser[0]['maxChipsLimit']
        ) return sendResponse(res, BADREQUEST, 'Challenged amount is outside challenged user\'s chip limits');

        if (challenged_userId == user['id']) return sendResponse(res, BADREQUEST, "You can't challenge yourself")

        let [existingChallenge] = await sqlConnection.query(`SELECT * FROM challenges WHERE challenged_userId = ? AND challenge_status = 'PENDING'`, [challenged_userId]);

        if (existingChallenge.length > 0) return sendResponse(res, BADREQUEST, 'There is already a pending challenge');

        // Deduct challenged_amount from requesting user
        const updatedChips = userDetails[0]['chips'] - challenged_amount;

        await sqlConnection.query(`UPDATE users SET chips = ? WHERE id = ?`, [updatedChips, user['id']]);

        let challengeQuery = insertQuery("challenges", ["gameName", "challenger_userId", "challenged_userId", "challenged_amount", "pool", "challenge_status"])

        let [challenge] = await sqlConnection.query(challengeQuery, [gameName, user['id'], challenged_userId, challenged_amount, challenged_amount, "PENDING"])
        if (challenge.affectedRows === 1) {
            let [newchallenge] = await sqlConnection.query(`SELECT * FROM challenges WHERE id = ?`, [challenge.insertId])

            commonEmitter.emit("Challenge", newchallenge);

            return sendResponse(res, SUCCESS, 'Challenged successfully', newchallenge);
        } else return sendResponse(res, BADREQUEST, 'Something went wrong');
    } catch (error) { errReturned(res, error) }
}

/**
    * ACCEPT/REJECT CHALLENGE 
 */

exports.handleChallenge = async (req, res) => {
    try {
        let { user } = req;
        console.log("🚀 **** user:", user)
        let { challenge_id, challenge_status, counter_challenge_amount } = req['body'];
        let required = ['challenge_id', 'challenge_status'];
        for (const field of required)
            if (!req.body[field])
                return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);

        let [challenge_details] = await sqlConnection.query(`SELECT * FROM challenges WHERE id = ${challenge_id}`);
        if (challenge_details.length === 0)
            return sendResponse(res, NOTFOUND, "Please provide valid challenge_id");

        let [user_details] = await sqlConnection.query(`SELECT * FROM users WHERE id = ${user['id']}`)
        if (user_details.length === 0) return sendResponse(res, NOTFOUND, "User not found");

        let [challenger_user_details] = await sqlConnection.query(`SELECT * FROM users WHERE id = ${challenge_details[0]['challenger_userId']}`)
        if (challenger_user_details.length === 0) return sendResponse(res, NOTFOUND, "User not found");

        if (!challengeStatus.includes(challenge_status)) return sendResponse(res, BADREQUEST, `Please provide valid challenge_status`, challenge_status)

        if (challenge_details[0]['challenged_userId'] != user['id'])
            return sendResponse(res, BADREQUEST, "Can't accept, this challenge didn't belongs to you")
        // if (challenge_details[0]['challenge_status'] == challenge_status)
        //     return sendResponse(res, BADREQUEST, `Aleady ${challenge_status} that challenge`)

        if (challenge_details[0]['challenge_status'] === "REJECTED")
            return sendResponse(res, BADREQUEST, "Challenge is rejected, cannot accept again")

        if (challenge_details[0]['challenge_status'] === "ACCEPTED")
            return sendResponse(res, BADREQUEST, "Challenge accpeted, it can't be reverted now")

        let message = null;
        if (challenge_status === "ACCEPTED") {
            message = await handleAcceptedStatus(user_details[0], challenge_details[0])
            const newChallenge = await getChallengeById(challenge_id);
            if (message === null) commonEmitter.emit('challenge:accept', newChallenge)
        }

        if (challenge_status === "REJECTED") {
            message = await handleRejectedStatus(challenger_user_details[0], challenge_details[0])
            const newChallenge = await getChallengeById(challenge_id);
            if (message === null) commonEmitter.emit('challenge:reject', newChallenge)
        }

        if (challenge_status === "COUNTER") {
            // Check if the counter_challenge_amount is greater than the user's balance
            if (counter_challenge_amount > user_details[0]['chips'])
                return sendResponse(res, BADREQUEST, "Not enough balance to counter the challenge")

            message = await handleCounterStatus(user_details[0], challenger_user_details[0], challenge_details[0], counter_challenge_amount)
            const newChallenge = await getChallengeById(challenge_id);

            if (message === null) commonEmitter.emit('challenge:counter', newChallenge)
        }

        if (message !== null) return sendResponse(res, BADREQUEST, message);

        let [challenge] = await sqlConnection.query(`UPDATE challenges SET challenge_status = ? WHERE id = ?`,
            [challenge_status, challenge_id])
        if (challenge.affectedRows === 1) {
            const newChallenge = await getChallengeById(challenge_id);
            // commonEmitter.emit('challenge:update', newChallenge);
            return sendResponse(res, SUCCESS, "Successfull", newChallenge);
        } else return sendResponse(res, BADREQUEST, 'Something went wrong');
    } catch (error) { errReturned(res, error) }
}

/**
    * PAYOUT CHALLENGE 
 */

exports.handleChallengeWinner = async (req, res) => {
    try {
        let { challenge_id, winner_userId } = req['body'];
        let required = ['challenge_id', 'winner_userId'];
        for (const field of required)
            if (!req.body[field])
                return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);
        let [challenge_details] = await sqlConnection.query(`SELECT * FROM challenges WHERE id = ${challenge_id}`);
        if (challenge_details.length === 0)
            return sendResponse(res, NOTFOUND, "Please provide valid challenge_id");

        let [user_details] = await sqlConnection.query(`SELECT * FROM users WHERE id = ${winner_userId}`)
        if (user_details.length === 0) return sendResponse(res, NOTFOUND, "Winner not found");

        if (challenge_details[0]['challenge_status'] === "REJECTED")
            return sendResponse(res, BADREQUEST, "Challenge is rejected")

        if (challenge_details[0]['challenge_status'] !== "ACCEPTED")
            return sendResponse(res, BADREQUEST, "Challenge not accepted yet")

        if (challenge_details[0]['challenged_userId'] != winner_userId && challenge_details[0]['challenger_userId'] != winner_userId)
            return sendResponse(res, BADREQUEST, "You are not included in this challenge")

        if (challenge_details[0]['winner'])
            return sendResponse(res, BADREQUEST, "Reward already distributed")

        let chips = user_details[0]['chips'] + challenge_details[0]['pool'];

        await Promise.all([
            sqlConnection.query(`UPDATE challenges SET winner = ?, pool = 0, pool_status = 'close' where id = ?`, [winner_userId, challenge_id]),
            sqlConnection.query(`UPDATE users SET chips = ? where id = ?`, [chips, winner_userId])
        ])
        return sendResponse(res, SUCCESS, "Winner Awarded successfully")

    } catch (error) { errReturned(res, error) }
}

/**
    * GET ALL CHALLENGES 
 */

exports.challenges = async (req, res) => {
    try {
        let { user } = req;

        console.log('****** usserid', user)
        let [user_details] = await sqlConnection.query(`SELECT * FROM users WHERE id = ?`, [user['id']]);
        if (user_details.length === 0) return sendResponse(res, NOTFOUND, "User not found");

        let [challenges] = await sqlConnection.query(`
            SELECT 
                c.id,
                c.gameName, 
                c.challenger_userId, 
                c.challenged_userId, 
                chu.username AS challenged_username, 
                c.challenged_amount, 
                c.winner, 
                c.challenge_status, 
                c.createdAt, 
                c.updatedAt 
            FROM challenges c
            JOIN users chu ON c.challenged_userId = chu.id
            WHERE c.challenger_userId = ? OR c.challenged_userId = ?
            ORDER BY c.createdAt DESC
        `, [user['id'], user['id']]);
        if (challenges.length === 0) return sendResponse(res, NOTFOUND, "No challenges found");
        // Modify the response based on the conditions
        challenges = challenges.map(challenge => {
            const gameStatus = challenge.winner === null ? null : (challenge.winner === user_details[0]['id'] ? 'winner' : 'loser');
            return {
                ...challenge,
                gameStatus
            };
        });
        console.log("🚀 ~ file: challenge.controller.js:215 ~ exports.challenges= ~ challenges:", challenges)

        return sendResponse(res, SUCCESS, "Challenges found", challenges)

    } catch (error) { errReturned(res, error) }
}