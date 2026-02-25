import { View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
// import LoginScreen from "./screens/LoginScreen";
import LoginScreen from "./screens/LoginScreen";

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <LoginScreen />
      </View>
    </SafeAreaView>
  );
}
