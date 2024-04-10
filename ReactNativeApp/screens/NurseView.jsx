// NurseView.jsx

import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet, Button, Dimensions, Animated, Pressable, Image } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useTranslation } from 'react-i18next'; // Import useTranslation hook
import { useNavigation } from '@react-navigation/native';
import useConnection from "../components/useConnection";

const NurseView = ({roomCode}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const navigation = useNavigation();

  const [remoteStream, localStream, connectToServer, closePeerConnection] = useConnection(false);

  const [position, setPosition] = useState({
    x: windowWidth / 2 - 60, // Half the local stream width
    y: windowHeight / 2 - 80, // Half the local stream height
  });

  useEffect(() => {
    connectToServer(roomCode);
  }, []);

  const handleCallCustomer = () => {
    // Your implementation to initiate a call to the customer
    closePeerConnection();
    console.log('button pushed');
  }

  return (
    <View style={styles.container}>
      <View>
          <Pressable delayLongPress={3000} onLongPress={() => {
              navigation.navigate('RoomNumber')
          }}>
              <Image source={require("../assets/Benete-blue.png")} />
          </Pressable>
      </View>
      <View style={styles.remoteStreamContainer}>
        <View style={styles.cameraContainer}>
          {remoteStream && (
            <RTCView
              style={styles.remoteStream}
              streamURL={remoteStream.toURL()}
            />
          )}
        </View>
      </View>
      <View style={styles.localStreamContainer}>
        {localStream && (
          <RTCView
            style={styles.localStream}
            streamURL={localStream.toURL()}
          />
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={t("call_customer_button")}
          onPress={handleCallCustomer}
          color="red"
          style={styles.button}
        />
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  remoteStreamContainer: {
    flex: 1,
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    aspectRatio: 16 / 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteStream: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // Adjust this value to position the Call button vertically
  },
  buttonContainer: {
    marginBottom: 20,

    // Adjust this value to position the Call button vertically
  },
  localStreamContainer: {
    position: 'absolute',
    bottom: 60,
    right: -5, // Adjust this value to position the local stream container horizontally
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5, // Add elevation to ensure it's displayed on top
  },
  localStream: {
    width: '100%',
    height: '100%',
  },
  button: {
    borderRadius: 20, // Adjust the value to control the roundness of the corners
  },
});

export default NurseView;