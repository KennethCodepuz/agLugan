# Feature: JWT Session Management and Authentication Flow

Date: 2026-04-26

---

## Summary

Implemented a persistent JWT-based session management and Google OAuth2 login flow across the entire stack. This handles securely storing user credentials via `expo-secure-store`, managing global authentication state via a React Context (`AuthContext`), and ensuring proper routing. On the backend, we resolved NullPointerExceptions during the login flow, updated the JWT service to issue session-specific tokens, and fixed response validation logic in the controllers to correctly dispatch HTTP 401 Unauthorized status when needed.

---

## Files Modified

- `frontend/agLugan/context/AuthContext.tsx` (New File)
- `frontend/agLugan/app/_layout.tsx`
- `frontend/agLugan/app/screens/LoginScreen.tsx`
- `frontend/agLugan/app/screens/Forms/UserForm.tsx`
- `frontend/agLugan/app/screens/Forms/DriverForm.tsx`
- `frontend/agLugan/app/screens/HomeScreen.tsx`
- `agLugan/src/main/java/com/aglugan/backend/auth/authDTO/RegisteredUserDTO.java`
- `agLugan/src/main/java/com/aglugan/backend/auth/jwt/JwtService.java`
- `agLugan/src/main/java/com/aglugan/backend/auth/AuthService.java`
- `agLugan/src/main/java/com/aglugan/backend/auth/AuthController.java`
- `README.md`

---

# Code Changes

## CASE 1 — New File Created

File Created: `frontend/agLugan/context/AuthContext.tsx`

```tsx
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
      router.replace("/");
    } else if (user) {
      if (segments[0] !== "screens" || segments[1] !== "HomeScreen") {
        router.replace("/screens/HomeScreen");
      }
    }
  }, [user, segments, isLoading]);

  const loadUser = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync("user_data");
      if (storedUser) setUser(JSON.parse(storedUser));
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
```

**Explanation & Why:** We needed a global state manager to handle persistent authentication across the app. This Context dynamically watches app routing segments and redirects unauthorized users back to the login screen, and correctly restores sessions from secure native storage (`expo-secure-store`) when the app restarts.

---

## CASE 2 — Modified Files

### `agLugan/src/main/java/com/aglugan/backend/auth/jwt/JwtService.java`

**BEFORE:**
```java
    public String createToken(Map<String, Object> claims, GoogleUserDTO googleUser) {
        return Jwts.builder()
                .claims(claims)
                .subject(googleUser.getGoogleSub())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 30))
                .signWith(getSignKey())
                .compact();
    }
```

**AFTER:**
```java
    public String generateSessionToken(com.aglugan.backend.auth.authDTO.RegisteredUserDTO user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole());
        claims.put("id", user.getId());
        return Jwts.builder()
                .claims(claims)
                .subject(user.getId().toString())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 7)) // 7 days
                .signWith(getSignKey())
                .compact();
    }
```

**Explanation & Why:** A new method was added to generate actual 7-day long-lived session JWT tokens for logged-in users instead of only providing short-lived temporary tokens for registration verification.

---

### `agLugan/src/main/java/com/aglugan/backend/auth/AuthService.java`

**BEFORE:**
```java
    public ResultDTO loginUserLogic(String token) {
        ResultDTO user = verifier.verifyGoogleToken(token);

        if(user.isGoogleUserSuccess() || user.getGoogleUser() == null) {
            if(Objects.equals(user.getRegisteredUser().getRole(), "USER")) {
                Optional<User> userGoogleSub = userService.getUserByGoogleSub(user.getGoogleUser().getGoogleSub());
...
```

**AFTER:**
```java
    public ResultDTO loginUserLogic(String token) {
        ResultDTO user = verifier.verifyGoogleToken(token);

        if(user.isGoogleUserSuccess() && user.getGoogleUser() != null) {
            String googleSub = user.getGoogleUser().getGoogleSub();
            
            Optional<User> userGoogleSub = userService.getUserByGoogleSub(googleSub);
            if(userGoogleSub.isPresent()) {
                User userData = userGoogleSub.get();
                ResultDTO res = ResultDTO.userSuccess(userData);
                res.getRegisteredUser().setSessionToken(jwtService.generateSessionToken(res.getRegisteredUser()));
                return res;
            }
// ... also added for Driver
```

**Explanation & Why:** A critical `NullPointerException` bug crashed the server and falsely returned HTTP 500 when logging in. `user.getRegisteredUser()` was null at this phase. The logic was restructured to pull the `googleSub` safely from the token and query the `users` and `drivers` databases sequentially to verify if the account exists, appending the new session token upon success.

---

### `agLugan/src/main/java/com/aglugan/backend/auth/AuthController.java`

**BEFORE:**
```java
        if (!result.isUserSuccess()) {
            return ResponseEntity.status(401).body(result);
        }
```

**AFTER:**
```java
        if (result.getRegisteredUser() == null) {
            return ResponseEntity.status(401).body(result);
        }
```

**Explanation & Why:** `isUserSuccess()` specifically checks if the role is `"USER"`, which caused drivers logging in to receive `401 Unauthorized` responses. `isGoogleUserSuccess()` did the same for registration. Checking if the `registeredUser` is instantiated prevents these false negatives.

---

### `frontend/agLugan/app/screens/LoginScreen.tsx`

**BEFORE:**
```tsx
  const router = useRouter();

  return (
```

**AFTER:**
```tsx
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const localUrl = "http://10.0.2.2:8080/api/auth2/login";

  useEffect(() => {
    GoogleSignin.configure({ ... });
  }, []);

  const signInWithGoogle = async () => {
    // ... Google OAuth sign in & Backend POST /login fetch
    const data = await res.json();
    await login(data); // Save via AuthContext
  };
```

**Explanation & Why:** Integrated Google Sign in capabilities. When users hit the button, it now actively pings the Google OAuth server, securely verifies the token against the Spring Boot backend, and invokes the Context API's `login` function to store the data and trigger a route redirect.

---

### `frontend/agLugan/app/screens/HomeScreen.tsx`

**BEFORE:**
```tsx
  const { data } = useLocalSearchParams<{ data: string }>();

  const currentUser = React.useMemo(() => {
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, [data]);
```

**AFTER:**
```tsx
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };
```
*(Added `<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>` to UI)*

**Explanation & Why:** Replaced local search parameters with global Context API state to ensure the app retains user identity even upon hard reload. Added a Logout button so users can safely scrub their secure credentials.

---

### `frontend/agLugan/app/_layout.tsx`

**BEFORE:**
```tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**AFTER:**
```tsx
import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
```

**Explanation & Why:** Wrapped the entire application stack in the `AuthProvider` component, enabling all nested screens to consume real-time identity variables.

## At the end of every documentation, add a summarize feature commit message for git:

    git commit -m 'added docs/changes/2026-04-26-login-jwt-session.md'
