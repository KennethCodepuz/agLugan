import React, { useEffect } from "react";

import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppleIcon from "../../assets/icons/appleIconWhite.svg";
import GoogleIcon from "../../assets/icons/googleIcon.svg";

import { useRouter } from "expo-router";

import { GoogleSignin } from "@react-native-google-signin/google-signin";

type AuthData = {
  success: boolean;
  tempToken: string;
};

export default function Register() {
  const router = useRouter();
  const localUrl = process.env.EXPO_PUBLIC_API_URL + "/api/auth2/google/verifyToken";

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
      await GoogleSignin.hasPlayServices();

      await GoogleSignin.signOut();
      const user = await GoogleSignin.signIn();
      const idToken = user.data?.idToken;

      console.log(idToken);

      const res = await fetch(localUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data: AuthData = await res.json();

      router.replace({
        pathname: "/screens/AuthScreen",
        params: { data: JSON.stringify(data) },
      });
    } catch (err: any) {
      console.log(err);
    }
  };

  return (
    <>
      <SafeAreaView style={{ width: "100%", flex: 1 }}>
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

          <View
            style={{
              width: "100%",
              alignItems: "center",
              gap: 10,
              justifyContent: "center",
            }}
          >
            <Text style={styles.termsText}>
              By continuing, you agree to our
              <Text style={{ fontWeight: 800, color: "#4c1dda" }}>
                {" "}
                Terms & Privacy Policy
              </Text>
            </Text>

            <Pressable
              style={{ width: "100%", alignItems: "center" }}
              onPress={signInWithGoogle}
            >
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
              <Pressable
                onPress={() => router.navigate("/screens/LoginScreen")}
              >
                <Text style={{ color: "#4c1dda" }}>{"\t"}Sign in</Text>
              </Pressable>
            </Text>
          </View>
        </View>
      </SafeAreaView>
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
    fontFamily: "serif",
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
    fontSize: 16,
    color: "#808080",
    fontFamily: "inter",
  },
  termsText: {
    color: "#8a8a8a",
    fontFamily: "Inter",
  },
  bottomText: {
    fontSize: 16,
    fontFamily: "Inter ",
    color: "#8a8a8a",
    width: "100%",
    textAlign: "center",
  },
});
