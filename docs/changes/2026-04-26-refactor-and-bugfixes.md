# Feature: Codebase Refactor and Critical Bugfixes

Date: 2026-04-26

---

## Summary

Performed a comprehensive codebase scan resolving critical bugs and implementing necessary architectural refactors. Fixed a severe concurrency bug in the WebSocket handler that broke ETA routing when users logged in from multiple devices. Fixed a frontend WebSocket reconnect loop that would drain battery after a user explicitly logged out. Optimized frontend GPS polling accuracy to drastically save commuter battery life, and completely eradicated hardcoded `localhost` URLs by implementing standard `.env` environment variables across all network calls.

---

## Files Modified

- `frontend/agLugan/.env` (Modified)
- `frontend/agLugan/app/screens/HomeScreen.tsx`
- `frontend/agLugan/app/screens/LoginScreen.tsx`
- `frontend/agLugan/app/screens/Forms/UserForm.tsx`
- `frontend/agLugan/app/screens/Forms/DriverForm.tsx`
- `agLugan/src/main/java/com/aglugan/backend/websocket/WebSocketConnectionHandler.java`

---

# Code Changes

## CASE 2 — Modified Files

### `agLugan/src/main/java/com/aglugan/backend/websocket/WebSocketConnectionHandler.java`

**BEFORE:**
```java
        // ── USER disconnect ──────────────────────────────────────────────────
        Long userId = sessionUserMap.remove(session.getId());
        if (userId != null) {
            userSessionMap.remove(userId);                          // clean reverse map
```

**AFTER:**
```java
        // ── USER disconnect ──────────────────────────────────────────────────
        Long userId = sessionUserMap.remove(session.getId());
        if (userId != null) {
            userSessionMap.remove(userId, session.getId());         // clean reverse map securely
```

**Explanation & Why:** A concurrency bug existed where closing one active session for a user would blindly delete their global reverse session map, instantly breaking ETAs for any of their other concurrently connected devices. Using ConcurrentHashMap's two-argument `.remove(key, value)` ensures the route is only deleted if the closing session is the current active session.

---

### `frontend/agLugan/app/screens/HomeScreen.tsx`

**BEFORE:**
```tsx
const WS_URL = "ws://10.0.2.2:8080/ws";
// ...
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High },
// ...
  const handleLogout = async () => {
    await logout();
    // AuthContext will handle navigation back to login
  };
// ...
    ws.onclose = () => {
      if (sendTimer.current) clearInterval(sendTimer.current);
      if (isMounted.current)
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
```

**AFTER:**
```tsx
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || "ws://10.0.2.2:8080/ws";
// ...
      const accuracy = currentUser?.role === "DRIVER" ? Location.Accuracy.High : Location.Accuracy.Balanced;
      const subscription = await Location.watchPositionAsync(
        { accuracy },
// ...
  const handleLogout = async () => {
    intentionalClose.current = true;
    wsRef.current?.close();
    await logout();
    // AuthContext will handle navigation back to login
  };
// ...
    ws.onclose = () => {
      if (sendTimer.current) clearInterval(sendTimer.current);
      if (isMounted.current && !intentionalClose.current)
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
```

**Explanation & Why:** 
1. Replaced hardcoded localhost URL with `.env` variables to allow easy production deployments.
2. Downgraded Location tracking accuracy to `Balanced` for Commuters, because `High` accuracy drained phone batteries rapidly and was only strictly mathematically necessary for Drivers calculating movement speed vectors. 
3. Added an `intentionalClose` ref to intercept the WebSocket `onclose` event. Previously, logging out would trigger an infinite background reconnect loop attempting to rejoin the disconnected socket, wasting data and battery.

---

### `frontend/agLugan/app/screens/LoginScreen.tsx` & `Forms`

**BEFORE:**
```tsx
const localUrl = "http://10.0.2.2:8080/api/auth2/login";
```

**AFTER:**
```tsx
const localUrl = process.env.EXPO_PUBLIC_API_URL + "/api/auth2/login";
```

**Explanation & Why:** Standardized all REST endpoint fetch requests across the application to source from `process.env.EXPO_PUBLIC_API_URL` instead of hardcoded strings, making future deployments trivial. Added `.env` variables containing `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL`.

## At the end of every documentation, add a summarize feature commit message for git:

    git commit -m 'added docs/changes/2026-04-26-refactor-and-bugfixes.md'
