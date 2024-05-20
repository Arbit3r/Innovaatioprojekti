# Innovaatioprojekti

## Table of contents
- [Development environment Installation](#development-environment-installation)
- [How to use](#how-to-use)
   - [Room view](#room-view)
   - [Nurse view](#nurse-view)
   - [Settings view](#settings-view)
- [APK creation](#apk-creation)
-  [Signaling server install using docker](#signaling-server-install-using-docker)
## Authors
- [Riku Koski](https://github.com/Arbit3r) - [JamiHam](https://github.com/JamiHam) - [SylvesterSalo](https://github.com/SylvesterSalo) - [Niko Ala-aho](https://github.com/nikoa-a) - [Perttu Harvala](https://github.com/800010179) - [Niko Ahonen](https://github.com/tyyppi355)

## Development environment Installation
1. Follow the instructions under "React Native CLI Quickstart" [here](https://reactnative.dev/docs/environment-setup) to install Node, JDK, Android Studio, the React Native CLI and create an Android Virtual Device.
2. Clone the repository: ```git clone https://github.com/Arbit3r/Innovaatioprojekti.git```
If you get a "Filename too long" error, open Git Bash as administrator and run: ```git config --system core.longpaths true```
3. Start Metro by running the following from the ReactNativeApp folder: ```npm start```
4. Open a new terminal in the same folder while Metro is running and run the following to start the application: ```npm run android```



## How to use
![App Screenshot](https://raw.githubusercontent.com/Arbit3r/Innovaatioprojekti/main/Documentation/room.jpg)
### Room view
1. Pressing Benete-logo for 3 seconds opens a menu for settings.
2. Role (Changeable in the settings).
3. Residents room id (Changeable in the settings).
4. Residents video connection in which one can see itself.
5. (If connection doesn't open up) orange notification will shop up, telling the user connection has failed.
****
### Nurse view
1. Pressing Benete-logo for 3 seconds opens a menu for settings.
2. Video connection to the resident.
3. Outgoing video connection to resident from nurse.
4. A button to disconnect nurse from resident (you can disconnect from the settings menu also!).
5. (If connection doesn't open up) orange notification will shop up, telling the user connection has failed.

****
![App Screenshot](https://raw.githubusercontent.com/Arbit3r/Innovaatioprojekti/main/Documentation/settings.jpg)

### Settings view
1. Text input to configure room/nurse id. The input accepts text and numbers.
2. Text input for the IP-address. IP-address should be written in the following way: ws://192.168.0.1:8080. In this example 192.168.0.1 is the signalingserver IP-address and 8080 is the port that has been configured during the installation.
3. Role dropdown menu, where you choose the role between room and nurse.
   - Room: pressing ready opens up room view.
   - Nurse: pressing ready opens up nurse view and starts the connection to the room specified in the room id text input.
4. Language dropdown menu, where you choose language of the app.
5. Ready button opens a room or nurse view depending on the selection made in the role dropdown menu.

## APK creation
Debug APK-file creation is achieved in the following way:

Run this command in the directory of the project:

``` react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res ```

Run this command in the android directory:

``` ./gradlew assembleDebug ```

APK is then found in the following directory: ReactNativeApp/android/app/build/outputs/apk/debug/app-debug.apk

If you want to publish this in the Google Play-store, [Follow these guides](https://reactnative.dev/docs/signed-apk-android)

## Signaling server install using docker

[DockerHub repo](https://hub.docker.com/r/7riku/inno_projekti/tags)


### Pull command
``` docker pull 7riku/inno_projekti:latest ```


### Docker run
``` docker container run -p {host port}:{container port} -e SIGNAL_PORT={container port} 7riku/inno_projekti:latest ```

### Example
``` docker container run -p 25565:5000 -e SIGNAL_PORT=5000 7riku/inno_projekti:latest ```

Now the server is running on address ws://localhost:25565 and the container port is 5000