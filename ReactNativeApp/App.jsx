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
import Placeholder from "./screens/Placeholder"
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from './services/i18next';
const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [deepLinkData, setDeepLinkData] = useState(null);
  const [initialRouteName, setInitialRouteName] = useState(null); 

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
        setInitialRouteName(role === 'Resident' ? 'Main' : 'Placeholder');
        console.log('Initial route:', initialRouteName);
      } catch (error) {
        console.error('Error checking stored data:', error);
      }
    };
    
    checkStoredData();

    const handleDeepLink = (event) => {
      const deepLink = event.url;
      const data = deepLink.split('?')[1].split('=')[1];
      const decodedData = decodeURIComponent(data);
      console.log('Received data:', decodedData);
      setDeepLinkData(decodedData);
    };

    const handleInitialDeepLink = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    };

    Linking.addEventListener('url', handleDeepLink);

    handleInitialDeepLink();

    return () => {
    };
  }, [initialRouteName]);

  if (initialRouteName === null) {
    return null;
  }

  return (
    <LanguageProvider>
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{headerShown: false}}>
        <Stack.Screen name="RoomNumber" component={RoomNumber} />
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="Placeholder" component={Placeholder} />
      </Stack.Navigator>
      <Modal
        visible={!!deepLinkData} 
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeepLinkData(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Received data: {deepLinkData}</Text>
            <Button title="Close" onPress={() => setDeepLinkData(null)} />
          </View>
        </View>
      </Modal>
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
