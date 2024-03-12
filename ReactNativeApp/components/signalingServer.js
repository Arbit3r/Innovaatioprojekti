const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

let room = [];
let nurse = [];

function  handelConn(json) {

    let response;
    let isRoom = json.isRoom && JSON.parse(json.isRoom);

    if(isRoom){
        room.forEach((candidate) =>{
            if (json.roomCode === candidate.roomCode){
                console.log("found room " + candidate.webSocket);
                response = candidate.webSocket;
            }
        });

    }else if(!isRoom){
        nurse.forEach((candidate) =>{
            if (json.roomCode === candidate.roomCode){
                console.log("found nurse " + candidate.webSocket);
                response = candidate.webSocket;
            }
        });

    } else {
        console.log("Socket not found!");
        response = null;
    }

    return response;
}

wss.on('connection', ws => {

    console.log("New connection!");

    ws.on('message', data => {

        let json = JSON.parse(data.toString());

        switch (json.type){

            //Make a call by searching with ((roomCode)) and if found send offer to receiving end
            case "offer":

                console.log("Calling to " + json.roomCode + "!");

                console.log("Boolean: " + json.isRoom && JSON.parse(json.isRoom));

                try {
                    handelConn(json).send(JSON.stringify(json));
                }catch (e) {
                    console.log(e);
                }

                break;

            //Answer by searching caller and sending answer data back to the caller
            case "answer":

                console.log("Answering to " + json.roomCode + " call!");
                console.log("Boolean: " + json.isRoom && JSON.parse(json.isRoom));

                try {
                    handelConn(json).send(JSON.stringify(json));
                }catch (e) {
                    console.log(e);
                }
                break;

            //Register websocket with roomCode to the signaling server
            case "register":

                if(handelConn(json) == null){

                    console.log(json.roomCode + " Is not included!");

                    json2 = json.isRoom && JSON.parse(json.isRoom); // Tee paremmin

                    if(json2 === true){
                        console.log("Pushing " + json.roomCode + " to room array!")
                        room.push({
                            roomCode: json.roomCode,
                            webSocket: ws
                        });
                    } else if(json2 === false){
                        console.log("Pushing " + json.roomCode + " to nurse array!")
                        nurse.push({
                            roomCode: json.roomCode,
                            webSocket: ws
                        });
                    }
                };
                break;

            case "candidate":

                console.log("Sending candidate to " + json.roomCode);
                try {
                    handelConn(json).send(JSON.stringify(json));
                }catch (e) {
                    console.log(e);
                }

                break;

        };

        //wss.clients.forEach( function each(client){
        //client.send(data.toString());
        //})

    });

    ws.on('close', () => {
        console.log("disconnected");
    });
});



