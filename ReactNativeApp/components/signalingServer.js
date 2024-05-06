const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({port: 8080 });

const room = new Map();
const nurse = new Map();


// Used to search websocket from two available maps.
function  handelConn(json) {

    let response;
    let isRoom = json.isRoom && JSON.parse(json.isRoom);

    if(isRoom){
        if(room.get(json.roomCode) != undefined){
            response = room.get(json.roomCode);
            response = response.websocket;
        }
    }
    else if(!isRoom){
        if(nurse.get(json.roomCode) != undefined){
            response = nurse.get(json.roomCode);
            response = response.websocket;
        }

    } else {
        console.log("Socket not found!");
        response = null;
    }
    return response;
}

wss.on('connection', ws => {

    console.log("New connection!");

    let storageRoomNum,isRoom; // These are being stored into during registration event and used in websocket info deletion.


    //Handle incoming message events from sockets
    ws.on('message', data => {

        let json = JSON.parse(data.toString());
        let roomCheck = json.isRoom && JSON.parse(json.isRoom);

        switch (json.type){

                //Make a call by searching with (roomCode) and if found send offer(sdp) to remote peer
            case "offer":

                console.log("Calling to " + json.roomCode + "!");

                try {
                    handelConn(json).send(JSON.stringify(json));
                    let inCall = room.get(json.roomCode);
                    inCall = {
                        websocket : inCall.websocket,
                        inCall : true
                    };
                    room.set(json.roomCode,inCall);
                    console.log("Calling success!");
                }catch (e) {
                    console.log("Calling failed! (socket not found)");
                    ws.send(JSON.stringify({type: 'request denied', reason: 'room not found'}));
                }

                break;

                //Answer by searching caller and sending answer(sdp) back to the caller
            case "answer":

                console.log("Answering to " + json.roomCode + " call!");

                try {
                    handelConn(json).send(JSON.stringify(json));
                    console.log("Answer success!");
                }catch (e) {
                    console.log("Answer failed! Socket could not be connected to!");
                    ws.send(JSON.stringify({type: 'request denied', reason: 'room not found'}));
                }
                break;

                //Register websocket to corresponding map with roomCode to the signaling server.
                //So it could be found by other socket. (P2P availability).
            case "register":

                //Check if websocket is already found in one of the maps.
                if(handelConn(json) == null){

                    //socket was not found. adding to server.
                    if(roomCheck === true){
                        storageRoomNum = json.roomCode;
                        isRoom = true;
                        room.set(json.roomCode,{
                            websocket : ws,
                            inCall : false
                        });
                        console.log("Pushing " + json.roomCode + " to room array!");

                    } else if(roomCheck === false){
                        storageRoomNum = json.roomCode;
                        isRoom = false;
                        nurse.set(json.roomCode,{
                            websocket : ws,
                            inCall : false
                        });
                        console.log("Pushing " + json.roomCode + " to nurse array!")
                    }
                    //Socket was found
                }else {
                    ws.send({type: "registration denied"})
                };
                break;

                //Send possible servers to remote peer.
            case "candidate":

                console.log("Sending candidate to " + json.roomCode);
                try {
                    handelConn(json).send(JSON.stringify(json));
                }catch (e) {
                    console.log("Socket could not be connected to!");
                    ws.send(JSON.stringify({type: 'request denied', reason: 'room not found'}));
                }
                break;

                //Checking if searched roomCode is in call!
            case "call request":

                console.log("Call request! " + json.roomCode + " " + json.isRoom);
                let inCall = false;

                try {
                    if(roomCheck){
                        inCall = room.get(json.roomCode);
                    } else if(!roomCheck){
                        inCall = nurse.get(json.roomCode);
                    }
                    inCall = inCall.inCall;

                    if(inCall){
                        console.log("Call denied!");
                        ws.send(JSON.stringify({type: "request denied", reason: "room in use"}));
                    }else if(!inCall){
                        console.log("Call accepted!");
                        ws.send(JSON.stringify({type: "request accepted"}));
                    }

                }catch (e) {
                    console.log("Room in use/not found!");
                    ws.send(JSON.stringify({type: 'request denied', reason: 'room not found'}));
                }
                break;

                // Toggle remote video on remote peer
            case "toggleRemoteVideo":

                console.log("Toggle video on " + json.roomCode);

                try {
                    handelConn(json).send(JSON.stringify({type: "toggleVideo"}));
                    console.log("Toggling success!");
                }catch (e) {
                    console.log("Toggle failed! Socket could not be connected to!");
                    ws.send(JSON.stringify({type: 'request denied', reason: 'room not found'}));
                }
                break;
        }
    });

    // Handling disconnection by removing peer from nurse/room maps.
    // Thus making it impossible to be connected to.
    // !!! If registration was not made, deletion is not required.
    ws.on('close', () => {

        if(isRoom === true){

            room.delete(storageRoomNum);
            try {
                nurse.get(storageRoomNum).websocket.send(JSON.stringify({type: "peer disconnected"})); // Send disconnect alert to remote peer
                console.log(storageRoomNum + " room disconnected successfully: ");
                console.log("Disconnect info sent to remote " + storageRoomNum + " nurse");
            }catch (e) {
                if("Cannot read properties of undefined (reading 'websocket')" == e.message){
                    console.log("Nurse " + storageRoomNum + " was not found! (disconnect info was not send to remote)" );
                } else {
                    console.log(e);
                }
            };

        } else if(isRoom === false){

            nurse.delete(storageRoomNum);
            try {
                let tempRoom = room.get(storageRoomNum);
                tempRoom.websocket.send(JSON.stringify({type: "peer disconnected"})); // Send disconnect alert to remote peer
                //set inCall to false, so it could be called to!
                tempRoom = {
                    websocket : tempRoom.websocket,
                    inCall : false
                };
                room.set(storageRoomNum,tempRoom);
                console.log(storageRoomNum + " nurse disconnected successfully: ");
                console.log("Disconnect info sent to remote " + storageRoomNum + " room");
            }catch (e) {

                if("Cannot read properties of undefined (reading 'websocket')" == e.message){
                    console.log("Room " + storageRoomNum + " was not found! (inCall change to false not required)" );
                    console.log("disconnect info was not send to remote!");
                } else {
                    console.log(e);
                }
            }
        }

    });
});



