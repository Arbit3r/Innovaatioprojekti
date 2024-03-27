import React, { useEffect, useState, useRef } from 'react';
import {
  mediaDevices,
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import useSignalingServer from './useSignalingServer';
import useMediaStream from './useMediaStream';
import {StyleSheet, Text, View} from "react-native";

const Connection = ({ roomCode, isRoom }) => {
  const localMediaStream = useMediaStream();
  const [remoteMediaStream, setRemoteMediaStream] = useState(null);
  let tempMediaStream = useRef(new MediaStream()).current;

  let peerConstraints = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      }
    ]
  }

  let peerConnection = useRef(new RTCPeerConnection(peerConstraints)).current;
  const ws = useSignalingServer({ roomCode, isRoom, peerConnection });
  let tracks = useRef([]).current;
  let makingOffer = useRef(false).current;
  let addingTrack = useRef(false).current;

  useEffect(() => {
    if (!localMediaStream) return;
    setupPeerConnection();
  }, [localMediaStream])

  useEffect(() => {
    if (!remoteMediaStream || tracks.length < 1) return;

    tracks.forEach((track) => {
      tempMediaStream.addTrack(track, tempMediaStream);
      console.log(track.kind + ' track added to remoteMediaStream from array, isRoom: ' + isRoom);
    });

    if (tempMediaStream.getTracks().length === 2) {
      setRemoteMediaStream(tempMediaStream);
    }

    tracks = [];
  }, [remoteMediaStream])

  function closePeerConnection() {
    peerConnection.close();
  }

  function setupPeerConnection() {
    peerConnection.addEventListener('connectionstatechange', event => {
      console.log('Connection state changed: ' + peerConnection.connectionState + ', isRoom: ' + isRoom);
      if (peerConnection.connectionState === 'closed' ||
          peerConnection.connectionState === 'disconnected' ||
          peerConnection.connectionState === 'failed') {
        if (!isRoom) return;

        peerConnection = new RTCPeerConnection(peerConstraints);
        setupPeerConnection();

        const message = {
          type: 'callEnded',
          roomCode: roomCode,
        }
        ws.send(JSON.stringify(message));
      }
    });

    peerConnection.addEventListener('icecandidate', event => {
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
    });

    peerConnection.addEventListener('icecandidateerror', event => {
      console.log('ICE candidate error');
    });

    peerConnection.addEventListener('iceconnectionstatechange', event => {
      switch (peerConnection.iceConnectionState) {
        case 'connected':
          console.log('ICE connection state: connected');
          break;
        case 'completed':
          console.log('ICE connection state: completed');
          if (!isRoom) ws.close(1000, 'Connected to room');
          break;
      }
    });

    peerConnection.addEventListener('negotiationneeded', async event => {
      if (isRoom) return;
      await sendOffer();
    });

    peerConnection.addEventListener('signalingstatechange', event => {
      console.log('Signaling state changed: ' + peerConnection.signalingState + ', isRoom: ' + isRoom);
      switch (peerConnection.signalingState) {
        case 'closed':
          // You can handle the call being disconnected here.
          break;
      }
    });

    peerConnection.addEventListener('track', event => {
      // Grab the remote track from the connected participant.
      setRemoteMediaStream(remoteMediaStream || new MediaStream());
      if (!remoteMediaStream) {
        console.log(event.track.kind + ' track added to array, isRoom: ' + isRoom);
        tracks.push(event.track); // If the remote stream was null, these tracks will be added later.
      } else {
        console.log(event.track.kind + ' track added to remoteMediaStream directly, isRoom: ' + isRoom);
        tempMediaStream.addTrack(event.track, tempMediaStream);
        if (tempMediaStream.getTracks().length === 2) {
          setRemoteMediaStream(tempMediaStream);
        }
      }
    });

    // Add our stream to the peer connection.
    localMediaStream.getTracks().forEach(track =>
        peerConnection.addTrack( track, localMediaStream )
    );
  }

  async function sendOffer() {
    if (makingOffer) {
      return;
    }

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

  return remoteMediaStream;
}

const styles = StyleSheet.create({
  body: {
    flex: 1
  },
  stream: {
    flex: 1
  },
});

export default Connection;