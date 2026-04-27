# Feature: HomeScreen — Fix Icon & Avatar Circle Clipping (Option 2 + Size Reduction)

Date: 2026-04-27

---

## Summary

Fixed circular UI elements (map markers, profile avatar) clipping their content on Android. The root cause was missing `overflow: 'hidden'` on `View` components using `borderRadius` — Android does not automatically clip children to a rounded boundary without this property. Additionally, the profile picture `Image` was refactored into a wrapper `View` to correctly apply `borderRadius` and `borderWidth`, since Android's `Image` component does not reliably respect `borderRadius` on its own.

---

## Files Modified

- `frontend/agLugan/app/screens/HomeScreen.tsx`

---

# Code Changes

## BEFORE — Missing `overflow: 'hidden'`

```tsx
// Marker circles had no overflow clipping
iconMarker: {
  width: 46, height: 46, borderRadius: 23,
  backgroundColor: SURFACE,
  justifyContent: "center", alignItems: "center",
  borderWidth: 2, borderColor: "#ffffff", elevation: 6,
  // ❌ No overflow: 'hidden' — emoji bleeds outside circle on Android
},
liveUserMarker: {
  width: 36, height: 36, borderRadius: 18,
  backgroundColor: "#2a4d66",
  justifyContent: "center", alignItems: "center",
  borderWidth: 2, borderColor: TEXT_MUTED, elevation: 6,
  // ❌ No overflow: 'hidden'
},
selfMarker: {
  borderColor: "#ffffff", borderWidth: 3,
  backgroundColor: "#1a6691", width: 42, height: 42, borderRadius: 21,
  // ❌ No overflow: 'hidden'
},

// Avatar: borderRadius applied directly to Image (broken on Android)
avatar: {
  width: 44, height: 44, borderRadius: 22,
  borderWidth: 2, borderColor: "#4c1dda",
},

// Usage: <Image source={{ uri: ... }} style={styles.avatar} />
// ❌ Android Image does not clip to borderRadius reliably
```

## AFTER — `overflow: 'hidden'` added, avatar wrapped in clipping View

```tsx
iconMarker: {
  width: 46, height: 46, borderRadius: 23,
  backgroundColor: SURFACE,
  justifyContent: "center", alignItems: "center",
  borderWidth: 2, borderColor: "#ffffff", elevation: 6,
  overflow: "hidden", // ✅ clips emoji inside circle
},
liveUserMarker: {
  width: 36, height: 36, borderRadius: 18,
  backgroundColor: "#2a4d66",
  justifyContent: "center", alignItems: "center",
  borderWidth: 2, borderColor: TEXT_MUTED, elevation: 6,
  overflow: "hidden", // ✅
},
selfMarker: {
  borderColor: "#ffffff", borderWidth: 3,
  backgroundColor: "#1a6691", width: 42, height: 42, borderRadius: 21,
  overflow: "hidden", // ✅
},

// Avatar: wrapper View handles shape, Image fills it
avatarWrapper: {
  width: 44, height: 44, borderRadius: 22,
  borderWidth: 2, borderColor: "#4c1dda",
  overflow: "hidden", // ✅ clips image to circle
},
avatar: {
  width: "100%", height: "100%", // fills wrapper
},

// Usage:
// <View style={styles.avatarWrapper}>
//   <Image source={{ uri: ... }} style={styles.avatar} />
// </View>
```

---

## Why This Change Was Necessary

On Android, React Native `View` components with `borderRadius` do **not** automatically clip their children — `overflow: 'hidden'` must be explicitly set. Without it, emoji text and images extend beyond the circular boundary, making markers appear clipped or non-circular. The `Image` component on Android also does not reliably apply `borderRadius` when a `borderWidth` is also present, requiring the shape to be defined on a parent wrapper `View` instead.

---

    git commit -m "fix(HomeScreen): add overflow hidden to circular markers and fix avatar clipping on Android"
