import { View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
// import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";

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
        <HomeScreen />
      </View>
    </SafeAreaView>
  );
}
