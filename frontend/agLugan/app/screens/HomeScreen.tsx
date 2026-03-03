import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { useZones } from "../../hooks/useZones";

type Zone = {
  id: number;
  latitude: number;
  longitude: number;
  classification: string | null;
  location: string;
  imageurl: string;
};

function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const { zones, loading, error } = useZones();

  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setErrorMsg("Location services are disabled. Please enable GPS.");
        return;
      }

      const location = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High },
        (loc) => {
          setLocation(loc);
          location.remove();
        },
      );
    }
    getCurrentLocation();
  }, []);

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Getting your location...</Text>
      </View>
    );
  }

  const mapStyle = [
    { elementType: "geometry", stylers: [{ color: "#0f1a24" }] },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#132534" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0a1a2b" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#1f3a4d" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#2a4d66" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#163a2e" }],
    },
    {
      featureType: "landscape.natural",
      elementType: "geometry",
      stylers: [{ color: "#173d30" }],
    },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9bb6c9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f1a24" }] },
  ];

  return (
    <View style={{ flex: 1, width: "100%" }}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        customMapStyle={mapStyle}
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        {zones
          .filter((zone) => zone.classification !== null)
          .map((zone) => (
            <Marker
              key={zone.id.toString()}
              coordinate={{
                latitude: zone.latitude,
                longitude: zone.longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => setSelectedZone(zone)}
            >
              {/* Round marker with pin tip */}
              <View style={styles.markerWrapper}>
                <View style={styles.markerRing}>
                  <Image
                    source={{ uri: zone.imageurl }}
                    style={styles.markerImage}
                  />
                </View>
                <View style={styles.markerTip} />
              </View>
            </Marker>
          ))}
      </MapView>

      {/* Zone Detail Modal */}
      <Modal
        visible={selectedZone !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedZone(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedZone(null)}
        >
          <Pressable
            style={styles.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedZone && (
              <>
                {/* Header image */}
                <View style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: selectedZone.imageurl }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                  {/* Gradient overlay effect using a dark View */}
                  <View style={styles.modalImageOverlay} />
                </View>

                {/* Content */}
                <View style={styles.modalContent}>
                  {/* Classification badge */}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {selectedZone.classification ?? "Unknown"}
                    </Text>
                  </View>

                  <Text style={styles.modalTitle}>
                    {selectedZone.classification ?? "Unknown Zone"}
                  </Text>

                  <View style={styles.locationRow}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.modalLocation}>
                      {selectedZone.location}
                    </Text>
                  </View>
                </View>

                {/* Close button */}
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setSelectedZone(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Marker ──────────────────────────────────────────
  markerWrapper: {
    alignItems: "center",
    width: 64,
  },
  markerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#ffffff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  markerImage: {
    width: "100%",
    height: "100%",
  },
  markerTip: {
    marginTop: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#ffffff",
  },

  // ── Modal ────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#0f1a24",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    paddingBottom: 36,
  },
  modalImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 26, 43, 0.35)",
  },
  modalContent: {
    padding: 20,
    paddingBottom: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(155, 182, 201, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(155, 182, 201, 0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: {
    color: "#9bb6c9",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e8f1f8",
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  locationIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  modalLocation: {
    fontSize: 14,
    color: "#9bb6c9",
    flex: 1,
    lineHeight: 20,
  },
  closeButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#1f3a4d",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#e8f1f8",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default HomeScreen;
