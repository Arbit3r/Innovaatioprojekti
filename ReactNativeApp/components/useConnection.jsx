import { useEffect, useState, useRef } from 'react';
import {
  MediaStream,
  RTCPeerConnection,
} from 'react-native-webrtc';
import useSignalingServer from './useSignalingServer';
import useMediaStream from './useMediaStream';

const useConnection = (isRoom) => {
  const [roomCode, setRoomCode] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState(null);
  const [ws, setupSignalingServer] = useSignalingServer(isRoom);

  const localMediaStream = useMediaStream();
  const serverAddress = useRef('ws://10.0.2.2:8080').current;
  let remoteMediaStreamBuffer = useRef(new MediaStream()).current;
  let makingOffer = useRef(false).current;

  let peerConstraints = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      }
    ]
  }

  function connectToServer(_roomCode) {
    setPeerConnection(new RTCPeerConnection(peerConstraints));
    setRoomCode(_roomCode);
  }

  useEffect(() => {
    if (!roomCode || !peerConnection) return;
    setupSignalingServer(serverAddress, peerConnection, roomCode);
  }, [roomCode, peerConnection])

  useEffect(() => {
    if (!localMediaStream || !ws) return;
    setupPeerConnection();
  }, [localMediaStream, ws])

  function closePeerConnection() {
    peerConnection.close();
  }

  function setupPeerConnection() {
    peerConnection.addEventListener('connectionstatechange', event => {handleConnectionStateChange(event)});
    peerConnection.addEventListener('icecandidate', event => {handleIceCandidate(event)});
    peerConnection.addEventListener('icecandidateerror', event => {handleIceCandidateError(event)});
    peerConnection.addEventListener('iceconnectionstatechange', event => {handleIceConnectionStateChange(event)});
    peerConnection.addEventListener('negotiationneeded', async event => {await handleNegotiationNeeded(event)});
    peerConnection.addEventListener('signalingstatechange', event => {handleSignalingStateChange(event)});
    peerConnection.addEventListener('track', event => {handleTrack(event)});

    // Add our stream to the peer connection.
    localMediaStream.getTracks().forEach(track =>
        peerConnection.addTrack( track, localMediaStream )
    );
  }

  function handleConnectionStateChange() {
    console.log('Connection state changed: ' + peerConnection.connectionState + ', isRoom: ' + isRoom);
    if (peerConnection.connectionState === 'closed' ||
      peerConnection.connectionState === 'disconnected' ||
      peerConnection.connectionState === 'failed') {
      if (!isRoom) return;

      const message = {
        type: 'callEnded',
        roomCode: roomCode,
      }
      ws.send(JSON.stringify(message));

      setPeerConnection(new RTCPeerConnection(peerConstraints));
    }
  }

  function handleIceCandidate(event) {
    // When a null candidate is found, there are no more candidates.
    // Gathering of candidates has finished.
    if (!event.candidate) return;

    // Keeping to Trickle ICE Standards, the candidates are sent immediately.
    const candidate = {
      type: 'candidate',
      roomCode: roomCode,
      isRoom: !isRoom,
      candidate: event.candidate,
    };
    ws.send(JSON.stringify(candidate));
    console.log('ICE candidate sent, isRoom: ' + isRoom);
  }

  function handleIceCandidateError(event) {
    console.log('ICE candidate error');
  }

  function handleIceConnectionStateChange(event) {
    switch (peerConnection.iceConnectionState) {
      case 'connected':
        console.log('ICE connection state: connected');
        break;
      case 'completed':
        console.log('ICE connection state: completed');
        if (!isRoom) ws.close(1000, 'Connected to room');
        break;
    }
  }

  async function handleNegotiationNeeded(event) {
    if (isRoom || makingOffer) return;

    try {
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

  function handleSignalingStateChange(event) {
    console.log('Signaling state changed: ' + peerConnection.signalingState + ', isRoom: ' + isRoom);
    switch (peerConnection.signalingState) {
      case 'closed':
        // You can handle the call being disconnected here.
        break;
    }
  }

  function handleTrack(event) {
    // Grab the remote track from the connected participant.
    remoteMediaStreamBuffer.addTrack(event.track);
    console.log('Tracks:' + remoteMediaStreamBuffer.getTracks().length);
    if (remoteMediaStreamBuffer.getTracks().length === 2) {
      setRemoteMediaStream(remoteMediaStreamBuffer);
    }
  }

  return [ remoteMediaStream, localMediaStream, connectToServer, closePeerConnection ];
}

export default useConnection;