import { View,Text, TouchableWithoutFeedback } from "react-native"
import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from "@react-navigation/native";


const Main = ({route}) => {
    const navigation = useNavigation();
    const {roomNumber} = route.params;

    return ( 
        <View>
          <View style={styles.container}>
        <TouchableWithoutFeedback onLongPress ={() => {
            navigation.replace('RoomNumber')
        }}>
        <Text style={styles.screenTitle}>Benete</Text>
      </TouchableWithoutFeedback>
      <Text style={styles.screenTitle}>{roomNumber}</Text>
      </View>

      <View style={styles.content}>
          <Text>Kaikki kunnossa!</Text>
        </View>
      </View>
    )
}
const styles = StyleSheet.create({
    screenTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 300,
  },

  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 5
  }
  
  });
  

export default Main;