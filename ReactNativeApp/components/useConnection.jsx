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
  const [remoteMediaStreamBuffer, setRemoteMediaStreamBuffer] = useState(new MediaStream());
  const [serverAddress, setServerAddress] = useState(null);

  const [connectionState, _setConnectionState] = useState();
  const connectionStateRef = useRef(connectionState); // React states can't be read properly inside of event listeners, this ref will be used instead
  // Whenever connectionState is updated, update the Ref as well
  const setConnectionState = data => {
    _setConnectionState(data);
    connectionStateRef.current = data;
  }

  const [videoEnabled, _setVideoEnabled] = useState(false);
  const videoEnabledRef = useRef(false);
  const setVideoEnabled = data => {
    _setVideoEnabled(data);
    videoEnabledRef.current = data;
  }

  const [ws, connectToServer] = useSignalingServer(isRoom, setConnectionState, videoEnabledRef, setVideoEnabled);
  const localMediaStream = useMediaStream();

  let peerConstraints = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      }
    ]
  }

  useEffect(() => {
    console.log('connection state variable: ' + connectionState);
  }, [connectionState])

  function startConnection(roomCode_, serverAddress_) {
    setConnectionState('setting up');
    setPeerConnection(new RTCPeerConnection(peerConstraints));
    setRoomCode(roomCode_);
    setServerAddress(serverAddress_);
  }

  // Runs after all the assignments in startConnection() are complete
  useEffect(() => {
    if (connectionState !== 'setting up' || !peerConnection || !serverAddress || !roomCode) return;
    connectToServer(serverAddress, peerConnection, roomCode);
  }, [connectionState, peerConnection, serverAddress, roomCode])

  // Runs after server connection is complete and the localMediaStream has been created
  useEffect(() => {
    if (connectionState !== 'connected to server' || !localMediaStream) return;
    setupPeerConnection();
  }, [connectionState, localMediaStream])

  function toggleVideo() {
    if (!remoteMediaStream) return;

    try {
      const request = {
        type: 'toggleRemoteVideo',
        roomCode: roomCode,
        isRoom: !isRoom
      }

      ws.send(JSON.stringify(request));
      console.log('toggle video request sent');
    } catch(e) {
      console.log('failed to send toggle video request: ' + e);
    }

    setVideoEnabled(!videoEnabled)
  }

  useEffect(() => {
    if (!remoteMediaStream) return;

    let videoTrack = remoteMediaStream.getVideoTracks()[0];
    videoTrack.enabled = videoEnabled;
  }, [videoEnabled]);

  function closeConnection() {
    setConnectionState('closed');
    setRemoteMediaStream(null);
    closeWebSocket();
    closePeerConnection();
  }

  function closeWebSocket() {
    if (!ws) return;
    ws.close(1000, 'closeWebSocket function called');
  }

  function closePeerConnection() {
    if (!peerConnection) return;

    peerConnection.close();
    setPeerConnection(null);
  }

  function setupPeerConnection() {
    peerConnection.addEventListener('connectionstatechange', event => {handleConnectionStateChange(event)});
    peerConnection.addEventListener('icecandidate', event => {handleIceCandidate(event)});
    peerConnection.addEventListener('icecandidateerror', event => {handleIceCandidateError(event)});
    peerConnection.addEventListener('iceconnectionstatechange', event => {handleIceConnectionStateChange(event)});
    peerConnection.addEventListener('negotiationneeded', async event => {await handleNegotiationNeeded(event)});
    peerConnection.addEventListener('track', event => {handleTrack(event)});

    // Add our stream to the peer connection.
    localMediaStream.getTracks().forEach(track =>
        peerConnection.addTrack( track, localMediaStream )
    );
  }

  function handleConnectionStateChange() {
    console.log('Connection state changed: ' + peerConnection.connectionState + ', isRoom: ' + isRoom);
    // If role is room and the nurse ends the call, restart.
    if (!isRoom) return;
    if (peerConnection.connectionState !== 'closed' && peerConnection.connectionState !== 'disconnected' && peerConnection.connectionState !== 'failed') return;
    if (connectionStateRef.current !== 'calling' && connectionStateRef.current !== 'in call') return;

    setConnectionState('restarting');
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
        setConnectionState('in call');
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
  }

  function handleTrack(event) {
    // Grab the remote track from the connected participant.
    remoteMediaStreamBuffer.addTrack(event.track);
    console.log('Tracks:' + remoteMediaStreamBuffer.getTracks().length + ' isRoom: ' + isRoom);
    if (remoteMediaStreamBuffer.getTracks().length === 2) {
      let videoTrack = remoteMediaStreamBuffer.getVideoTracks()[0];
      videoTrack.enabled = false;
      setRemoteMediaStream(remoteMediaStreamBuffer);
    }
  }

  return [ remoteMediaStream, localMediaStream, connectionState, startConnection, closeConnection, toggleVideo ];
}

export default useConnection;