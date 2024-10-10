let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjQsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzAyMDIxNzE3LCJleHAiOjE3MzM1NTc3MTd9.OuxeWLWWP_ObFNQs73HO8puSxO6bR9i21Qtbf9zMFd0";
// const authenticatedSocket = io.connect('https://poker.metawarriors.world/auth', { query: { token } });
const authenticatedSocket = io.connect('http://localhost:4004/auth', { query: { token } });
// Join Button


console.log("****** SOCKET CLIENT ********")

let userId = 17;
authenticatedSocket.on(`challenge:${userId}`, (challenge) => {
    console.log("challenge ****", challenge)
});
authenticatedSocket.on(`challenge:accept:${userId}`, (challenge) => {
    console.log("challenge ****", challenge)
});
authenticatedSocket.on(`challenge:reject:${userId}`, (challenge) => {
    console.log("challenge ****", challenge)
});
authenticatedSocket.on(`challenge:counter:${userId}`, (challenge) => {
    console.log("challenge ****", challenge)
});
// authenticatedSocket.on(`challenge:update:${userId}`, (challenge) => {
//     console.log("challenge ****", challenge)
// });


function InputData() {
    let userIdInput = document.getElementById("userId").value
    let ringIdInput = document.getElementById("ringId").value
    let tableIdInput = document.getElementById("tableId").value
    let buyInInput = document.getElementById("buyIn").value

    let givenData = {
        tableId: tableIdInput,
        userId: userIdInput,
        ringId: ringIdInput,
        buyIn: buyInInput
    }
    authenticatedSocket.emit('ring:table:join', givenData);




    // authenticatedSocket.on('ring:response:' + tableId, (msg) => {
    //     console.log(msg);
    // })
    // authenticatedSocket.on('error', (err) => {
    //     console.log(err);
    // })
}

// leave Button
function leaveData() {
    let userIdInput = document.getElementById("userId").value
    let ringIdInput = document.getElementById("ringId").value
    let tableIdInput = document.getElementById('tableId').value;
    let buyInInput = document.getElementById("buyIn").value
    let data = {
        userId: userIdInput,
        tableId: tableIdInput,
        ringId: ringIdInput,
        buyIn: buyInInput,
    }
    console.log("Working  ********")
    // authenticatedSocket.emit('ring:table:leave', data);
    // authenticatedSocket.on('table:leave:msg', (msg) => {
    //     console.log(msg);
    // });
    ringId = "64e6f068e3fdbc56ec011928"
    authenticatedSocket.on(`ring:status:${ringId}`, (status) => {
        console.log("status ******", status)
    })
}

function processInputs() {
    let communityCardsInput = document.getElementById('community-cards').value;

    authenticatedSocket.emit('hello', communityCardsInput);

}
// authenticatedSocket.emit("tournament:tables");

// let tournamentId = "65311be377e801148b707f17"
// authenticatedSocket.on("tournament:tables:" + tournamentId, (data) => {
//     console.log("Data from Tables *****", data)
// });


// authenticatedSocket.emit("tournaments");

// authenticatedSocket.on("tournament:response", (data) => {
//     console.log("GET ALL TOURNAMENTS *****", data)
// });

// authenticatedSocket.on('ring:response:' + tableId, (msg) => {
//     console.log(msg)
// })
// authenticatedSocket.on('error', (err) => {
//     console.log(err);
// })


// authenticatedSocket.emit("user");
// let userId = "652cc4f493465e6d04bc138f";
// authenticatedSocket.on("user:" + userId, (data) => {
//     console.log("USER DETAILS *****", data)
// });
// // authenticatedSocket.on('user:stackCoins')
// let stackCoins = 1000
// authenticatedSocket.emit('user:stackCoins' + userId, stackCoins)


/*
Unauthenticated Sockets
*/
const unauthenticatedSockets = io.connect('https://poker.metawarriors.world/unauth');


