import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Dimensions,
  Animated,
  Pressable,
  ActivityIndicator,
  Image,
  BackHandler,
  Appearance
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useTranslation } from 'react-i18next'; // Import useTranslation hook
import { useNavigation } from '@react-navigation/native';
import useConnection from "../components/useConnection";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NurseView = ({roomCode}) => {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const navigation = useNavigation();

  const [userData, setUserData] = useState({});
  const [remoteStream, localStream, connectionState, startConnection, closeConnection] = useConnection(false);

  const error = false // temporary variable for connection error

  const [position, setPosition] = useState({
    x: windowWidth / 2 - 60, // Half the local stream width
    y: windowHeight / 2 - 80, // Half the local stream height
  });

  const [isDarkMode, setIsDarkMode] = useState(
    Appearance.getColorScheme() === 'dark'
  );

  useEffect(() => {
    const fetchDataFromStorage = async () => {
      try {
        const data = await AsyncStorage.getItem('@userData');
        if (data !== null) {
          setUserData(JSON.parse(data));
        }
      } catch (error) {
        console.error('Error fetching data from storage:', error);
      }
    };

    fetchDataFromStorage();
  }, []);

  useEffect(() => {
    if (!userData.roomNumber || !userData.ipAddress) return;
    startConnection(userData.roomNumber, userData.ipAddress);
  }, [userData.roomNumber, userData.ipAddress]);

  const handleDisconnect = () => {
    // Your implementation to initiate a call to the customer
    closeConnection();
  }

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={[styles.background, { backgroundColor: isDarkMode ? '#262626' : '#fff' }]}>
    <View style={styles.container}>
      <View>
          <Pressable delayLongPress={3000} onLongPress={() => {
            closeConnection()
            navigation.navigate('RoomNumber')
          }}>
            <Image source={require("../assets/Benete-blue.png")} />
          </Pressable>
      </View>
      <View style={styles.remoteStreamContainer}>
        {!remoteStream && !error && (
          <View>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.bufferingText}>Loading...</Text>
          </View>
        )}
        {connectionState === 'server connection failed' && (
          <Text style={styles.errorText}>⚠️ Connection failed</Text>
        )}
        {remoteStream && (
          <View style={styles.cameraContainer}>
            {remoteStream && (
              <RTCView
                style={styles.remoteStream}
                streamURL={remoteStream.toURL()}
              />
            )}
          </View>
        )}
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
          title={t("disconnect_button")}
          onPress={handleDisconnect}
          color="red"
          style={styles.button}
        />
      </View>
    </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  bufferingText: {
    color: 'white',
  },
  errorText: {
    color: 'orange',
    fontSize: 20,
    position: 'absolute',
    top: 60,
    textAlign: 'center',
  },
  background: {
    width: "100%",
    height: "100%"
  }
});

export default NurseView;