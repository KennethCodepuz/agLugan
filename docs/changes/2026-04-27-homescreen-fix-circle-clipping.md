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

Android's `react-native-maps` custom marker rendering has **three combined issues** that caused the C-shape clipping:

1. **`borderRadius` does not clip children** — `overflow: 'hidden'` must be explicitly set on Android for children to be masked to the circle boundary.
2. **`elevation` inflates the bitmap size** — Android renders custom markers into an offscreen bitmap. `elevation` allocates extra shadow space, shifting the content inward and causing the border to be cropped at the bitmap edge (the C-shape effect). Removing `elevation` from marker styles eliminated this offset.
3. **Android bitmap size threshold** — Even with the above fixes, markers above ~28×28px triggered clipping due to Android's View layer collapsing optimization in the maps library. Adding `collapsable={false}` prevents this, and reducing sizes to the confirmed working values (28×28 `iconMarker`, 22×22 `liveUserMarker`, 32×32 `markerRing`) fully resolved the issue.

### Final Working Sizes (confirmed on device)

| Element | Final Size |
|:---|:---|
| `markerWrapper` width | 36 |
| `markerRing` | 32×32, r16 |
| `iconMarker` | 28×28, r14 |
| `iconText` fontSize | 12 |
| `liveUserMarker` | 22×22, r11 |
| `selfMarker` | 26×26, r13 |
| `driverIcon` fontSize | 18 |
| `driverPulse` | 28×28, r14 |

---

    git commit -m "fix(HomeScreen): resolve Android map marker clipping via overflow:hidden, remove elevation, collapsable=false, reduced marker sizes"

