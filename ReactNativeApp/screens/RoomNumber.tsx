import { View,Text, TextInput } from "react-native"
import React from 'react';
import {useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  Button,
  
} from 'react-native';
import { useNavigation } from "@react-navigation/native";

const RoomNumber = ({}) => {
    const navigation = useNavigation();
    const [roomNumber, setRoomNumber] = useState();
    
    return ( 
        <View >
          <Text style={styles.screenTitle}>Aseta huonetunnus</Text>
        <TextInput 
        style={styles.input} 
        onChangeText={(input) => setRoomNumber(input)}/>

        <Button 
        onPress ={() => {navigation.replace('Main', {roomNumber})}}
        title="Valmis"
        />

        </View>
    )
}
const styles = StyleSheet.create({
    screenTitle: {
      fontSize: 24,
      fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
  }
  
  });
  

export default RoomNumber;