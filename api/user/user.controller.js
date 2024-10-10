
"use strict";

const _ = require("lodash");
const bcrypt = require('bcryptjs');
const { createJWT } = require("../../auth/helper");
const { insertQuery, updateQuery } = require('../../utils/helper')
const sqlConnection = require("../../config/sqlConnection");
const { sendResponse, errReturned } = require("../../config/dto");
const { SUCCESS, BADREQUEST, NOTFOUND } = require("../../config/ResponseCodes");
const { emailValidator, defaultChips } = require('../../config/environment/const');
const { sendEmail } = require("../../utils/mail");
const crypto = require("crypto");
const stripe = require('stripe')(process?.env?.STRIPE_KEY);

/**
    * USER SIGN UP
 */
exports.signUp = async (req, res) => {
    try {
        const { username, email, password, name } = req.body;
        let required = ['username', 'email', 'password'];
        for (const field of required) {
            if (!req.body[field]) return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);
        }

        let valid = emailValidator.test(email);
        if (!valid) return sendResponse(res, BADREQUEST, "Please enter valid Email", valid);
        if (username < 5 || username > 20) return sendResponse(res, BADREQUEST, "Username must be in between 5 to 50 characters");

        const checkUserQuery = `SELECT * FROM users WHERE username = ? OR email = ?`;
        let [result] = await sqlConnection.query(checkUserQuery, [username, email]);
        if (result.length > 0) return sendResponse(res, BADREQUEST, "User already registered");

        const stripeCustomer = await stripe.customers.create({ name, email });
        const customerId = stripeCustomer.id;
        let hashedPassword = bcrypt.hashSync(password, 12);

        let signUpQuery = insertQuery('users', ['username', 'email', 'hashedPassword', 'name', 'customerId', 'chips']);
        let [user] = await sqlConnection.query(signUpQuery, [username, email, hashedPassword, name, customerId, defaultChips]);

        if (user.affectedRows === 1) {
            const userId = user.insertId;
            const newUserQuery = `SELECT * FROM users WHERE id = ?`;
            let [newUser] = await sqlConnection.query(newUserQuery, [userId])
            let savedUser = newUser[0]
            let { token } = await createJWT(savedUser)
            return sendResponse(res, SUCCESS, 'User signUp successfully', { token, savedUser });
        }

        return sendResponse(res, BADREQUEST, "Something went wrong, can't signUp");
    } catch (error) { errReturned(res, error) }
};

/**
    * USER SIGN IN 
 */

exports.signIn = async (req, res) => {
    try {
        let { email, password } = req['body'];
        let required = ['email', 'password'];
        for (const field of required) {
            if (!req.body[field])
                return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);
        }
        let [user] = await sqlConnection.query(`SELECT * FROM users WHERE email = ?`, [email])
        if (user.length === 0) return sendResponse(res, BADREQUEST, 'No user found', []);

        let isPassword = await bcrypt.compare(password, user[0].hashedPassword)
        if (!isPassword) return sendResponse(res, BADREQUEST, "Incorrect password")

        const userObj = { ...user[0], hashedPassword: undefined };

        let { token } = await createJWT(userObj)
        return sendResponse(res, SUCCESS, 'Login Successful', { token, user: userObj });

    } catch (error) { errReturned(res, error) }
}

/**
 * Get the name of the authenticated user
 */
exports.getUserName = async (req, res) => {
    try {
        const { user } = req;

        // Fetch the user details
        const [userDetails] = await sqlConnection.query(`SELECT * FROM users WHERE id = ?`, [user.id]);

        if (userDetails.length === 0) {
            return sendResponse(res, NOTFOUND, "User not found");
        }

        // Extract the username
        const username = userDetails[0].name;

        return sendResponse(res, SUCCESS, "User name retrieved successfully", { username });
    } catch (error) {
        errReturned(res, error);
    }
};

/**
 * Update minChipsLimit and maxChipsLimit for a user
 */
exports.updateChipsLimits = async (req, res) => {
    try {
        const { minChipsLimit, maxChipsLimit } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!minChipsLimit || !maxChipsLimit) {
            return sendResponse(res, BADREQUEST, 'Please provide both minChipsLimit and maxChipsLimit');
        }

        // Update user's minChipsLimit and maxChipsLimit
        const updateUserChipsLimitQuery = updateQuery("users", ["minChipsLimit", "maxChipsLimit"], "id");

        const [updateResult] = await sqlConnection.query(updateUserChipsLimitQuery, [minChipsLimit, maxChipsLimit, userId]);

        if (updateResult.affectedRows === 1) {
            // Fetch and return the updated user details
            const fetchUserQuery = `SELECT username, chips, minChipsLimit, maxChipsLimit FROM users WHERE id = ?`;
            const [userDetails] = await sqlConnection.query(fetchUserQuery, [userId]);

            return sendResponse(res, SUCCESS, 'Chips limits updated successfully', userDetails[0]);
        }

        return sendResponse(res, BADREQUEST, 'Failed to update chips limits');

    } catch (error) {
        errReturned(res, error);
    }
};

/**
 * Get Chips Balance of a User
 */
exports.getChipsBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user's chips balance
        const fetchChipsBalanceQuery = `SELECT chips FROM users WHERE id = ?`;
        const [userDetails] = await sqlConnection.query(fetchChipsBalanceQuery, [userId]);

        if (userDetails.length === 0) return sendResponse(res, NOTFOUND, 'User not found');

        const { chips } = userDetails[0];

        return sendResponse(res, SUCCESS, 'Chips balance retrieved successfully', { chips });
    } catch (error) {
        errReturned(res, error);
    }
};

/**
 * Generate a password reset passcode and store it in the database
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email exists in the database
        const [user] = await sqlConnection.query(`SELECT id, email FROM users WHERE email = ?`, [email]);

        if (user.length === 0) {
            return sendResponse(res, BADREQUEST, 'Email not found');
        }

        // Generate a unique reset passcode (4 digits)
        const resetPasscode = crypto.randomInt(1000, 10000);
        console.log(resetPasscode);

        // Set the expiration time (e.g., 1 hour from now)
        const resetPasscodeExpiry = new Date();
        resetPasscodeExpiry.setHours(resetPasscodeExpiry.getHours() + 1);
        console.log("***resetPasscodeExpiry: ", resetPasscodeExpiry)


        // Hash the passcode before storing it in the database (optional)
        bcrypt.hash(resetPasscode.toString(), 12, async (err, hashedPasscode) => {
            if (err) {
                return errReturned(res, err); enterPasscode
            }



            // Store the passcode in the database
            await sqlConnection.query(`UPDATE users SET resetPasscode = ?, resetPasscodeExpiry = ? WHERE id = ?`, [hashedPasscode, resetPasscodeExpiry, user[0].id]);

            // Send a password reset email with the passcode
            const emailBody = `Your Chips Exchange account passcode for password reset is: ${resetPasscode}`;
            sendEmail(email, 'Password Reset Request', emailBody);

            return sendResponse(res, SUCCESS, 'Password reset passcode sent successfully');
        });
    } catch (error) {
        errReturned(res, error);
    }
};

/**
 * Verify the entered passcode for password reset
 */
exports.enterPasscode = async (req, res) => {
    try {
        const { email, passcode } = req.body;

        let required = ['email', 'passcode'];
        for (const field of required) {
            if (!req.body[field])
                return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);
        }

        // Check if the email exists in the database
        const [user] = await sqlConnection.query(`SELECT resetPasscode, resetPasscodeExpiry FROM users WHERE email = ?`, [email]);

        if (user.length === 0) {
            return sendResponse(res, BADREQUEST, 'Email not found');
        }

        // Check if the passcode and expiry are valid
        if (!user[0].resetPasscode || !user[0].resetPasscodeExpiry || user[0].resetPasscodeExpiry < new Date()) {
            return sendResponse(res, BADREQUEST, 'Invalid or expired passcode');
        }

        // Compare the entered passcode with the hashed passcode in the database
        bcrypt.compare(passcode.toString(), user[0].resetPasscode, (err, result) => {
            if (err) {
                return errReturned(res, err);
            }

            if (result) {
                // Passcode is valid
                return sendResponse(res, SUCCESS, 'Passcode verified successfully');
            } else {
                // Invalid passcode
                return sendResponse(res, BADREQUEST, 'Invalid passcode');
            }
        });

    } catch (error) {
        errReturned(res, error);
    }
};

/**
 * Set a new password for the user
 */
exports.setNewPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        let required = ['email', 'newPassword'];
        for (const field of required) {
            if (!req.body[field])
                return sendResponse(res, BADREQUEST, `Please provide ${field}`, []);
        }

        // Check if the email exists in the database
        const [user] = await sqlConnection.query(`SELECT id, email FROM users WHERE email = ?`, [email]);

        if (user.length === 0) {
            return sendResponse(res, BADREQUEST, 'Email not found');
        }

        // Hash the new password
        const hashedPassword = bcrypt.hashSync(newPassword, 12);

        // Update the user's password in the database
        await sqlConnection.query(`UPDATE users SET hashedPassword = ? WHERE id = ?`, [hashedPassword, user[0].id]);

        return sendResponse(res, SUCCESS, 'Password updated successfully');

    } catch (error) {
        errReturned(res, error);
    }
};

