const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({port: 8080 });

const room = new Map();
const nurse = new Map();


// Function for searching websocket from two available maps.
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
                    //room.get(json.roomCode).inCall = true;
                    let inCall = nurse.get(json.roomCode);
                    inCall = {
                        websocket : inCall.websocket,
                        inCall : true
                    };
                    nurse.set(json.roomCode,inCall);
                }catch (e) {
                    console.log("Socket could not be connected to!");
                    ws.send("room not found");
                }

                break;

                //Answer by searching caller and sending answer data back to the caller
            case "answer":

                console.log("Answering to " + json.roomCode + " call!");

                try {
                    handelConn(json).send(JSON.stringify(json));
                }catch (e) {
                    console.log("Socket could not be connected to!");
                    ws.send("room not found");
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
                        room.set(json.roomCode,{
                            websocket : ws,
                            inCall : false
                        });

                    } else if(json2 === false){

                        console.log("Pushing " + json.roomCode + " to nurse array!")
                        storageRoomNum = json.roomCode;
                        isRoom = false;
                        nurse.set(json.roomCode,{
                            websocket : ws,
                            inCall : false
                        });
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
                    ws.send("room not found");
                }
                break;

                //Checking if searched roomCode is in call!
            case "call request":

                console.log("Call request! " + json.roomCode + " " + json.isRoom);
                let inCall = false;
                let roomCheck = json.isRoom && JSON.parse(json.isRoom);

                try {
                    if(roomCheck){

                        inCall = room.get(json.roomCode);
                        inCall = inCall.inCall;

                        if(inCall){
                            console.log("Call denied!");
                            ws.send(JSON.stringify({type: "request denied", reason: "room in use"}));
                        }else if(!inCall){
                            console.log("Call accepted!");
                            ws.send(JSON.stringify({type: "request accepted"}));
                        }

                    }
                    else if(!roomCheck){

                        inCall = nurse.get(json.roomCode);
                        inCall = inCall.inCall;

                        if(inCall){
                            console.log("Call denied!");
                            ws.send(JSON.stringify({type: "request denied"}));
                        }else if(!inCall){
                            console.log("Call accepted!");
                            ws.send(JSON.stringify({type: "request accepted"}));
                        }
                    };
                }catch (e) {
                    console.log("Room in use/not found!");
                    ws.send(JSON.stringify({type: 'request denied', reason: 'room not found'}));
                }
                break;

        };
    });


    // Handling disconnection by removing peer from nurse/room maps.
    // Thus making it impossible to be connected to.
    // !!! If registration was not made, deletion is not required.
    ws.on('close', () => {

        if(isRoom === true){

            console.log(storageRoomNum + " room disconnected succefully: ");
            room.delete(storageRoomNum);

        } else if(isRoom === false){

            console.log(storageRoomNum + " nurse disconnected succefully: ");

            nurse.delete(storageRoomNum);

        }

    });
});



