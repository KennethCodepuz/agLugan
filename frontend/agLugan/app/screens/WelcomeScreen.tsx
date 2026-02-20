import { Image, StyleSheet, Text, View } from "react-native";

function WelcomeScreen() {
  return (
    <>
      <View>
        <Image
          style={styles.logo}
          source={require("../../assets/logo.png")}
        ></Image>
        <Text>Welcome!</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    width: 66,
    height: 58,
  },
});

export default WelcomeScreen;
