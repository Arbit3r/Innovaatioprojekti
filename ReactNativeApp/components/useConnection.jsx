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
  const [serverAddress, setServerAddress] = useState(null);

  const [connectionState, _setConnectionState] = useState('not started');
  const connectionStateRef = useRef(connectionState); // React states cannot be used inside event listeners, this Ref will be used inside those instead
  // Whenever connectionState is updated, update the Ref as well
  const setConnectionState = data => {
    connectionStateRef.current = data;
    _setConnectionState(data)
  }
  const [ws, setupSignalingServer] = useSignalingServer(isRoom, setConnectionState);

  const localMediaStream = useMediaStream();
  const [remoteMediaStreamBuffer, setRemoteMediaStreamBuffer] = useState(null);

  let peerConstraints = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      }
    ]
  }

  useEffect(() => {
    console.log('connection state variable: ' + connectionState + ', isRoom: ' + isRoom);
  }, [connectionState])

  function startConnection(roomCode_, serverAddress_) {
    setConnectionState('starting');
    setRemoteMediaStream(null);
    setRemoteMediaStreamBuffer(new MediaStream());
    setRoomCode(roomCode_);
    setServerAddress(serverAddress_);
  }

  useEffect(() => {
    if (connectionState !== 'starting' || !roomCode || !serverAddress || !remoteMediaStreamBuffer || remoteMediaStream) return;
    setPeerConnection(new RTCPeerConnection(peerConstraints));
  }, [roomCode, serverAddress, connectionState, remoteMediaStreamBuffer, remoteMediaStream])

  useEffect(() => {
    if (connectionState !== 'starting' || !peerConnection) return;
    setupSignalingServer(serverAddress, peerConnection, roomCode);
  }, [peerConnection, connectionState])

  useEffect(() => {
    if (connectionState !== 'connected' || !localMediaStream || !ws || !peerConnection) return;
    setupPeerConnection();
    //setConnectionState('connected');
  }, [localMediaStream, ws, peerConnection, connectionState])

  function closeConnection() {
    closeWebSocket();
    closePeerConnection();
  }

  function closeWebSocket() {
    if (!ws) return;
    ws.close(1000, 'closeWebSocket function called');
  }

  function closePeerConnection() {
    if (!peerConnection) return;
    console.log('closePeerConnection function called');
    peerConnection.close();
    setPeerConnection(null);
  }

  /*useEffect(() => {
    if (connectionState !== 'restarting' || peerConnection || ws) return;
    startConnection(roomCode, serverAddress);
  }, [connectionState, peerConnection, ws]);*/

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
    if (connectionStateRef.current === 'in call' &&
      (peerConnection.connectionState === 'closed' ||
      peerConnection.connectionState === 'disconnected' ||
      peerConnection.connectionState === 'failed')) {
      if (!isRoom) return;

      setConnectionState('restarting');
    }
  }

  function handleIceCandidate(event) {
    // When a null candidate is found, there are no more candidates.
    // Gathering of candidates has finished.
    if (!event.candidate) return;

    // Keeping to Trickle ICE Standards, the candidates are sent immediately.
    try {
      const candidate = {
        type: 'candidate',
        roomCode: roomCode,
        isRoom: !isRoom,
        candidate: event.candidate,
      };
      ws.send(JSON.stringify(candidate));
      console.log('ICE candidate sent, isRoom: ' + isRoom);
    } catch (e) {
      console.log('failed to send candidate: ' + e);
    }

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
        //if (!isRoom) ws.close(1000, 'Connected to room');
        break;
    }
  }

  async function handleNegotiationNeeded(event) {
    if (isRoom) return;

    try {
      const request = {
        type: 'call request',
        roomCode: roomCode,
        isRoom: !isRoom,
      }

      ws.send(JSON.stringify(request));
      console.log('call request sent, isRoom: ' + isRoom);
    } catch (e) {
      console.log('error while sending call request: ' + e);
    }

    /*try {
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
    }*/
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
    console.log('Tracks:' + remoteMediaStreamBuffer.getTracks().length + ' isRoom: ' + isRoom);
    if (remoteMediaStreamBuffer.getTracks().length === 2) {
      setRemoteMediaStream(remoteMediaStreamBuffer);
    }
  }

  return [ remoteMediaStream, localMediaStream, connectionState, startConnection, closeConnection ];
}

export default useConnection;