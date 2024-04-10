import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useNavigation } from '@react-navigation/native';
const Placeholder = () => {
  const navigation = useNavigation();
  return (
    <>
    <View style={styles.container}>
    <Pressable delayLongPress={3000} onLongPress={() => {
    navigation.navigate('RoomNumber')
}}>
  <Image source={require("../assets/Benete-blue.png")} />
</Pressable>
    </View>
  </>
  );
}
const styles = StyleSheet.create({
  screenTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
  },
  input: {
      height: 40,
      borderColor: 'black',
      borderWidth: 1,
      marginBottom: 10,
      paddingHorizontal: 10,
  },
  label: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
  },
});
export default Placeholder;