# Feature: Auth Screens UI Fixes

Date: 2026-04-30

---

## Summary

Fixed UI inconsistencies across `AuthScreen`, `LoginScreen`, and `Register` components to ensure a responsive and aesthetically pleasing layout on various mobile devices. The updates introduced `SafeAreaView` to prevent overlap with notches and system bars, wrapped content in `ScrollView` to gracefully handle overflow on smaller screens, replaced fixed `height` constraints with flexible stacking, fixed `paddingBlock` (which is invalid in React Native) to `paddingVertical`, and normalized typography by removing typos in font families and standardizing font weights.

---

## Files Modified

- frontend/agLugan/app/screens/AuthScreen.tsx
- frontend/agLugan/app/screens/LoginScreen.tsx
- frontend/agLugan/app/screens/Register.tsx

---

# Code Changes

## CASE 2 — Editing existing files

### 1. `frontend/agLugan/app/screens/AuthScreen.tsx`

**BEFORE:**
```javascript
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
// ...
  return (
    <>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 32, fontWeight: 800 }}>
// ...
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
// ...
  button: {
    flex: 1,
    height: 280,
```

**AFTER:**
```javascript
import { LinearGradient } from "expo-linear-gradient";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// ...
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 40 }}>
        <Text style={{ fontSize: 32, fontWeight: "800", textAlign: "center" }}>
// ...
const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    width: "100%",
    maxWidth: 400,
// ...
  button: {
    height: 200,
    width: "100%",
```

### 2. `frontend/agLugan/app/screens/LoginScreen.tsx`

**BEFORE:**
```javascript
  return (
    <>
      <View style={styles.container}>
// ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingBlock: 20,
// ...
  googleButton: {
    width: "70%",
```

**AFTER:**
```javascript
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
// ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
// ...
  googleButton: {
    width: "100%",
```

### 3. `frontend/agLugan/app/screens/Register.tsx`

**BEFORE:**
```javascript
  return (
    <>
      <SafeAreaView style={{ width: "100%", flex: 1 }}>
        <View style={styles.container}>
// ...
const styles = StyleSheet.create({
  container: {
    paddingBlock: 20,
// ...
```

**AFTER:**
```javascript
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
// ...
const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
// ...
```

## Why the change was necessary

- Fixed heights (`height: 280`) and horizontally tiled buttons (`flexDirection: "row"`) in `AuthScreen` were breaking on smaller/narrow devices and tablet viewports. Switching to a stacked configuration ensures elements are safely accommodated.
- Added `SafeAreaView` to prevent screen content from overlapping the device status bar and bottom notches.
- Replaced `paddingBlock`, which does not exist in React Native, with `paddingVertical`. 
- Inserted `ScrollView` across authentication views to guarantee user accessibility and scrolling behavior when the soft keyboard is presented.
- Improved the general visual consistency across the views by using unified padding rules and `maxWidth: 400` logic for tablets.

## At the end of every documentation, add a summarize feature commit message for git:

    git commit -m 'added docs/changes/2026-04-30-auth-screens-ui-fix.md and fixed auth screens responsiveness'
