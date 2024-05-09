import {useEffect, useRef, useState} from "react";
import { RTCSessionDescription, RTCIceCandidate } from "react-native-webrtc";

const useSignalingServer = (isRoom, setConnectionState, videoEnabledRef, setVideoEnabled) => {
  const [roomCode, setRoomCode] = useState(null);
  const [ws, setWs] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  let remoteCandidates = useRef([]).current;
  let makingOffer = useRef(false).current;

  function connectToServer(serverAddress, _peerConnection, _roomCode) {
    setWs(new WebSocket(serverAddress));
    setPeerConnection(_peerConnection);
    setRoomCode(_roomCode);
  }

  useEffect(() => {
    if (!ws || !roomCode) return;

    ws.onopen = () => {
      setConnectionState('connected to server');
      register();
    };

    ws.onmessage = async message => {
      message = JSON.parse(message.data);

      switch (message.type) {
        case 'registration denied':
          setConnectionState('room already exists');
          break;

        case 'request accepted':
          setConnectionState('calling');
          await sendOffer();
          break;

        case 'request denied':
          handleRequestDenied(message.reason);
          break;

        case 'offer':
          setConnectionState('calling');
          await receiveOffer(message.description);
          sendAnswer();
          break;

        case 'answer':
          await receiveAnswer(message.description);
          break;

        case 'candidate':
          handleRemoteCandidate(message.candidate);
          break;

        case 'toggleVideo':
          setVideoEnabled(!videoEnabledRef.current);
          break

        case 'peer disconnected':
          setConnectionState('restarting');
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
      if (event.code === 1006) {
        setConnectionState('server connection failed');
      }
      setWs(null);
    };
  }, [ws, peerConnection, roomCode]);

  function register() {
    try {
      const request = {
        type: 'register',
        roomCode: roomCode,
        isRoom: isRoom,
      };
      ws.send(JSON.stringify(request));
      console.log('register request sent, isRoom: ' + isRoom);
    } catch (e) {
      console.log('failed to send register request: ' + e);
    }

  }

  async function sendOffer() {
    try {
      if (makingOffer) return;

      makingOffer = true;

      let sessionConstraints = {
        mandatory: {
          OfferToReceiveAudio: true,
          OfferToReceiveVideo: true,
          VoiceActivityDetection: true,
        },
      };

      const offerDescription = await peerConnection.createOffer(sessionConstraints);
      await peerConnection.setLocalDescription(offerDescription);

      const offer = {
        type: 'offer',
        roomCode: roomCode,
        isRoom: !isRoom,
        description: peerConnection.localDescription,
      };

      ws.send(JSON.stringify(offer));
      console.log('offer sent, isRoom: ' + isRoom);
    } catch (e) {
      console.log('Error while sending offer:' + e);
    } finally {
      makingOffer = false;
    }
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

  async function receiveAnswer(description) {
    try {
      const answerDescription = new RTCSessionDescription(description);
      await peerConnection.setRemoteDescription(answerDescription);
      processCandidates();
      console.log('Answer received, isRoom: ' + isRoom);
    } catch (e) {
      console.log('Failed to process answer:' + e);
    }
  }

  function handleRequestDenied(reason) {
    setConnectionState(reason);
  }

  function handleRemoteCandidate(iceCandidate) {
    iceCandidate = new RTCIceCandidate(iceCandidate);

    // Sometimes candidates will be received before remoteDescription is set.
    // In this case they are added to the remoteCandidates array.
    if (peerConnection.remoteDescription == null) {
      console.log('candidate added to array, isRoom: ' + isRoom)
      return remoteCandidates.push(iceCandidate);
    }

    console.log('candidate added directly, isRoom: ' + isRoom)
    return peerConnection.addIceCandidate(iceCandidate);
  }

  // Process candidates that couldn't be processed in handleRemoteCandidate.
  function processCandidates() {
    if (remoteCandidates.length < 1) return;
    console.log('candidates added from array, isRoom: ' + isRoom)

    remoteCandidates.map(candidate =>
      peerConnection.addIceCandidate(candidate),
    );

    remoteCandidates = [];
  }

  return [ ws, connectToServer ];
}

export default useSignalingServer;