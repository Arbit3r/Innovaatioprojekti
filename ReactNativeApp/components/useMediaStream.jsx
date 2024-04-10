import {mediaDevices, MediaStream} from "react-native-webrtc";
import {useEffect, useState} from "react";

const useMediaStream = () => {
  const [localMediaStream, setLocalMediaStream] = useState(null);
  let mediaConstraints = {
    audio: true,
    video: {
      framerate: 30,
      facingMode: 'user',
    },
  };
  let isVoiceOnly = false;

  async function setupLocalMediaStream() {
    try {
      const mediaStream = await mediaDevices.getUserMedia(mediaConstraints);
      if (isVoiceOnly) {
        let videoTrack = mediaStream.getVideoTracks()[0];
        videoTrack.enabled = false;
      }
      setLocalMediaStream(mediaStream);
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    setupLocalMediaStream();
  }, []);

  return localMediaStream;
}

export default useMediaStream;