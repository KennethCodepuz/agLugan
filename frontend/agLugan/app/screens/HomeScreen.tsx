import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  AnimatedRegion,
  Marker,
  MarkerAnimated,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useZones, Zone } from "../../hooks/useZones";
import { useAuth } from "../../context/AuthContext";

const WS_URL = "ws://10.0.2.2:8080/ws";
const RECONNECT_DELAY_MS = 3000;
const LOCATION_SEND_INTERVAL_MS = 3000;

interface LiveUser {
  id: string;
  latitude: number;
  longitude: number;
  role?: "USER" | "DRIVER";
}

interface AnimatedLiveUser extends LiveUser {
  animatedCoordinate: AnimatedRegion;
}

interface EtaDTO {
  userId: number;
  driverId: number;
  etaSeconds: number;
  paused: boolean;
}

interface ZoneCountDTO {
  zoneId: number;
  location: string;
  latitude: number;
  longitude: number;
  radius: number;
  commuterCount: number;
}

// ─── Helpers ──────────────────────────────────────────────
const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getETA = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  avgSpeedKmH = 30,
) => {
  const distance = getDistanceKm(fromLat, fromLng, toLat, toLng);
  const etaHours = distance / avgSpeedKmH;
  return Math.ceil(etaHours * 60);
};

function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [liveUsers, setLiveUsers] = useState<Map<string, AnimatedLiveUser>>(
    new Map(),
  );
  const [driverETAs, setDriverETAs] = useState<Map<string, number>>(new Map());
  const [zoneCounts, setZoneCounts] = useState<Map<number, number>>(new Map());
  const [backendEta, setBackendEta] = useState<EtaDTO | null>(null);

  const { user: currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    // AuthContext will handle navigation back to login
  };

  const { zones } = useZones();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestLocation = useRef<Location.LocationObject | null>(null);
  const isMounted = useRef(true);

  // ─── WebSocket ───────────────────────────────────────────
  const connect = useCallback(() => {
    if (!isMounted.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

      sendTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN && latestLocation.current) {
          ws.send(
            JSON.stringify({
              latitude: latestLocation.current.coords.latitude,
              longitude: latestLocation.current.coords.longitude,
              role: currentUser?.role ?? "USER",
              id: currentUser?.id?.toString(),
              userId: currentUser?.id ? Number(currentUser.id) : undefined,
            }),
          );
        }
      }, LOCATION_SEND_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed && typeof parsed === "object" && parsed.type) {
          if (parsed.type === "ZONE_COUNT") {
            const counts: ZoneCountDTO[] = parsed.data;
            setZoneCounts((prev) => {
              const next = new Map(prev);
              counts.forEach((c) => next.set(c.zoneId, c.commuterCount));
              return next;
            });
            return;
          } else if (parsed.type === "ETA_UPDATE") {
            setBackendEta(parsed.data);
            return;
          } else if (parsed.type === "DRIVER_OFFLINE" || parsed.type === "USER_OFFLINE") {
            const offlineId = parsed.data?.toString();
            setLiveUsers((prev) => {
              const next = new Map(prev);
              for (const [key, user] of next.entries()) {
                const uId =
                  (user as any).userId?.toString() || user.id?.toString();
                if (uId === offlineId) {
                  next.delete(key);
                }
              }
              return next;
            });
            if (parsed.type === "DRIVER_OFFLINE") {
              setBackendEta((prev) =>
                prev && prev.driverId?.toString() === offlineId
                  ? null
                  : prev,
              );
              setDriverETAs((prev) => {
                const next = new Map(prev);
                next.delete(offlineId);
                return next;
              });
            }
            return;
          }
        }

        const updates: LiveUser[] = Array.isArray(parsed) ? parsed : [parsed];

        setLiveUsers((prev) => {
          const next = new Map(prev);

          for (const user of updates) {
            const uid =
              (user as any).sessionId?.toString() ||
              user.id?.toString() ||
              (user as any).userId?.toString();
            if (uid && user.latitude != null && user.longitude != null) {
              const existing = next.get(uid);

              if (existing) {
                const duration = user.role === "DRIVER" ? 1000 : 300;
                existing.animatedCoordinate
                  .timing({
                    latitude: user.latitude,
                    longitude: user.longitude,
                    latitudeDelta: 0,
                    longitudeDelta: 0,
                    duration,
                    useNativeDriver: false,
                  })
                  .start();

                next.set(uid, {
                  ...existing,
                  latitude: user.latitude,
                  longitude: user.longitude,
                  role: user.role,
                });
              } else {
                const animatedCoordinate = new AnimatedRegion({
                  latitude: user.latitude,
                  longitude: user.longitude,
                  latitudeDelta: 0,
                  longitudeDelta: 0,
                });
                next.set(uid, { ...user, id: uid, animatedCoordinate });
              }
            }
          }
          return next;
        });
      } catch {
        // ignore non-JSON
      }
    };

    ws.onerror = () => { };
    ws.onclose = () => {
      if (sendTimer.current) clearInterval(sendTimer.current);
      if (isMounted.current)
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }, [currentUser]);

  // ─── Location ─────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;
    connect();

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

      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High },
        (loc) => {
          setLocation(loc);
          latestLocation.current = loc;
        },
      );

      return subscription;
    }

    const subPromise = getCurrentLocation();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (sendTimer.current) clearInterval(sendTimer.current);
      wsRef.current?.close();
      subPromise.then((sub) => sub?.remove());
    };
  }, [connect]);

  // ─── Real-time ETA recalculation ─────────────────────────
  useEffect(() => {
    if (!location) return;
    const interval = setInterval(() => {
      setDriverETAs((prevETAs) => {
        const updated = new Map(prevETAs);
        liveUsers.forEach((user) => {
          if (user.role === "DRIVER") {
            const eta = getETA(
              user.latitude,
              user.longitude,
              location.coords.latitude,
              location.coords.longitude,
            );
            updated.set(user.id, eta);
          }
        });
        return updated;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [liveUsers, location]);

  // ─── Helper for zone icons ───────────────────────────────
  const getZoneIcon = (classification?: string) => {
    switch (classification) {
      case "Waiting Shed":
        return "🏠";
      case "Stop":
        return "🚏";
      case "Tricycle Terminal":
        return "🛺";
      case "Jeepney Terminal":
        return "🚐";
      case "Common":
        return "📍";
      case "Uncommon":
        return "⚠️";
      default:
        return "📍";
    }
  };

  if (errorMsg)
    return (
      <View style={styles.centered}>
        <Text>{errorMsg}</Text>
      </View>
    );
  if (!location)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Getting your location...</Text>
      </View>
    );

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
    <SafeAreaView style={{ flex: 1, width: "100%" }}>
      <View style={{ flex: 1, width: "100%" }}>
        <MapView
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          customMapStyle={mapStyle}
          showsUserLocation={false}
          followsUserLocation={false}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {showZones &&
            zones
              .filter((z) => z.classification)
              .map((zone) => (
                <Marker
                  key={zone.id.toString()}
                  coordinate={{
                    latitude: zone.latitude,
                    longitude: zone.longitude,
                  }}
                  anchor={{ x: 0.5, y: 1 }}
                  onPress={() => {
                    setSelectedZone(zone);
                    setActiveMarker(zone.id);
                  }}
                >
                  <View style={styles.markerWrapper}>
                    {activeMarker === zone.id ? (
                      <View style={styles.markerRing}>
                        <Image
                          source={{ uri: zone.imageurl }}
                          style={styles.markerImage}
                        />
                      </View>
                    ) : (
                      <View style={styles.iconMarker}>
                        <Text style={styles.iconText}>
                          {getZoneIcon(zone.classification)}
                        </Text>
                        {(zoneCounts.get(zone.id) ?? 0) > 0 && (
                          <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>
                              {zoneCounts.get(zone.id)}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                    <View style={styles.markerTip} />
                  </View>
                </Marker>
              ))}

          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {currentUser?.role === "DRIVER" ? (
              <View style={styles.driverMarker}>
                <Text style={styles.driverIcon}>🚐</Text>
                <View style={[styles.driverPulse, styles.selfPulse]} />
              </View>
            ) : (
              <View style={[styles.liveUserMarker, styles.selfMarker]}>
                <Text style={styles.liveUserIcon}>🧑</Text>
              </View>
            )}
          </Marker>

          {Array.from(liveUsers.values())
            .filter((u) => u.id !== currentUser?.id?.toString())
            .map((user) => (
              <MarkerAnimated
                key={`live-${user.id}`}
                coordinate={user.animatedCoordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
              >
                {user.role === "DRIVER" ? (
                  <View style={styles.driverMarker}>
                    <Text style={styles.driverIcon}>🚐</Text>
                    <View style={styles.driverPulse} />
                  </View>
                ) : (
                  <View style={styles.liveUserMarker}>
                    <Text style={styles.liveUserIcon}>🧑</Text>
                  </View>
                )}
              </MarkerAnimated>
            ))}
        </MapView>

        <View style={styles.etaContainer}>
          {backendEta ? (
            <Text style={styles.etaText}>
              {backendEta.paused
                ? "ETA: Driver stopped"
                : `ETA: ${Math.ceil(backendEta.etaSeconds / 60)} min`}
            </Text>
          ) : driverETAs.size > 0 ? (
            <Text style={styles.etaText}>
              ETA: {Math.min(...Array.from(driverETAs.values()))} min (est)
            </Text>
          ) : (
            <Text style={styles.etaText}>ETA: Calculating...</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowZones((p) => !p)}
        >
          <Text style={styles.toggleButtonText}>
            {showZones ? "Hide Zones" : "Show Zones"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  markerWrapper: { alignItems: "center", width: 64 },
  markerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "#ffffff",
    overflow: "hidden",
    elevation: 8,
  },
  markerImage: { width: "100%", height: "100%" },
  iconMarker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#1f3a4d",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    elevation: 6,
  },
  iconText: { fontSize: 20 },
  badgeContainer: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e74c3c",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
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

  liveUserMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2a4d66",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#9bb6c9",
    elevation: 6,
  },
  liveUserIcon: { fontSize: 18 },
  selfMarker: {
    borderColor: "#ffffff",
    borderWidth: 3,
    backgroundColor: "#1a6691",
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  selfPulse: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.7)",
  },

  driverMarker: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  driverIcon: { fontSize: 28, zIndex: 2 },
  driverPulse: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,200,50,0.25)",
    borderWidth: 2,
    borderColor: "rgba(255,200,50,0.6)",
    zIndex: 1,
  },

  toggleButton: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "#1f3a4d",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 6,
  },
  toggleButtonText: { color: "#e8f1f8", fontWeight: "600" },

  logoutButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#e74c3c",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 6,
  },
  logoutButtonText: { color: "white", fontWeight: "600" },

  etaContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    backgroundColor: "rgba(15,26,36,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 5,
  },
  etaText: { color: "#e8f1f8", fontWeight: "600", fontSize: 16 },
});

export default HomeScreen;
