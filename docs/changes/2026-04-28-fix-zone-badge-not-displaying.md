# Feature: Fix Zone Commuter Count Badge Not Displaying

Date: 2026-04-28

---

## Summary

Fixed a UI bug where the zone commuter count badge (red circle showing how many people are waiting at a zone) was not visible on the map even though the backend was correctly broadcasting `ZONE_COUNT` messages via WebSocket. Two separate issues were causing this.

---

## Files Modified

- `frontend/agLugan/app/screens/HomeScreen.tsx`

---

## Code Changes

### Bug 1: `overflow: "hidden"` clipping the badge

The badge was rendered as a child of `iconMarker` with `position: "absolute", top: -4, right: -4`. Since the badge is positioned outside the 28×28 bounds of `iconMarker`, and `iconMarker` had `overflow: "hidden"`, the badge was being clipped (invisible).

**Fix:** Moved badge rendering outside `iconMarker` into the parent `markerWrapper` View, which does not have `overflow: "hidden"`. Also added `zIndex: 10` to ensure it renders on top.

**BEFORE:**
```tsx
<View style={styles.iconMarker}>
  <Text style={styles.iconText}>{getZoneIcon(zone.classification)}</Text>
  {(zoneCounts.get(zone.id) ?? 0) > 0 && (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>{zoneCounts.get(zone.id)}</Text>
    </View>
  )}
</View>
```

**AFTER:**
```tsx
<View style={styles.iconMarker}>
  <Text style={styles.iconText}>{getZoneIcon(zone.classification)}</Text>
</View>
{/* Badge outside iconMarker so overflow:hidden doesn't clip it */}
{(zoneCounts.get(zone.id) ?? 0) > 0 && (
  <View style={styles.badgeContainer}>
    <Text style={styles.badgeText}>{zoneCounts.get(zone.id)}</Text>
  </View>
)}
```

### Bug 2: `tracksViewChanges` missing on zone Markers

React Native Maps custom Marker views only re-render their native view when `tracksViewChanges={true}` is set. Without it, even though React state (`zoneCounts`) updated, the native marker on the map would not visually update.

**BEFORE:**
```tsx
<Marker key={zone.id.toString()} coordinate={...} anchor={...} onPress={...}>
```

**AFTER:**
```tsx
<Marker key={zone.id.toString()} coordinate={...} anchor={...} tracksViewChanges={true} onPress={...}>
```

### Style change: removed `overflow: "hidden"` from `iconMarker`

```diff
  iconMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: SURFACE,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#ffffff",
-   overflow: "hidden",
+   // overflow:hidden removed — it was clipping the absolutely-positioned badge
  },
```

---

    git commit -m 'fix: zone commuter count badge now visible on map markers (HomeScreen.tsx)'
