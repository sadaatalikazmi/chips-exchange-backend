'use strict';

const jwt = require('jsonwebtoken');
const config = require('./environment');
const colors = require('colors');
const sqlConnection = require("./sqlConnection");

module.exports = function (socketio) {
    socketio.of("/unauth")
    socketio.on('connection', function (socket) {
        console.log("********* unath connection established *******")
        socket.on('hello', (name) => {
            socket.emit('hello', `My name is ${name}`)
        });
        socket.connectedAt = new Date();
        socket.address = `${socket.request.connection.remoteAddress} : ${socket.request.connection.remotePort}`;

        // unauthenticatedConnect(socket);
        // console.info('[%s] CONNECTED', socket.address);

        socket.log = function (...data) {
            console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
        };
    });

    socketio.of("/auth")
        .use(function (socket, next) {
            console.log("****** auth connection*******");
            let { query } = socket.handshake;
            if (query && query['token']) {
                // console.log("process.env.TOKEN_SECRET_SESSION", process.env)
                jwt.verify(query['token'], 'Softtik_s3cr3t_2023', function (error, decoded) {
                    if (error) {
                        console.log(`*******Invalid Token`);
                        return next(new Error('Authentication error'));
                    }
                    socket['decoded'] = decoded;
                    next();
                });
            }
            else {
                console.log(`*******No Token`);
                next(new Error('Authentication error'));
            }
        }).use(async (socket, next) => {
            if (socket['decoded']['role'] !== 'user') return next(new Error('Only user can perform this action'));
            const checkUserQuery = `SELECT * FROM users WHERE id = ?`;
            let [result] = await sqlConnection.query(checkUserQuery, [socket['decoded']['id']])
            if (result.length < 1) return next(new Error('You are unauthorized'))
            next();
        })
        .on('connection', function (socket) {
            console.log("Auth connection established".bgBlue)

            socket.connectedAt = new Date();

            socket.on('disconnect', () => onDisconnect(socket));

            socket.address = `${socket.request.connection.remoteAddress} : ${socket.request.connection.remotePort}`;
            onAuthSocketConnect(socket);

            // console.info('[%s] CONNECTED', socket.address);

            socket.log = function (...data) {
                console.log(`SocketIO ${socket.nsp.name} [${socket.address}]`, ...data);
            };
        })
        .on('disconnect', function (socket) {
            console.log(`Connection disconnected`.red)
        })
};

function unauthenticatedConnect(socket) {
    socket.on('info', function (data) {
        console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
    });
}

async function onAuthSocketConnect(socket) {

    require('../api/challenges/challenge.socket').challenge(socket);

    socket.on('info', function (data) {
        console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
        console.log('connected');
    });
}

async function onDisconnect(socket) {
    console.info('[%s] DISCONNECTED', socket.user);

    console.info('[%s] Connection Disconnected*****'.bgRed, socket["decoded"]["id"]);
}

