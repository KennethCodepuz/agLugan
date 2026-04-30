import React from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";

type AuthData = {
  success: boolean;
  tempToken: string;
};

function AuthScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();
  const parseData: AuthData = data
    ? JSON.parse(data)
    : { success: false, tempToken: "" };

  const goToUserForm = () => {
    router.push({
      pathname: "/screens/Forms/UserForm",
      params: { data: JSON.stringify(parseData), role: "USER" },
    });
  };

  const goToDriverForm = () => {
    router.push({
      pathname: "/screens/Forms/DriverForm",
      params: { data: JSON.stringify(parseData), role: "DRIVER" },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 40 }}>
        <Text style={{ fontSize: 32, fontWeight: "800", textAlign: "center" }}>
          Choose account type
        </Text>
        <View style={styles.container}>
          <Pressable style={styles.buttonWrapper} onPress={goToUserForm}>
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
              />
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.buttonWrapper} onPress={goToDriverForm}>
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
              />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
    gap: 20,
  },
  buttonWrapper: {
    width: "100%",
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    height: 200,
    width: "100%",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 15,
    gap: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  commuterImage: {
    height: 100,
    resizeMode: "contain",
  },
});

export default AuthScreen;
