import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Image,
  Appearance,
  Linking
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
  const [remoteStream, localStream, connectionState, startConnection, closeConnection, toggleVideo ] = useConnection(false);

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
    Linking.openURL('senderapp://open');
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
      <View style={styles.logoContainer}>
          <Pressable delayLongPress={3000} onLongPress={() => {
            closeConnection()
            navigation.navigate('RoomNumber')
          }}>
            <Image source={require("../assets/Benete-blue.png")} />
          </Pressable>
      </View>
      <View style={styles.remoteStreamContainer}>
        {connectionState === 'calling' && (
          <View>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.bufferingText}>{t("calling")}</Text>
          </View>
        )}
        {connectionState === 'server connection failed' && (
          <Text style={styles.errorText}>⚠️ {t("server_connection_failed")}</Text>
        )}
        {connectionState === 'room not found' && (
          <Text style={styles.errorText}>⚠️ {t("room_not_found")}</Text>
        )}
        {connectionState === 'room in use' && (
          <Text style={styles.errorText}>⚠️ {t("room_in_use")}</Text>
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
        {connectionState === 'closed' && (
          <Text style={styles.connectionClosedText}>{t("connection_closed")}</Text>
        )}
      </View>
     <View style={styles.localStreamContainer}>
       <View style={styles.localStreamWrapper}>
         {localStream && (
           <RTCView
             style={styles.localStream}
             streamURL={localStream.toURL()}
           />
         )}
       </View>
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
    right: 15,
    width: 92,
    height: 160,
    overflow: 'hidden',
    elevation: 5,
  },
  localStreamWrapper: {
    borderRadius: 20, // Adjust the value as needed
     overflow: 'hidden',
      borderWidth: 2, // Adjust the border width as needed
      borderColor: '#660EDE',
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
  },
  logoContainer: {
    padding: 8,
    left: -150,  
  },
  connectionClosedText: {
    color: 'red',
    fontSize: 18,
    alignItems: 'center',
    justifyContent: 'center',
  }

});

export default NurseView;