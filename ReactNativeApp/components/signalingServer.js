const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({port: 8080 });

//let room = [];
//let nurse = [];
const room = new Map();
const nurse = new Map();


// Function for searching websocket from two available maps.
function  handelConn(json) {

    let response;
    let isRoom = json.isRoom && JSON.parse(json.isRoom);

    if(isRoom){response = room.get(json.roomCode);}
    else if(!isRoom){response = nurse.get(json.roomCode);

    } else {
        console.log("Socket not found!");
        response = null;
    }
    return response;
}

wss.on('connection', ws => {

    console.log("New connection!");

    //Only available during connection event
    let storageRoomNum,isRoom; // These are being stored into during registration event and used in websocket info deletion.


    //Handle incoming message events
    ws.on('message', data => {

        let json = JSON.parse(data.toString());

        switch (json.type){

                //Make a call by searching with ((roomCode)) and if found send offer to receiving end
            case "offer":

                console.log("Calling to " + json.roomCode + "!");

                try {
                    handelConn(json).send(JSON.stringify(json));
                }catch (e) {
                    console.log("Socket could not be connected to!");
                }

                break;

                //Answer by searching caller and sending answer data back to the caller
            case "answer":

                console.log("Answering to " + json.roomCode + " call!");

                try {
                    handelConn(json).send(JSON.stringify(json));
                }catch (e) {
                    console.log("Socket could not be connected to!");
                }
                break;

                //Register websocket with roomCode to the signaling server. So it could be found by other socket. (P2P availability)
            case "register":

                if(handelConn(json) == null){

                    json2 = json.isRoom && JSON.parse(json.isRoom); // Tee paremmin

                    if(json2 === true){

                        console.log("Pushing " + json.roomCode + " to room array!");
                        storageRoomNum = json.roomCode;
                        isRoom = true;
                        room.set(json.roomCode,ws);

                    } else if(json2 === false){

                        console.log("Pushing " + json.roomCode + " to nurse array!")
                        storageRoomNum = json.roomCode;
                        isRoom = false;
                        nurse.set(json.roomCode,ws);

                    }
                };
                break;

                //Send possible server candidate data to remote peer.
            case "candidate":

                console.log("Sending candidate to " + json.roomCode);
                try {
                    handelConn(json).send(JSON.stringify(json));
                }catch (e) {
                    console.log("Socket could not be connected to!");
                }
                break;

        };
    });


    // Handling disconnection by removing peer from nurse/room maps.
    // Thus making it impossible to be connected to.
    // !!! If registration was not made, deletion is not required.
    ws.on('close', () => {

        if(isRoom === true){

            console.log(storageRoomNum + " disconnected succefully: " + room.has(storageRoomNum));
            room.delete(storageRoomNum);

        } else if(isRoom === false){

            console.log(storageRoomNum + " disconnected succefully: " + nurse.has(storageRoomNum));

            nurse.delete(storageRoomNum);

        }

    });
});



