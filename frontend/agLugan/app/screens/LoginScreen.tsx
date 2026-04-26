import React, { useEffect, useState } from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
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

  const localUrl = "http://10.0.2.2:8080/api/auth2/login";

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
    <>
      <View style={styles.container}>
        <View style={{ alignItems: "center" }}>
          <Image
            style={styles.logo}
            source={require("../../assets/logo-2.png")}
          ></Image>
          <Text style={styles.agLugan}>agLugan</Text>
        </View>

        <View style={{ alignItems: "center", gap: 5 }}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.loginText}>Log in to your account</Text>
        </View>

        <View style={{ width: "100%", alignItems: "center", gap: 10 }}>
          <Text style={styles.termsText}>
            By continuing, you agree to our
            <Text style={{ fontWeight: 800, color: "#4c1dda" }}>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBlock: 20,
    width: "100%",
    gap: 30,
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
  agLugan: {
    fontSize: 28,
    fontFamily: "serif",
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 800,
    fontFamily: "inter",
  },
  loginText: {
    fontSize: 16,
    color: "#808080",
    fontFamily: "inter",
  },
  termsText: {
    color: "#8a8a8a",
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
    fontFamily: "Inter",
    color: "white",
  },
  bottomText: {
    fontSize: 16,
    fontFamily: "Inter",
    color: "#8a8a8a",
  },
});

export default LoginScreen;
