import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  TouchableOpacity,
  Modal,
  Button,
  Linking,
} from 'react-native';

import { Colors } from 'react-native/Libraries/NewAppScreen';
import RoomNumber from './screens/RoomNumber';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Main from "./screens/Main"
import NurseView from "./screens/NurseView";
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from './services/i18next';
import { Alert } from 'react-native';
const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [deepLinkData, setDeepLinkData] = useState(null);
  const [initialRouteName, setInitialRouteName] = useState(null); 
  const [roomNumberUpdated, setRoomNumberUpdated] = useState(false);
  
  const saveRoomNumberToMemory = async (roomNumber) => {
    try {
        const userData = await AsyncStorage.getItem('@userData');
        if (!userData) {
            Alert.alert(
              "User Data Error",
              "Please enter your user data first.",
                [
                  { text: 'OK', onPress: () => setInitialRouteName('RoomNumber')}
                ],
                { cancelable: false }
            );
        } else {
            const parsedData = JSON.parse(userData);
            parsedData.roomNumber = roomNumber;
            const updatedUserData = JSON.stringify(parsedData);
            await AsyncStorage.setItem('@userData', updatedUserData);
            setRoomNumberUpdated(true);
        }
    } catch (error) {
        console.error('Error saving room number to memory:', error);
    }
};

  const LanguageProvider = ({ children }) => {
    useEffect(() => {
      const loadLanguagePreference = async () => {
        try {
          const language = await AsyncStorage.getItem('@language');
          if (language) {
            i18next.changeLanguage(language);
          }
          else {
            i18next.changeLanguage('en');
          }
        } catch (error) {
          console.error('Error loading language preference:', error);
        }
      };
  
      loadLanguagePreference();
    }, []);
  
    return <>{children}</>;
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  useEffect(() => {
    if (deepLinkData) {
      // Handle deep link data when app is already running
      saveRoomNumberToMemory(deepLinkData);
      setDeepLinkData(null);
    }
  }, [deepLinkData]);
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const deepLink = event.url;
      const data = deepLink.split('?')[1]?.split('=')[1];
      if (data) {
        const decodedData = decodeURIComponent(data);
        console.log('Received data:', decodedData);
        setDeepLinkData(decodedData);
        saveRoomNumberToMemory(decodedData);
        setDeepLinkData(null);
      }
    };

    const handleInitialDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      } else {
        setRoomNumberUpdated(true);
      }
    };

    Linking.addEventListener('url', handleDeepLink);

    handleInitialDeepLink();

    return () => {
      
    };
  }, []);
  useEffect(() => {

    const checkStoredData = async () => {
      try {
        const data = await AsyncStorage.getItem('@userData');
        console.log('Stored data:', data);
        if (!data) {
          setInitialRouteName('RoomNumber');
          return;
        }
        const { roomNumber, role } = JSON.parse(data) || {};
        if (!roomNumber?.trim() || !role?.trim()) {
          setInitialRouteName('RoomNumber');
          return;
        }
        if (role !== 'Resident' && role !== 'Nurse') {
          setInitialRouteName('RoomNumber');
          return;
        }
        console.log('Room number:', roomNumber);
        console.log('Role:', role);
        setInitialRouteName(role === 'Resident' ? 'Main' : 'NurseView');
        console.log('Initial route:', initialRouteName);
      } catch (error) {
        console.error('Error checking stored data:', error);
      }
    };
    

    if (roomNumberUpdated) {
      checkStoredData();
      setRoomNumberUpdated(false); 
    }



    return () => {
    };
  }, [initialRouteName, roomNumberUpdated]);

  if (initialRouteName === null) {
    return null;
  }

  return (
    <LanguageProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{headerShown: false}}>
        <Stack.Screen name="RoomNumber" component={RoomNumber} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="NurseView" component={NurseView} />
      </Stack.Navigator>
      
    </NavigationContainer>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default App;
