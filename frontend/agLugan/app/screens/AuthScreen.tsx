import React from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";

function AuthScreen() {
  const router = useRouter();

  return (
    <>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 32, fontWeight: 800 }}>
          Choose account type
        </Text>
        <View style={styles.container}>
          <Pressable
            style={styles.button}
            onPress={() => router.navigate("/screens/Forms/UserForm")}
          >
            <LinearGradient
              colors={["#4c1dda", "#9f1dd3"]}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Commuter</Text>
              <Image
                style={styles.commuterImage}
                source={require("../../assets/icons/boy.png")}
              ></Image>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.button}>
            <LinearGradient
              colors={["#4c1dda", "#9f1dd3"]}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>Driver</Text>
              <Image
                style={styles.commuterImage}
                source={require("../../assets/icons/chauffeur.png")}
              ></Image>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  button: {
    flex: 1,
    alignItems: "center",
    height: 280,
    width: "100%",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 28,
    fontFamily: "Inter",
    fontWeight: "bold",
  },
  commuterImage: {
    height: 160,
    width: "90%",
  },
});

export default AuthScreen;
