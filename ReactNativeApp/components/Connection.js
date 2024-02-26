import {
  mediaDevices,
  MediaStream,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';

export default class Connection {
  mediaConstraints = {
    audio: true,
    video: {
      framerate: 30,
      facingMode: 'user',
    },
  };
  localMediaStream;
  remoteMediaStream;
  isVoiceOnly = false;

  peerConstraints = {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  };
  remoteCandidates = [];
  peerConnection = new RTCPeerConnection(this.peerConstraints);
  makingOffer = false;

  ws = new WebSocket('wss://echo.websocket.org'); // Signaling server address goes here

  constructor(roomCode, isUser) {
    this.initLocalMediaStream().then(r => this.initPeerConnection());
    this.initWebSocket(roomCode, isUser);
  }
  async initLocalMediaStream() {
    try {
      const mediaStream = await mediaDevices.getUserMedia(
        this.mediaConstraints,
      );
      if (this.isVoiceOnly) {
        let videoTrack = await mediaStream.getVideoTracks()[0];
        videoTrack.enabled = false;
      }
      this.localMediaStream = mediaStream;
    } catch (e) {
      console.log(e);
    }
  }

  initPeerConnection() {
    this.peerConnection.addEventListener('connectionstatechange', event => {
      switch (this.peerConnection.connectionState) {
        case 'closed':
          // You can handle the call being disconnected here.
          break;
      }
    });

    this.peerConnection.addEventListener('icecandidate', event => {
      // When you find a null candidate then there are no more candidates.
      // Gathering of candidates has finished.
      if (!event.candidate) {
        return;
      }
      // Send the event.candidate onto the person you're calling.
      // Keeping to Trickle ICE Standards, you should send the candidates immediately.
      const candidate = {
        type: 'candidate',
        candidate: event.candidate,
      };
      this.ws.send(JSON.stringify(candidate));
    });

    this.peerConnection.addEventListener('icecandidateerror', event => {
      // You can ignore some candidate errors.
      // Connections can still be made even when errors occur.
    });

    this.peerConnection.addEventListener('iceconnectionstatechange', event => {
      switch (this.peerConnection.iceConnectionState) {
        case 'connected':
        case 'completed':
          // You can handle the call being connected here.
          // Like setting the video streams to visible.
          break;
      }
    });

    this.peerConnection.addEventListener('negotiationneeded', async event => {
      // You can start the offer stages here.
      // Be careful as this event can be called multiple times.
      if (this.makingOffer === true) {
        return;
      }

      try {
        this.makingOffer = true;

        let sessionConstraints = {
          mandatory: {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true,
            VoiceActivityDetection: true,
          },
        };

        const offerDescription = await this.peerConnection.createOffer(
          sessionConstraints,
        );

        await this.peerConnection.setLocalDescription(offerDescription);

        const offer = {
          type: 'offer',
          description: this.peerConnection.localDescription,
        };
        this.ws.send(JSON.stringify(offer));
      } catch (e) {
        console.log('Error at "negotiationneeded":' + e);
      } finally {
        this.makingOffer = false;
      }
    });

    this.peerConnection.addEventListener('signalingstatechange', event => {
      switch (this.peerConnection.signalingState) {
        case 'closed':
          // You can handle the call being disconnected here.
          break;
      }
    });

    this.peerConnection.addEventListener('track', event => {
      // Grab the remote track from the connected participant.
      this.remoteMediaStream = this.remoteMediaStream || new MediaStream();
      this.remoteMediaStream.addTrack(event.track, this.remoteMediaStream);
    });

    // Add our stream to the peer connection.
    this.localMediaStream
      .getTracks()
      .forEach(track =>
        this.peerConnection.addTrack(track, this.localMediaStream),
      );
  }

  initWebSocket(roomCode, isUser) {
    this.ws.onopen = () => {
      const request = {
        roomCode: roomCode,
        isUser: isUser, // Boolean that specifies if the request is coming from a user or a room
      };
      this.ws.send(JSON.stringify(request));
    };

    this.ws.onmessage = async message => {
      switch (message.type) {
        case 'offer':
          try {
            const offerDescription = new RTCSessionDescription(
              message.description,
            );
            await this.peerConnection.setRemoteDescription(offerDescription);

            const answerDescription = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answerDescription);

            this.processCandidates();

            const answer = {
              type: 'answer',
              description: this.peerConnection.localDescription,
            };
            this.ws.send(JSON.stringify(answer));
          } catch (e) {
            console.log('Failed to process offer:' + e);
          }
          break;

        case 'answer':
          try {
            const answerDescription = new RTCSessionDescription(
              message.description,
            );
            await this.peerConnection.setRemoteDescription(answerDescription);
          } catch (e) {
            console.log('Failed to process answer:' + e);
          }
          break;

        case 'candidate':
          this.handleRemoteCandidate(message.candidate);
          break;

        default:
          break;
      }
    };

    this.ws.onerror = error => {
      console.log('Error:', error.message);
    };

    this.ws.onclose = event => {
      console.log('Connection closed');
      console.log('Code:', event.code);
      console.log('Reason:', event.reason);
    };
  }

  handleRemoteCandidate(iceCandidate) {
    iceCandidate = new RTCIceCandidate(iceCandidate);

    if (this.peerConnection.remoteDescription == null) {
      return this.remoteCandidates.push(iceCandidate);
    }

    return this.peerConnection.addIceCandidate(iceCandidate);
  }

  // Process candidates that couldn't be processed in handleRemoteCandidate.
  processCandidates() {
    if (this.remoteCandidates.length < 1) {
      return;
    }

    this.remoteCandidates.map(candidate =>
      this.peerConnection.addIceCandidate(candidate),
    );

    this.remoteCandidates = [];
  }
}
