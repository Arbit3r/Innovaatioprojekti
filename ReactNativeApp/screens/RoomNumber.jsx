import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ToastAndroid } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const RoomNumber = ({}) => {
    const navigation = useNavigation();
    const [roomNumber, setRoomNumber] = useState('');
    const [role, setRole] = useState('Asukas');

    const saveDataToMemory = async () => {
        try {
            const data = JSON.stringify({ roomNumber, role });
            await AsyncStorage.setItem('@userData', data);
        } catch (error) {
            console.error('Error saving data to memory:', error);
        }
    };

     //Check if input empty, otherwise continue
     const handleInput = () => {
        if (roomNumber === "" && role === "Asukas") {
            ToastAndroid.show("Huonetunnus ei saa olla tyhjä!", ToastAndroid.SHORT);
        } else {
            saveDataToMemory();
            navigation.replace('Main', { roomNumber, role });
        }
      }

    return ( 
        <View>
            <Text style={styles.screenTitle}>Aseta huonetunnus</Text>
            <TextInput 
                style={styles.input} 
                onChangeText={(input) => setRoomNumber(input)}
                value={roomNumber}
                placeholder="Huonetunnus"
            />

            <Text style={styles.label}>Valitse rooli</Text>
            <Picker
                selectedValue={role}
                onValueChange={(itemValue, itemIndex) => setRole(itemValue)}
            >
                <Picker.Item label="Asukas" value="Asukas" />
                <Picker.Item label="Hoitaja" value="Hoitaja" />
            </Picker>

            <Button 
                onPress={() => {
                    handleInput();
                }}
                title="Valmis"
            />
        </View>
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

export default RoomNumber;
