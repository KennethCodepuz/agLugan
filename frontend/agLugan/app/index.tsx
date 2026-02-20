import { View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import Register from "./screens/Register";

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
        <Register />
      </View>
    </SafeAreaView>
  );
}
