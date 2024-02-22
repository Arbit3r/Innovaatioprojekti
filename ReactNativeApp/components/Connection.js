import {useEffect, useRef} from 'react';

function Connection({roomCode, isUser}) {
  let ws = useRef(new WebSocket('wss://echo.websocket.org')).current; // Signaling server address goes here

  useEffect(() => {
    ws.onopen = () => {
      const request = {
        roomCode: roomCode,
        isUser: isUser, // Boolean that specifies if the request is coming from a user or a room
      };
      ws.send(JSON.stringify(request));
    };

    ws.onmessage = message => {
      try {
        const response = JSON.parse(message.data);
        console.log('Room code:', response.roomCode);
        console.log('User:', response.isUser);
      } catch (error) {
        console.log(message.data);
      }
    };

    ws.onerror = error => {
      console.log('Error:', error.message);
    };

    ws.onclose = event => {
      console.log('Connection closed');
      console.log('Code:', event.code);
      console.log('Reason:', event.reason);
    };
  }, [isNurse, roomCode, ws]);

  return null;
}

export default Connection;
