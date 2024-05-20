import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet, Appearance} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import {RTCView} from "react-native-webrtc";
import useConnection from "../components/useConnection";

const Main = () => {
    const navigation = useNavigation();
    const [userData, setUserData] = useState({});
    const { t } = useTranslation();
    const [remoteStream, localStream, connectionState, startConnection, closeConnection] = useConnection(true);

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

    useEffect(() => {
        if (connectionState === 'restarting') {
            closeConnection();
            navigation.replace('Main');
        }
    }, [connectionState])

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
          setIsDarkMode(colorScheme === 'dark');
        });
    
        return () => {
          subscription.remove();
        };
      }, []);

   // Determine the role text based on the user's role
   const getRoleText = () => {
       if (userData.role === 'Nurse') {
           return t('nurse');
       } else {
           return '';
       }
   };

  return (
      <>
          <View style={[styles.background, { backgroundColor: isDarkMode ? '#262626' : '#fff' }]}>
              <View>
                  <View style={styles.container}>
                      <Pressable delayLongPress={3000} onLongPress={() => {
                          closeConnection();
                          navigation.navigate('RoomNumber')
                      }}>
                          <Image source={require("../assets/Benete-blue.png")} />
                      </Pressable>
                      <Text style={styles.screenTitle}>{userData.roomNumber}</Text>
                  </View>
                  <Text style={styles.roleText}>{getRoleText()}</Text>
              </View>
              <View style={styles.body}>
                  {connectionState === 'server connection failed' && (
                      <Text style={styles.errorText}>⚠️ {t("server_connection_failed")}</Text>
                  )}
                  {connectionState === 'room already exists' && (
                      <Text style={styles.errorText}>⚠️ {t("room_already_exists")}</Text>
                  )}

                     {remoteStream && (
                         <>
                             <View style={styles.remoteStreamWrapper}>
                                 <RTCView
                                     streamURL={remoteStream.toURL()} // Display the remote stream here
                                     style={styles.remoteStream}
                                 />
                             </View>
                         </>
                     )}
              </View>
          </View>
      </>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
      fontSize: 24,
      fontWeight: 'bold',

  },

  remoteStreamWrapper: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: 30,
  },

  border: {
     borderWidth: 2,
     borderColor: '#660EDE',
     borderRadius: 20, // Adjust the value as needed
     overflow: 'hidden',
  },

  remoteStream: {
      width: '120%',
      height: '100%',
  },

  roleText: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
  },

  content: {
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 300,
  },

  container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      margin: 7,
  },

  body: {
      flex: 1,
  },

  stream: {
      flex: 1,
  },

  errorText: {
      color: 'orange',
      fontSize: 20,
      position: 'absolute',
      top: 30,
      right: 90,
      textAlign: 'center',
  },

  background: {
      width: "100%",
      height: "100%",
      zIndex: 1,
  }
});

export default Main;
