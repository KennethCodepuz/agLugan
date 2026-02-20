import React from "react";

import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import GoogleIcon from "../../assets/icons/googleIcon.svg";

export default function Register() {
  return (
    <>
      <View style={styles.container}>
        <Image
          style={styles.logo}
          source={require("../../assets/logo.png")}
        ></Image>
        <Text>agLugan</Text>

        <Pressable style={styles.button}>
          <GoogleIcon width={26} height={26} />
          <Text style={styles.buttonText}>Sign up</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingBlock: 10,
  },
  logo: {
    width: 256,
    height: 256,
  },
  icon: {
    width: 24,
    height: 24,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    borderColor: "Black",
    borderWidth: 1,
    borderRadius: 50,
    paddingBlock: 6,
    paddingInline: 18,
    textAlign: "center",
  },
  buttonText: {
    fontSize: 26,
  },
});
