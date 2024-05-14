# Innovaatioprojekti
## Authors
- [Riku Koski](https://github.com/Arbit3r) - [JamiHam](https://github.com/JamiHam) - [SylvesterSalo](https://github.com/SylvesterSalo) - [Niko Ala-aho](https://github.com/nikoa-a) - [Perttu Harvala](https://github.com/800010179) - [Niko Ahonen](https://github.com/tyyppi355)

## Installation
1. Follow the instructions under "React Native CLI Quickstart" [here](https://reactnative.dev/docs/environment-setup) to install Node, JDK, Android Studio, the React Native CLI and create an Android Virtual Device.
2. Clone the repository: ```git clone https://github.com/Arbit3r/Innovaatioprojekti.git```
If you get a "Filename too long" error, open Git Bash as administrator and run: ```git config --system core.longpaths true```
3. Start Metro by running the following from the ReactNativeApp folder: ```npm start```
4. Open a new terminal in the same folder while Metro is running and run the following to start the application: ```npm run android```


****
## How to use

****
![App Screenshot](https://raw.githubusercontent.com/Arbit3r/Innovaatioprojekti/main/Documentation/room.jpg)
### Asukkaan päänäkymä
1. Painamalla Benete-logoa 3 sekuntia, avautuu valikko asetuksille
2. Rooli (Muutettavissa asetuksissa)
3. Asukkaan huoneen tunnus (Muutettavissa asetuksissa)
4. Asukkaan kuvayhteys, jonka avulla hän voi nähdä myös itsensä.
5. (Jos yhteys ei avaudu) Jos hoitajan sekä asukkaan välinen yhteys epäonnistuu, ilmestyy näytölle oranssilla tekstillä ilmoitus, mikä kertoo yhteyden epäonnistuneen.
****
### Room view
1. Painamalla Benete-logoa 3 sekuntia, avautuu valikko asetuksille
2. Rooli (Muutettavissa asetuksissa)
3. Asukkaan huoneen tunnus (Muutettavissa asetuksissa)
4. Asukkaan kuvayhteys, jonka avulla hän voi nähdä myös itsensä.
5. (Jos yhteys ei avaudu) Jos hoitajan sekä asukkaan välinen yhteys epäonnistuu, ilmestyy näytölle oranssilla tekstillä ilmoitus, mikä kertoo yhteyden epäonnistuneen.

****
![App Screenshot](https://raw.githubusercontent.com/Arbit3r/Innovaatioprojekti/main/Documentation/settings.jpg)

### Settings view
1. Tekstikenttä, jolla määritetään asukkaan huoneen tunnus. Tekstikenttä hyväksyy sekä numeroita että kirjaimia.
2. Tekstikenttä IP-osoitteelle. IP-osoite tulee kirjoittaa seuraavassa muodossa: ws://192.168.0.1:8080. Tässä esimerkissä 192.168.0.1 on signalointipalvelimen IP-osoite ja 8080 on palvelimen asennuksen aikana asetettu portti. (Lisää)
3. Pudotusvalikko, josta valitaan rooli asukkaan tai hoitajan välillä.
   - Asukas: Valmis-nappia painamalla avautuu asukkaan päänäkymä.
   - Hoitaja: Valmis-nappia painamalla, muodostetaan kuvayhteys Huonetunnus-tekstikentässä asetettuun huoneeseen, jos kyseinen huonetunnus on jonkin asukkaan käytössä.
4. Pudotusvalikko, josta valitaan sovelluksen kieli. (Kielten lisäämisestä tietoa alempana.)
5. Nappi, joka tallentaa asetukset ja poistuu joko Hoitaja- tai Asukas-näkymään, riippuen mikä rooli valittiin. 
