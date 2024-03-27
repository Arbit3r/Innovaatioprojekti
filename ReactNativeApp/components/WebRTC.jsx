import Connection from './Connection'
import {StyleSheet, View} from "react-native";
import {RTCView} from "react-native-webrtc";
import {useEffect} from "react";

const WebRTC = ({ roomCode, isRoom }) => {
  let remoteMediaStream = Connection({ roomCode, isRoom } );

  return (
    <View style={styles.body}>
      {
        remoteMediaStream &&
        <RTCView
          streamURL={remoteMediaStream.toURL()}
          style={styles.stream} />
      }
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1
  },
  stream: {
    flex: 1
  },
});

export default WebRTC;