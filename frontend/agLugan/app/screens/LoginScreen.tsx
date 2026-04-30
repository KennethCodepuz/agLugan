import React, { useEffect, useState } from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppleIcon from "../../assets/icons/appleIconWhite.svg";
import GoogleIcon from "../../assets/icons/googleIcon.svg";

import { useRouter } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuth } from "../../context/AuthContext";

// sdk.dir=C:\\Users\\Kenne\\AppData\\Local\\Android\\Sdk

function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const localUrl = process.env.EXPO_PUBLIC_API_URL + "/api/auth2/login";

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        process.env.EXPO_PUBLIC_WEB_CLIENT_ID ||
        "892629088971-ecur44iv29vjb0vvfe3nv4mermu33tmh.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      
      const user = await GoogleSignin.signIn();
      const idToken = user.data?.idToken;

      const res = await fetch(localUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error("Login failed. You may need to register first.");
      }

      const data = await res.json();
      
      // Save user to AuthContext (and SecureStore)
      await login(data);
      // AuthContext will handle navigation to HomeScreen
    } catch (err: any) {
      console.log(err);
      // Handle error (e.g., show alert)
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={{ alignItems: "center" }}>
            <Image
              style={styles.logo}
              source={require("../../assets/logo-2.png")}
            />
            <Text style={styles.agLugan}>agLugan</Text>
          </View>

          <View style={{ alignItems: "center", gap: 5 }}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.loginText}>Log in to your account</Text>
          </View>

          <View style={{ width: "100%", alignItems: "center", gap: 15, maxWidth: 400 }}>
            <Text style={styles.termsText}>
              By continuing, you agree to our
              <Text style={{ fontWeight: "800", color: "#4c1dda" }}>
                {" "}
                Terms & Privacy Policy
              </Text>
            </Text>

            <Pressable 
              style={{ width: "100%", alignItems: "center", opacity: loading ? 0.7 : 1 }}
              onPress={signInWithGoogle}
              disabled={loading}
            >
              <LinearGradient
                colors={["#4c1dda", "#9f1dd3"]}
                style={styles.googleButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <GoogleIcon width={28} height={28} />
                <Text style={styles.buttonText}>{loading ? "Logging in..." : "Continue with Google"}</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={styles.appleButton}>
              <AppleIcon width={28} height={28} />
              <Text style={styles.buttonText}>Continue with Apple</Text>
            </Pressable>

            <Text style={styles.bottomText}>
              {"Don't "}have an account?
              <Pressable onPress={() => router.navigate("/screens/Register")}>
                <Text style={{ color: "#4c1dda" }}>{"\t"}Sign up</Text>
              </Pressable>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    width: "100%",
    gap: 30,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  agLugan: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: -10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "800",
  },
  loginText: {
    fontSize: 16,
    color: "#808080",
  },
  termsText: {
    color: "#8a8a8a",
    textAlign: "center",
  },
  googleButton: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 25,
    width: "100%",
  },
  appleButton: {
    alignItems: "center",
    backgroundColor: "black",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    borderRadius: 50,
    paddingVertical: 14,
    paddingHorizontal: 25,
    width: "100%",
  },
  buttonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  bottomText: {
    fontSize: 16,
    color: "#8a8a8a",
    marginTop: 10,
  },
});

export default LoginScreen;
