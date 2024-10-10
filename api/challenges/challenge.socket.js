
"use strict";

const { SUCCESS } = require('../../config/ResponseCodes');
const sqlConnection = require("../../config/sqlConnection");
const { sendSocketResponse, errSocketReturned } = require('../../config/dto');

var common = require('../../config/global-emitter');
var commonEmitter = common.commonEmitter;



exports.challenge = async (socket) => {

    socket.on("ring:refresh", async () => {
    })


    commonEmitter.on(`Challenge`, async (challenge) => {
        sendSocketResponse(socket, `challenge:${challenge['challenged_userId']}`, SUCCESS, `New Challenge`, { challenge });
    })
    commonEmitter.on(`challenge:accept`, async (challenge) => {
        sendSocketResponse(socket, `challenge:accept:${challenge['challenger_userId']}`, SUCCESS, `Challenge Accepted`, { challenge });
    })
    commonEmitter.on(`challenge:reject`, async (challenge) => {
        sendSocketResponse(socket, `challenge:reject:${challenge['challenger_userId']}`, SUCCESS, `Challenge Rejected`, { challenge });
    })
    commonEmitter.on(`challenge:counter`, async (challenge) => {
        sendSocketResponse(socket, `challenge:counter:${challenge['challenged_userId']}`, SUCCESS, `Challenge Countered`, { challenge });
    })

    // commonEmitter.on(`challenge:update`, async (challenge) => {
    //     sendSocketResponse(socket, `challenge:update:${challenge['challenged_userId']}`, SUCCESS, `Challenge Update`, { challenge });
    // })

}
