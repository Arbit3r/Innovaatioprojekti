import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';

const Main = () => {
    const navigation = useNavigation();
    const [userData, setUserData] = useState({});
    const { t } = useTranslation();

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

    // Determine the role text based on the user's role
    const getRoleText = () => {
        if (userData.role === 'Resident') {
            return t('resident');
        } else if (userData.role === 'Nurse') {
            return t('nurse');
        } else {
            return '';
        }
    };

    return ( 
        <View>
            <View style={styles.container}>
                <Pressable delayLongPress={3000} onLongPress={() => {
                    navigation.navigate('RoomNumber')
                }}>
                    <Image source={require("../assets/Benete-blue.png")} />
                </Pressable>
                <Text style={styles.screenTitle}>{userData.roomNumber}</Text>
            </View>

            <Text style={styles.roleText}>{getRoleText()}</Text>

            <View style={styles.content}>
                <Text>{t('everything_is_okay')}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screenTitle: {
        fontSize: 24,
        fontWeight: 'bold',
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
});

export default Main;
