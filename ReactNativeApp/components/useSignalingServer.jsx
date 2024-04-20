import {useEffect, useRef, useState} from "react";
import { RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";

const useSignalingServer = (isRoom) => {
  const [roomCode, setRoomCode] = useState(null);
  const [ws, setWs] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  let remoteCandidates = useRef([]).current;

  function setupSignalingServer(serverAddress, _peerConnection, _roomCode) {
    setWs(new WebSocket(serverAddress));
    setPeerConnection(_peerConnection);
    setRoomCode(_roomCode);
  }

  useEffect(() => {
    if (!ws || !roomCode) return;

    ws.onopen = () => {
      register();
    };

    ws.onmessage = async message => {
      message = JSON.parse(message.data);

      switch (message.type) {
        case 'offer':
          await receiveOffer(message.description);
          sendAnswer();
          break;

        case 'answer':
          await receiveAnswer(message.description);
          break;

        case 'candidate':
          handleRemoteCandidate(message.candidate);
          break;

        default:
          break;
      }
    };

    ws.onerror = error => {
      console.log('WebSocket error:', error.message);
    };

    ws.onclose = event => {
      console.log('WebSocket connection closed');
      console.log('Code:', event.code);
      console.log('Reason:', event.reason);
      setWs(null);
    };
  }, [ws, peerConnection, roomCode]);

  function register() {
    const request = {
      type: 'register',
      roomCode: roomCode,
      isRoom: isRoom,
    };
    ws.send(JSON.stringify(request));
    console.log('register request sent, isRoom: ' + isRoom);
  }

  async function receiveOffer(description) {
    try {
      const offerDescription = new RTCSessionDescription(description);
      await peerConnection.setRemoteDescription(offerDescription);

      const answerDescription = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answerDescription);

      processCandidates();

      console.log('Offer received, isRoom: ' + isRoom);
    } catch (e) {
      console.log('Failed to process offer: ' + e);
    }
  }

  async function receiveAnswer(description) {
    try {
      const answerDescription = new RTCSessionDescription(description);
      await peerConnection.setRemoteDescription(answerDescription);
      console.log('Answer received, isRoom: ' + isRoom);
    } catch (e) {
      console.log('Failed to process answer:' + e);
    }
  }

  function sendAnswer() {
    try {
      const answer = {
        type: 'answer',
        roomCode: roomCode,
        isRoom: !isRoom,
        description: peerConnection.localDescription,
      };
      ws.send(JSON.stringify(answer));
      console.log('Answer sent, isRoom: ' + isRoom);
    } catch (e) {
      console.log('Failed to send answer: ' + e);
    }
  }

  function handleRemoteCandidate(iceCandidate) {
    iceCandidate = new RTCIceCandidate(iceCandidate);

    // Sometimes candidates will be received before remoteDescription is set.
    // In this case they are added to the remoteCandidates array.
    if (peerConnection.remoteDescription == null) {
      return remoteCandidates.push(iceCandidate);
    }

    return peerConnection.addIceCandidate(iceCandidate);
  }

  // Process candidates that couldn't be processed in handleRemoteCandidate.
  function processCandidates() {
    if (remoteCandidates.length < 1) return;

    remoteCandidates.map(candidate =>
      peerConnection.addIceCandidate(candidate),
    );

    remoteCandidates = [];
  }

  return [ ws, setupSignalingServer ];
}

export default useSignalingServer;