import * as Location from "expo-location";
import { useRouter } from "expo-router";
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

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || "ws://10.0.2.2:8080/ws";
const RECONNECT_DELAY_MS = 3000;
const LOCATION_SEND_INTERVAL_MS = 3000;
const PICKUP_THRESHOLD_KM = 0.030; // 30 m — triggers ON_RIDE when driver is this close

type UserStatus = "ONLINE" | "WAITING" | "ON_RIDE";

const STATUS_CONFIG: Record<UserStatus, { color: string; label: string }> = {
  ONLINE:  { color: "#22c55e", label: "Online" },
  WAITING: { color: "#eab308", label: "Waiting" },
  ON_RIDE: { color: "#38bdf8", label: "On Ride" },
};

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
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getETA = (fromLat: number, fromLng: number, toLat: number, toLng: number, avgSpeedKmH = 30) => {
  const distance = getDistanceKm(fromLat, fromLng, toLat, toLng);
  return Math.ceil((distance / avgSpeedKmH) * 60);
};

function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [showDrivers, setShowDrivers] = useState(true);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [liveUsers, setLiveUsers] = useState<Map<string, AnimatedLiveUser>>(new Map());
  const [driverETAs, setDriverETAs] = useState<Map<string, number>>(new Map());
  const [zoneCounts, setZoneCounts] = useState<Map<number, number>>(new Map());
  const [backendEta, setBackendEta] = useState<EtaDTO | null>(null);

  const { user: currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    intentionalClose.current = true;
    wsRef.current?.close();
    await logout();
  };

  const { zones } = useZones();

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestLocation = useRef<Location.LocationObject | null>(null);
  const isMounted = useRef(true);
  const intentionalClose = useRef(false);

  // ─── User Status ──────────────────────────────────────────
  const [userStatus, setUserStatus] = useState<UserStatus>("ONLINE");
  const userStatusRef = useRef<UserStatus>("ONLINE");
  /** True after the user manually cancels — suppresses zone auto-transition until they hail again. */
  const userCancelledRef = useRef(false);
  /** Always use this helper so the ref stays in sync with state. */
  const setStatus = (s: UserStatus) => {
    userStatusRef.current = s;
    setUserStatus(s);
  };

  // ─── WebSocket ───────────────────────────────────────────
  const connect = useCallback(() => {
    if (!isMounted.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      sendTimer.current = setInterval(() => {
        // Only broadcast location when the user is actively waiting for a ride
        if (
          ws.readyState === WebSocket.OPEN &&
          latestLocation.current &&
          userStatusRef.current === "WAITING"
        ) {
          ws.send(
            JSON.stringify({
              latitude: latestLocation.current.coords.latitude,
              longitude: latestLocation.current.coords.longitude,
              role: currentUser?.role ?? "USER",
              id: currentUser?.id?.toString(),
              userId: currentUser?.id ? Number(currentUser.id) : undefined,
              status: "WAITING",
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
                const uId = (user as any).userId?.toString() || user.id?.toString();
                if (uId === offlineId) next.delete(key);
              }
              return next;
            });
            if (parsed.type === "DRIVER_OFFLINE") {
              setBackendEta((prev) =>
                prev && prev.driverId?.toString() === offlineId ? null : prev,
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
                  } as any)
                  .start();
                next.set(uid, { ...existing, latitude: user.latitude, longitude: user.longitude, role: user.role });
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

    ws.onerror = () => {};
    ws.onclose = () => {
      if (sendTimer.current) clearInterval(sendTimer.current);
      if (isMounted.current && !intentionalClose.current)
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
      const accuracy =
        currentUser?.role === "DRIVER" ? Location.Accuracy.High : Location.Accuracy.Balanced;
      try {
        let initialLocation = await Location.getLastKnownPositionAsync();
        if (!initialLocation) initialLocation = await Location.getCurrentPositionAsync({ accuracy });
        if (initialLocation) {
          setLocation(initialLocation);
          latestLocation.current = initialLocation;
        }
      } catch (err) {
        console.warn("Failed to get initial location", err);
      }
      const subscription = await Location.watchPositionAsync({ accuracy }, (loc) => {
        setLocation(loc);
        latestLocation.current = loc;
      });
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
            const eta = getETA(user.latitude, user.longitude, location.coords.latitude, location.coords.longitude);
            updated.set(user.id, eta);
          }
        });
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [liveUsers, location]);

  // ─── Auto: ONLINE → WAITING on zone entry ────────────────
  useEffect(() => {
    // Skip if user manually cancelled — their explicit action takes priority
    if (!location || userStatus !== "ONLINE" || zones.length === 0 || currentUser?.role === "DRIVER" || userCancelledRef.current) return;
    const { latitude: uLat, longitude: uLng } = location.coords;
    for (const zone of zones) {
      const distKm = getDistanceKm(uLat, uLng, zone.latitude, zone.longitude);
      if (distKm <= (zone.radius ?? 200) / 1000) {
        setStatus("WAITING");
        break;
      }
    }
  }, [location, zones, userStatus]);

  // ─── Auto: WAITING → ON_RIDE when driver is ≤30 m ────────
  useEffect(() => {
    if (!location || userStatus !== "WAITING") return;
    const { latitude: uLat, longitude: uLng } = location.coords;
    for (const [, u] of liveUsers) {
      if (u.role === "DRIVER") {
        if (getDistanceKm(uLat, uLng, u.latitude, u.longitude) <= PICKUP_THRESHOLD_KM) {
          setStatus("ON_RIDE");
          break;
        }
      }
    }
  }, [liveUsers, location, userStatus]);

  const getZoneIcon = (classification?: string) => {
    switch (classification) {
      case "Waiting Shed": return "🏠";
      case "Stop": return "🚏";
      case "Tricycle Terminal": return "🛺";
      case "Jeepney Terminal": return "🚐";
      case "Common": return "📍";
      case "Uncommon": return "⚠️";
      default: return "📍";
    }
  };

  // ─── Loading / Error States ──────────────────────────────
  if (errorMsg)
    return (
      <View style={styles.stateCentered}>
        <View style={styles.stateCard}>
          <Text style={styles.stateIcon}>⚠️</Text>
          <Text style={styles.stateTitle}>Location Error</Text>
          <Text style={styles.stateMessage}>{errorMsg}</Text>
        </View>
      </View>
    );

  if (!location)
    return (
      <View style={styles.stateCentered}>
        <View style={styles.stateCard}>
          <Image source={require("../../assets/logo-2.png")} style={styles.loadingLogo} />
          <ActivityIndicator size="large" color="#4c1dda" style={{ marginTop: 16 }} />
          <Text style={styles.stateTitle}>Getting your location...</Text>
          <Text style={styles.stateMessage}>Please wait a moment</Text>
        </View>
      </View>
    );

  const mapStyle = [
    { elementType: "geometry", stylers: [{ color: "#0f1a24" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#132534" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1a2b" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f3a4d" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2a4d66" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#163a2e" }] },
    { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#173d30" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9bb6c9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0f1a24" }] },
  ];

  const avatarInitial = currentUser?.name?.[0]?.toUpperCase() ?? "?";
  const isDriver = currentUser?.role === "DRIVER";

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      {/* ── Map Area ── */}
      <View style={styles.mapContainer}>
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
          {/* Zone Markers */}
          {showZones &&
            zones
              .filter((z) => z.classification)
              .map((zone) => (
                <Marker
                  key={zone.id.toString()}
                  coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges={true}
                  onPress={() => { setSelectedZone(zone); setActiveMarker(zone.id); }}
                >
                  <View collapsable={false} style={styles.markerWrapper}>
                    {activeMarker === zone.id ? (
                      <View style={styles.markerRing}>
                        <Image source={{ uri: zone.imageurl }} style={styles.markerImage} />
                      </View>
                    ) : (
                      <View style={styles.iconMarker}>
                        <Text style={styles.iconText}>{getZoneIcon(zone.classification)}</Text>
                      </View>
                    )}
                    {/* Badge rendered OUTSIDE iconMarker so overflow:hidden doesn't clip it */}
                    {(zoneCounts.get(zone.id) ?? 0) > 0 && (
                      <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{zoneCounts.get(zone.id)}</Text>
                      </View>
                    )}
                    <View style={styles.markerTip} />
                  </View>
                </Marker>
              ))}

          {/* Self Marker */}
          <Marker
            coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {isDriver ? (
              <View collapsable={false} style={styles.driverMarker}>
                <Text style={styles.driverIcon}>🚐</Text>
                <View style={[styles.driverPulse, styles.selfPulse]} />
              </View>
            ) : (
              <View collapsable={false} style={[styles.liveUserMarker, styles.selfMarker]}>
                <Text style={styles.liveUserIcon}>🧑</Text>
              </View>
            )}
          </Marker>

          {/* Other Live Users */}
          {Array.from(liveUsers.values())
            .filter((u) => u.id !== currentUser?.id?.toString())
            .filter((u) => (u.role === "DRIVER" ? showDrivers : true))
            .map((user) => (
              <MarkerAnimated
                key={`live-${user.id}`}
                coordinate={user.animatedCoordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
              >
                {user.role === "DRIVER" ? (
                  <View collapsable={false} style={styles.driverMarker}>
                    <Text style={styles.driverIcon}>🚐</Text>
                    <View style={styles.driverPulse} />
                  </View>
                ) : (
                  <View collapsable={false} style={styles.liveUserMarker}>
                    <Text style={styles.liveUserIcon}>🧑</Text>
                  </View>
                )}
              </MarkerAnimated>
            ))}
        </MapView>

        {/* ETA Chip — bottom center */}
        <View style={styles.etaContainer}>
          {backendEta ? (
            <Text style={styles.etaText}>
              {backendEta.paused ? "⏸ Driver stopped" : `🕐 ETA: ${Math.ceil(backendEta.etaSeconds / 60)} min`}
            </Text>
          ) : driverETAs.size > 0 ? (
            <Text style={styles.etaText}>🕐 ETA: ~{Math.min(...Array.from(driverETAs.values()))} min</Text>
          ) : (
            <Text style={styles.etaText}>🕐 Calculating ETA...</Text>
          )}
        </View>

        {/* FAB Stack — bottom right */}
        <View style={styles.fabStack}>
          <TouchableOpacity
            style={[styles.fab, !showDrivers && styles.fabInactive]}
            onPress={() => setShowDrivers((p) => !p)}
          >
            <Text style={styles.fabIcon}>🚐</Text>
            <Text style={[styles.fabLabel, !showDrivers && styles.fabLabelInactive]}>
              {showDrivers ? "Jeeps" : "Hidden"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fab, !showZones && styles.fabInactive]}
            onPress={() => setShowZones((p) => !p)}
          >
            <Text style={styles.fabIcon}>📍</Text>
            <Text style={[styles.fabLabel, !showZones && styles.fabLabelInactive]}>
              {showZones ? "Zones" : "Hidden"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom Navigation Bar ── */}
      <View style={styles.bottomNav}>
        {/* Profile + Status */}
        <View style={styles.navProfile}>
          {currentUser?.profilePicture ? (
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: currentUser.profilePicture }} style={styles.avatar} />
            </View>
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            </View>
          )}
          <View style={styles.navUserInfo}>
            <Text style={styles.navName} numberOfLines={1}>
              {currentUser?.name ?? currentUser?.username ?? "User"}
            </Text>
            <View style={styles.navRoleRow}>
              <Text style={styles.navRole}>
                {isDriver ? "🚐 Driver" : "🧑 Commuter"}
              </Text>
              {!isDriver && (
                <View style={[styles.statusBadge, { borderColor: STATUS_CONFIG[userStatus].color }]}>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_CONFIG[userStatus].color }]} />
                  <Text style={[styles.statusBadgeText, { color: STATUS_CONFIG[userStatus].color }]}>
                    {STATUS_CONFIG[userStatus].label}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.navActions}>
          {!isDriver && (
            <TouchableOpacity
              style={[
                styles.statusActionBtn,
                userStatus === "ONLINE"  && styles.statusBtnHail,
                userStatus === "WAITING" && styles.statusBtnCancel,
                userStatus === "ON_RIDE" && styles.statusBtnExit,
              ]}
              onPress={() => {
                if (userStatus === "ONLINE")  { userCancelledRef.current = false; setStatus("WAITING"); }
                if (userStatus === "WAITING") { userCancelledRef.current = true;  setStatus("ONLINE");  }
                if (userStatus === "ON_RIDE") { userCancelledRef.current = false; setStatus("ONLINE");  }
              }}
            >
              <Text style={styles.statusActionText}>
                {userStatus === "ONLINE"  ? "Hail Ride" : null}
                {userStatus === "WAITING" ? "Cancel"    : null}
                {userStatus === "ON_RIDE" ? "Exit Ride" : null}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const SURFACE = "#132534";
const BORDER = "#1f3a4d";
const TEXT_PRIMARY = "#e8f1f8";
const TEXT_MUTED = "#9bb6c9";
const BG = "#0f1a24";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Loading / Error ──────────────────────────────────────
  stateCentered: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  stateCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER,
  },
  stateIcon: { fontSize: 40, marginBottom: 12 },
  stateTitle: { color: TEXT_PRIMARY, fontSize: 18, fontWeight: "700", marginTop: 8 },
  stateMessage: { color: TEXT_MUTED, fontSize: 14, marginTop: 4, textAlign: "center" },
  loadingLogo: { width: 100, height: 100, resizeMode: "contain" },

  // ── Map ──────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
  },

  // ── Zone Markers ─────────────────────────────────────────
  markerWrapper: { alignItems: "center", width: 36 },
  markerRing: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: "#ffffff",
    overflow: "hidden",
  },
  markerImage: { width: "100%", height: "100%" },
  iconMarker: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: SURFACE,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#ffffff",
    // overflow:hidden removed — it was clipping the absolutely-positioned badge
  },
  iconText: { fontSize: 12 },
  badgeContainer: {
    position: "absolute", top: -4, right: -4,
    backgroundColor: "#e74c3c",
    borderRadius: 8, minWidth: 14, height: 14,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "#ffffff", paddingHorizontal: 2,
    zIndex: 10,
  },
  badgeText: { color: "#ffffff", fontSize: 8, fontWeight: "bold" },
  markerTip: {
    marginTop: -1, width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderTopColor: "#ffffff",
  },

  // ── Live User / Driver Markers ────────────────────────────
  liveUserMarker: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#2a4d66",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: TEXT_MUTED,
    overflow: "hidden",
  },
  liveUserIcon: { fontSize: 12 },
  selfMarker: {
    borderColor: "#ffffff", borderWidth: 2,
    backgroundColor: "#1a6691", width: 26, height: 26, borderRadius: 13,
    overflow: "hidden",
  },
  selfPulse: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.7)",
  },
  driverMarker: { alignItems: "center", justifyContent: "center", position: "relative" },
  driverIcon: { fontSize: 18, zIndex: 2 },
  driverPulse: {
    position: "absolute", width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,200,50,0.25)",
    borderWidth: 2, borderColor: "rgba(255,200,50,0.6)", zIndex: 1,
  },

  // ── ETA Chip ─────────────────────────────────────────────
  etaContainer: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "rgba(15,26,36,0.90)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 8,
  },
  etaText: { color: TEXT_PRIMARY, fontWeight: "700", fontSize: 15 },

  // ── FAB Stack ────────────────────────────────────────────
  fabStack: {
    position: "absolute",
    bottom: 16,
    right: 16,
    gap: 10,
    alignItems: "center",
  },
  fab: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    elevation: 6,
    minWidth: 64,
  },
  fabInactive: {
    backgroundColor: "rgba(19,37,52,0.55)",
    borderColor: "#1f3a4d88",
  },
  fabIcon: { fontSize: 20 },
  fabLabel: { color: TEXT_PRIMARY, fontSize: 11, fontWeight: "600", marginTop: 2 },
  fabLabelInactive: { color: TEXT_MUTED },

  // ── Bottom Navigation Bar ─────────────────────────────────
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 12,
  },

  // ── Status Badge ─────────────────────────────────────────
  navRoleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },

  // ── Status Action Button ──────────────────────────────────
  statusActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    elevation: 2,
    minWidth: 80,
    alignItems: "center",
  },
  statusBtnHail:   { backgroundColor: "#4c1dda" },
  statusBtnCancel: { backgroundColor: "#78350f" },
  statusBtnExit:   { backgroundColor: "#0c4a6e" },
  statusActionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  navProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatarWrapper: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: "#4c1dda",
    overflow: "hidden",
  },
  avatar: {
    width: "100%", height: "100%",
  },
  avatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#2a4d66",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#4c1dda",
    overflow: "hidden",
  },
  avatarInitial: { color: TEXT_PRIMARY, fontSize: 18, fontWeight: "700" },
  navUserInfo: { flex: 1 },
  navName: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: "700" },
  navRole: { color: TEXT_MUTED, fontSize: 12, marginTop: 1 },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  navIconBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: BG,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: BORDER,
  },
  navIconText: { fontSize: 18 },
  logoutBtn: {
    backgroundColor: "#e74c3c",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    elevation: 2,
  },
  logoutBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});

export default HomeScreen;
