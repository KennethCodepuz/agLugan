# Feature: HomeScreen UI Polish — Bottom Nav, Jeep Toggle, Consistent FABs

Date: 2026-04-27

---

## Summary

Refactored the HomeScreen UI to introduce a persistent bottom navigation bar showing the logged-in user's profile picture, name, role badge, a Settings button (placeholder), and the Logout button. A new `showDrivers` boolean state was added to allow toggling jeepney/driver markers on the map. Both map overlay controls (Zones, Jeeps) are now unified as consistent FAB (Floating Action Button) components. The loading and error states were also upgraded from bare unstyled views to dark-themed cards matching the app palette. The old top-right logout button was removed.

---

## Files Modified

- `frontend/agLugan/app/screens/HomeScreen.tsx`

---

# Code Changes

## HomeScreen.tsx — Full Rewrite of Render + Styles

### What was added

1. **`showDrivers` state** — new boolean (default `true`) that filters `liveUsers` rendering to hide/show driver (jeepney) markers on the map.

2. **Bottom Navigation Bar** — a `View` rendered below the map (not absolute), containing:
   - Profile avatar (`Image` from `currentUser.profilePicture` URL, fallback to initials `View`)
   - User name and role label (`🧑 Commuter` / `🚐 Driver`)
   - Settings icon button (⚙️, no-op placeholder)
   - Logout button (red, calls existing `handleLogout`)

3. **FAB Stack** — two consistent FABs bottom-right above the nav bar:
   - **Jeeps FAB** — toggles `showDrivers`; dims when inactive
   - **Zones FAB** — toggles `showZones`; dims when inactive

4. **ETA Chip repositioned** — moved to `bottom: 16, alignSelf: 'center'` (horizontally centered above the nav bar), with glassmorphism border and rounded pill shape.

5. **Styled Loading screen** — shows logo + `ActivityIndicator` inside a dark card instead of plain white view.

6. **Styled Error screen** — shows ⚠️ icon, title, and message inside a dark card.

### What was removed

- Old `logoutButton` (absolute top-right red pill) — replaced by bottom nav
- Old `toggleButton` (absolute bottom-right text button) — replaced by FABs
- Old `centered` style (bare white loading/error container)

---

### BEFORE — Logout & Toggle Buttons

```tsx
<TouchableOpacity style={styles.toggleButton} onPress={() => setShowZones((p) => !p)}>
  <Text style={styles.toggleButtonText}>{showZones ? "Hide Zones" : "Show Zones"}</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
  <Text style={styles.logoutButtonText}>Logout</Text>
</TouchableOpacity>
```

### AFTER — FAB Stack + Bottom Nav

```tsx
{/* FAB Stack */}
<View style={styles.fabStack}>
  <TouchableOpacity style={[styles.fab, !showDrivers && styles.fabInactive]} onPress={() => setShowDrivers((p) => !p)}>
    <Text style={styles.fabIcon}>🚐</Text>
    <Text style={styles.fabLabel}>{showDrivers ? "Jeeps" : "Hidden"}</Text>
  </TouchableOpacity>
  <TouchableOpacity style={[styles.fab, !showZones && styles.fabInactive]} onPress={() => setShowZones((p) => !p)}>
    <Text style={styles.fabIcon}>📍</Text>
    <Text style={styles.fabLabel}>{showZones ? "Zones" : "Hidden"}</Text>
  </TouchableOpacity>
</View>

{/* Bottom Navigation Bar */}
<View style={styles.bottomNav}>
  <View style={styles.navProfile}>
    {currentUser?.profilePicture
      ? <Image source={{ uri: currentUser.profilePicture }} style={styles.avatar} />
      : <View style={styles.avatarFallback}><Text style={styles.avatarInitial}>{avatarInitial}</Text></View>}
    <View style={styles.navUserInfo}>
      <Text style={styles.navName}>{currentUser?.name ?? currentUser?.username ?? "User"}</Text>
      <Text style={styles.navRole}>{isDriver ? "🚐 Driver" : "🧑 Commuter"}</Text>
    </View>
  </View>
  <View style={styles.navActions}>
    <TouchableOpacity style={styles.navIconBtn} onPress={() => {}}>
      <Text style={styles.navIconText}>⚙️</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
      <Text style={styles.logoutBtnText}>Logout</Text>
    </TouchableOpacity>
  </View>
</View>
```

---

### Design Tokens Introduced

```ts
const SURFACE = "#132534";
const BORDER  = "#1f3a4d";
const TEXT_PRIMARY = "#e8f1f8";
const TEXT_MUTED   = "#9bb6c9";
const BG = "#0f1a24";
```

These match the existing dark map theme (`#0f1a24` geometry, `#9bb6c9` labels) for full visual consistency.

---

## Why This Change Was Necessary

- The logout button was a floating red pill with no contextual grounding — it could be accidentally tapped during map interaction.
- There was no user identity visible anywhere on the map screen.
- The zone toggle was a plain text button that didn't communicate its active/inactive state clearly.
- No way to hide jeepney markers (useful when commuters only care about zones).
- Loading/error states were bare white screens, breaking the dark immersive map experience.

---

    git commit -m "feat(HomeScreen): add bottom nav with profile/logout/settings, jeep toggle FAB, consistent map FABs, styled loading/error states"
