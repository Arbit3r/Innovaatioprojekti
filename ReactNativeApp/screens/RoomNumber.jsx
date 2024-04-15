import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ToastAndroid } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import i18next from '../services/i18next';
import { useTranslation } from 'react-i18next';

const RoomNumber = () => {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation();
    const [roomNumber, setRoomNumber] = useState('');
    const [role, setRole] = useState('Resident');
    const [availableLanguages, setAvailableLanguages] = useState([]);

    useEffect(() => {
        const fetchDataFromStorage = async () => {
            try {
                const data = await AsyncStorage.getItem('@userData');
                if (data !== null) {
                    const parsedData = JSON.parse(data);
                    setRoomNumber(parsedData.roomNumber);
                    setRole(parsedData.role);
                }
            } catch (error) {
                console.error('Error fetching data from storage:', error);
            }
        };


        fetchDataFromStorage();
        setAvailableLanguages(Object.keys(i18next.options.resources));
    }, []);

    

    const saveDataToMemory = async () => {
        try {
            const data = JSON.stringify({ roomNumber, role });
            await AsyncStorage.setItem('@userData', data);
        } catch (error) {
            console.error('Error saving data to memory:', error);
        }
    };

    const saveLanguagePreference = async (lang) => {
        try {
            await AsyncStorage.setItem('@language', lang);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
        saveLanguagePreference(lang); // Save the selected language preference
    };

    const handleInput = () => {
        if (roomNumber.trim().length === 0) {
            ToastAndroid.show(t("room_number_empty"), ToastAndroid.SHORT);
        } else {
            saveDataToMemory();
            navigation.replace(role === "Resident" ? 'Main' : 'NurseView');
        }
    }

    return ( 
        <View>
            <Text style={styles.screenTitle}>{t("screen_title")}</Text>
            {role !== 'Nurse' && (
               <>
               <Text style={styles.label}>{t("set_roomnumber_label")}</Text>
                <TextInput 
                    style={styles.input} 
                    onChangeText={(input) => setRoomNumber(input)}
                    value={roomNumber}
                    placeholder={t("room_number_placeholder")}
                />
                </>
            )}

            <Text style={styles.label}>{t("select_role_label")}</Text>
            <Picker
                selectedValue={role}
                onValueChange={(itemValue, itemIndex) => setRole(itemValue)}
            >
                <Picker.Item label={t("resident")} value="Resident" />
                <Picker.Item label={t("nurse")} value="Nurse" />
            </Picker>

            <Text style={styles.label}>{t("select_language_label")}</Text>
            <Picker
                selectedValue={i18n.language}
                onValueChange={(itemValue, itemIndex) => handleLanguageChange(itemValue)}
            >
                {availableLanguages.map(lang => (
                    <Picker.Item label={lang} value={lang} key={lang} />
                ))}
            </Picker>

            <Button 
                onPress={handleInput}
                title={t("ready_button_title")}
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
