import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";

const Main = () => {
    const navigation = useNavigation();
    const [userData, setUserData] = useState({});

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

            <Text style={styles.roleText}>{userData.role}</Text>

            <View style={styles.content}>
                <Text>Kaikki kunnossa!</Text>
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
