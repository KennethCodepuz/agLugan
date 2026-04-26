import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserFormState {
  tempToken: string;
  role: string;
  username: string;
  phoneNumber: string;
}

interface FormField {
  key: keyof Pick<UserFormState, "username" | "phoneNumber">;
  label: string;
  placeholder: string;
  keyboardType: "default" | "phone-pad" | "numeric";
  autoCapitalize: "none" | "characters" | "words" | "sentences";
  maxLength: number;
}

interface UserFormProps {
  tempToken: string;
  role: string;
}

function UserForm() {
  const { data, role } = useLocalSearchParams<{ data: string; role: string }>();
  const parsedData = data ? JSON.parse(data) : { tempToken: "" };

  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState<UserFormState>({
    tempToken: parsedData.tempToken,
    role: role ?? "",
    username: "",
    phoneNumber: "",
  });

  const handleChange = (field: keyof UserFormState, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.username || !form.phoneNumber) {
      alert("Please fill all required fields");
      return;
    }

    const phoneRegex = /^(?:\+63|0)?9\d{9}$/;
    if (!phoneRegex.test(form.phoneNumber)) {
      alert("Invalid phone number");
      return;
    }

    try {
      const url = process.env.EXPO_PUBLIC_API_URL + "/api/auth2/register";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log("userdata", data);
      
      // Save user session via AuthContext
      await login(data);
      // AuthContext will automatically redirect to HomeScreen
    } catch (err: any) {
      alert(err.errorMessage);
      router.push("/screens/Register");
      return;
    }
  };

  const fields: FormField[] = [
    {
      key: "username",
      label: "Username",
      placeholder: "Enter your username",
      keyboardType: "default",
      autoCapitalize: "none",
      maxLength: 30,
    },
    {
      key: "phoneNumber",
      label: "Phone Number",
      placeholder: "Enter your phone number",
      keyboardType: "phone-pad",
      autoCapitalize: "none",
      maxLength: 15,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>User Details</Text>

        {fields.map((field) => (
          <View key={field.key} style={styles.inputGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor="#aaa"
              value={form[field.key]}
              onChangeText={(value: string) => handleChange(field.key, value)}
              keyboardType={field.keyboardType}
              autoCapitalize={field.autoCapitalize}
              maxLength={field.maxLength}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  formContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 32,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  button: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default UserForm;
