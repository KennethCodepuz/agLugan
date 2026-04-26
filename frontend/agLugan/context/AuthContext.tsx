import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";

type UserData = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  profilePicture: string;
  phoneNumber: string;
  sessionToken: string;
};

type AuthContextType = {
  user: UserData | null;
  isLoading: boolean;
  login: (userData: UserData) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments.length === 0 || (segments[0] === "screens" && (segments[1] === "LoginScreen" || segments[1] === "Register" || segments[1] === "AuthScreen" || segments[1] === "Forms"));

    if (!user && !inAuthGroup) {
      // Redirect to login if not logged in
      router.replace("/");
    } else if (user) {
      // Redirect to home if logged in and not already there
      if (segments[0] !== "screens" || segments[1] !== "HomeScreen") {
        router.replace("/screens/HomeScreen");
      }
    }
  }, [user, segments, isLoading]);

  const loadUser = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync("user_data");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log("Failed to load user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: UserData) => {
    try {
      await SecureStore.setItemAsync("user_data", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.log("Failed to save user data:", error);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("user_data");
      setUser(null);
    } catch (error) {
      console.log("Failed to delete user data:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
