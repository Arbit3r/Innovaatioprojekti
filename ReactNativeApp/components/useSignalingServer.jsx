import {useRef} from "react";
import { RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";

const useSignalingServer = ({roomCode, isRoom, peerConnection}) => {
  const ws = useRef(new WebSocket('ws://10.0.2.2:8080')).current;
  let remoteCandidates = useRef([]).current;

  ws.onopen = () => {
    const request = {
      type: 'register',
      roomCode: roomCode,
      isRoom: isRoom,
    };
    ws.send(JSON.stringify(request));
    console.log('register request sent, isRoom: ' + isRoom);
  };

  ws.onmessage = async message => {
    message = JSON.parse(message.data);

    switch (message.type) {
      case 'offer':
        console.log('Offer received, isRoom: ' + isRoom);
        try {
          //if (makingOffer || peerConnection.signalingState !== 'stable') return;

          const offerDescription = new RTCSessionDescription(message.description);
          await peerConnection.setRemoteDescription(offerDescription);

          const answerDescription = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answerDescription);

          processCandidates();

          const answer = {
            type: 'answer',
            roomCode: roomCode,
            isRoom: !isRoom,
            description: peerConnection.localDescription,
          };
          ws.send(JSON.stringify(answer));
          console.log('Answer sent, isRoom: ' + isRoom);
        } catch (e) {
          console.log('Failed to process offer:' + e);
        }
        break;

      case 'answer':
        console.log('Answer received, isRoom: ' + isRoom);
        try {
          const answerDescription = new RTCSessionDescription(message.description);
          await peerConnection.setRemoteDescription(answerDescription);
        } catch (e) {
          console.log('Failed to process answer:' + e);
        }
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
  };

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

  return ws;
}

export default useSignalingServer;