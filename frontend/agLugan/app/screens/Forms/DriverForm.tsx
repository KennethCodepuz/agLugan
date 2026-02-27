import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface DriverFormState {
  username: string;
  phoneNumber: string;
  driversLicense: string;
  plateNumber: string;
  vehicleNumber: string;
}

interface FormField {
  key: keyof DriverFormState;
  label: string;
  placeholder: string;
  keyboardType: "default" | "phone-pad" | "numeric";
  autoCapitalize: "none" | "characters" | "words" | "sentences";
  maxLength: number;
}

function DriverForm() {
  const [form, setForm] = useState<DriverFormState>({
    username: "",
    phoneNumber: "",
    driversLicense: "",
    plateNumber: "",
    vehicleNumber: "",
  });

  const handleChange = (field: keyof DriverFormState, value: string): void => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (): void => {
    console.log("Driver Form Data:", form);
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
    {
      key: "driversLicense",
      label: "Driver's License",
      placeholder: "Enter your driver's license number",
      keyboardType: "default",
      autoCapitalize: "characters",
      maxLength: 20,
    },
    {
      key: "plateNumber",
      label: "Plate Number",
      placeholder: "Enter your plate number",
      keyboardType: "default",
      autoCapitalize: "characters",
      maxLength: 10,
    },
    {
      key: "vehicleNumber",
      label: "Vehicle Number",
      placeholder: "Enter your vehicle number",
      keyboardType: "default",
      autoCapitalize: "characters",
      maxLength: 17,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Driver Registration</Text>
          <Text style={styles.subtitle}>Please fill in your details below</Text>
        </View>

        <View style={styles.formContainer}>
          {fields.map((field: FormField) => (
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
            <Text style={styles.buttonText}>Register Driver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  button: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default DriverForm;
