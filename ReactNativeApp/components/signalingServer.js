import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

let candidates = [];

wss.on('connection', ws => {

    console.log("New connection!");

    ws.on('message', data => {

        let json = JSON.parse(data.toString());

        switch (json.type){

            //Make a call by searching roomCode and if found send offer to receiving end
            case "call":

                console.log("Calling to " + json.search + "!");
                candidates.forEach((candidate) =>{
                    if (json.search === candidate.roomCode){

                        candidate.webSocket.send(JSON.stringify({type: "offer",id: json.id, offer: json.offer}));

                    }
                });
                break;

            //Answer by searching caller and sending answer data back to the caller
            case "answer":

                console.log("Answering to " + json.search + " call!");
                candidates.forEach((candidate) =>{
                    if (json.search === candidate.roomCode){
                        candidate.webSocket.send(JSON.stringify(json.answer));
                    }
                });

                break;

            //Register websocket with roomCode to the signaling server
            case "regCandidate":

                let isIncluded = false;

                candidates.forEach((candidate) =>{
                    if (json.roomCode === candidate.roomCode){
                        isIncluded = true;
                        console.log(json.roomCode +  " Is included!");
                    }
                });

                if(!isIncluded){
                    console.log(json.roomCode + "Is not included!");
                    candidates.push({
                        roomCode: json.roomCode,
                        webSocket: ws
                    })
                };

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

