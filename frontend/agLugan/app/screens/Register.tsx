import React from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppleIcon from "../../assets/icons/appleIconWhite.svg";
import GoogleIcon from "../../assets/icons/googleIcon.svg";

export default function Register() {
  return (
    <>
      <View style={styles.container}>
        <View style={{ alignItems: "center" }}>
          <Image
            style={styles.logo}
            source={require("../../assets/logo-2.png")}
          ></Image>
          <Text style={styles.agLugan}>agLugan</Text>
        </View>

        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.createAccountTExt}>Create your account</Text>
        </View>

        <View style={{ width: "100%", alignItems: "center", gap: 10 }}>
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>

          <Pressable style={{ width: "100%", alignItems: "center" }}>
            <LinearGradient
              colors={["#4c1dda", "#9f1dd3"]}
              style={styles.googleButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <GoogleIcon width={28} height={28} />
              <Text style={styles.buttonText}>Sign up with Google</Text>
            </LinearGradient>
          </Pressable>

          <Pressable style={styles.appleButton}>
            <AppleIcon width={28} height={28} />
            <Text style={styles.buttonText}>Sign up with Apple</Text>
          </Pressable>
          <Text style={styles.bottomText}>
            Already have an account?
            <Text style={{ color: "#3b79ff" }}>{"\t"}Sign up</Text>
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingBlock: 20,
    width: "100%",
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
  icon: {
    width: 24,
    height: 24,
  },
  googleButton: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 25,
    width: "70%",
  },
  appleButton: {
    alignItems: "center",
    backgroundColor: "black",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
    borderWidth: 1,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 25,
    width: "70%",
  },
  buttonText: {
    fontSize: 18,
    fontFamily: "Roboto",
    color: "white",
  },
  agLugan: {
    fontSize: 28,
    fontFamily: "Inter",
    fontWeight: "bold",
  },
  welcomeTextContainer: {
    width: "100%",
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  createAccountTExt: {
    fontSize: 18,
    fontFamily: "Inter",
  },
  termsText: {
    fontSize: 14,
    fontFamily: "Inter",
  },
  bottomText: {
    fontSize: 16,
    fontFamily: "Inter ",
  },
});
