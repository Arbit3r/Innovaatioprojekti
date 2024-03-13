import React, { useEffect, useState, useRef } from 'react';
import {
  mediaDevices,
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
} from 'react-native-webrtc';
import {View, StyleSheet} from 'react-native';

const Connection = ({ roomCode, isRoom }) => {
  const [localMediaStream, setLocalMediaStream] = useState(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState(null);
  let mediaConstraints = {
    audio: true,
    video: {
      framerate: 30,
      facingMode: 'user',
    },
  };

  let peerConstraints = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      }
    ]
  }

  const peerConnection = useRef(new RTCPeerConnection(peerConstraints)).current;
  let isVoiceOnly = false;
  let remoteCandidates = useRef([]).current;
  let tracks = useRef([]).current;
  let makingOffer = false;
  let ws = useRef(new WebSocket('ws://10.0.2.2:8080')).current;

  useEffect(() => {
    initWebSocket();
    initLocalMediaStream();
  }, [])

  useEffect(() => {
    if (!localMediaStream) return;
    initPeerConnection();
  }, [localMediaStream])

  useEffect(() => {
    if (!remoteMediaStream) {
      console.log('remoteMediaStream is null');
      return;
    }

    if (tracks.length < 1) {
      console.log('No tracks in array');
      return;
    }

    tracks.map(track =>
      remoteMediaStream.addTrack(track, remoteMediaStream),
    );
    console.log('Tracks added to remoteMediaStream, isRoom: ' + isRoom);

    tracks = [];

    remoteMediaStream.getTracks().forEach(track =>
      console.log(track),
    );
  }, [remoteMediaStream])

  async function initLocalMediaStream() {
    try {
      const mediaStream = await mediaDevices.getUserMedia(mediaConstraints);
      if (isVoiceOnly) {
        let videoTrack = await mediaStream.getVideoTracks()[0];
        videoTrack.enabled = false;
      }
      setLocalMediaStream(mediaStream);
      console.log('localMediaStream initialized');
    } catch (e) {
      console.log(e);
    }
  }

  function initPeerConnection() {
    peerConnection.addEventListener('connectionstatechange', event => {
      console.log('Connection state changed: ' + peerConnection.connectionState + ', isRoom: ' + isRoom);
      switch (peerConnection.connectionState) {
        case 'closed':
          // You can handle the call being disconnected here.
          console.log('Connection state: closed');
          break;
      }
    });

    peerConnection.addEventListener('icecandidate', event => {
      // When you find a null candidate then there are no more candidates.
      // Gathering of candidates has finished.
      if (!event.candidate) {
        return;
      }
      // Send the event.candidate onto the person you're calling.
      // Keeping to Trickle ICE Standards, you should send the candidates immediately.
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
      // You can ignore some candidate errors.
      // Connections can still be made even when errors occur.
      console.log('ICE candidate error');
    });

    peerConnection.addEventListener('iceconnectionstatechange', event => {
      switch (peerConnection.iceConnectionState) {
        case 'connected':
          console.log('ICE connection state: connected');
        case 'completed':
          // You can handle the call being connected here.
          // Like setting the video streams to visible.
          console.log('ICE connection state: completed');
          break;
      }
    });

    peerConnection.addEventListener('negotiationneeded', async event => {
      // You can start the offer stages here.
      // Be careful as this event can be called multiple times.
      if (isRoom) {
        return;
      }

      if (makingOffer) {
        console.log('Tried to send offer twice');
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
        console.log('Error at "negotiationneeded":' + e);
      } finally {
        makingOffer = false;
      }
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
        console.log('Track added to array');
        tracks.push(event.track);
      } else {
        console.log('Tracks added to remoteMediaStream, isRoom: ' + isRoom);
        remoteMediaStream.addTrack(event.track, remoteMediaStream);
      }
    });

    // Add our stream to the peer connection.
    localMediaStream
      .getTracks()
      .forEach(track =>
        peerConnection.addTrack(track, localMediaStream)
      );
  }

  function initWebSocket() {
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
            if (makingOffer || peerConnection.signalingState !== 'stable') return;

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
  }

  function handleRemoteCandidate(iceCandidate) {
    iceCandidate = new RTCIceCandidate(iceCandidate);

    if (peerConnection.remoteDescription == null) {
      return remoteCandidates.push(iceCandidate);
    }

    return peerConnection.addIceCandidate(iceCandidate);
  }

  // Process candidates that couldn't be processed in handleRemoteCandidate.
  function processCandidates() {
    if (remoteCandidates.length < 1) {
      return;
    }

    remoteCandidates.map(candidate =>
      peerConnection.addIceCandidate(candidate),
    );

    remoteCandidates = [];
  }

  return (
      <View style={styles.body}>
        {
          localMediaStream &&
          <RTCView
            streamURL={localMediaStream.toURL()}
            style={styles.stream} />
        }
      </View>
  );
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