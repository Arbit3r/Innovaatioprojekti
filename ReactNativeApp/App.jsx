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
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [deepLinkData, setDeepLinkData] = useState(null);
  const [initialRouteName, setInitialRouteName] = useState('Main');

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        const roomNumber = await AsyncStorage.getItem('@roomNumber');
        const role = await AsyncStorage.getItem('@role');
        if (!roomNumber || !role) {
          setInitialRouteName('RoomNumber');
        }
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
      Linking.removeEventListener('url', handleDeepLink);
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{headerShown: false}}>
        <Stack.Screen name="Main" component={Main} />
        <Stack.Screen name="RoomNumber" component={RoomNumber} />
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
