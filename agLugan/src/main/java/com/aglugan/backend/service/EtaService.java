package com.aglugan.backend.service;

import com.aglugan.backend.dto.EtaDTO;
import com.aglugan.backend.entity.Zones;
import com.aglugan.backend.util.GeoUtils;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Calculates per-user ETAs from the nearest active driver to each user's zone.
 *
 * Design decisions:
 *  - Entirely event-driven: computation runs only when a driver GPS ping arrives.
 *    No background scheduler is needed.
 *  - No database calls: uses the in-memory caches in DriverStateService and
 *    ZoneCommuterService.
 *  - Privacy: returns a Map<userId, EtaDTO> so the caller (WebSocketConnectionHandler)
 *    can push each EtaDTO to the correct private session. This class never touches sessions.
 *  - 20-second threshold: an update is only returned when the new ETA differs from the
 *    last sent value by >= 20 seconds, OR the paused state changes.
 *  - Stopped detection: if the nearest driver's speed is below DriverState.STOPPED_THRESHOLD_MS
 *    (0.5 m/s ≈ 1.8 km/h), the ETA value is frozen and paused=true is returned.
 */
@Service
public class EtaService {

    private static final int ETA_THRESHOLD_SECONDS = 20;

    private final DriverStateService driverStateService;
    private final ZoneCommuterService zoneCommuterService;

    // ── Per-user ETA state (all in-memory, no DB) ────────────────────────────

    // userId → last etaSeconds value that was pushed to that user
    private final Map<Long, Integer> lastSentEtaMap = new ConcurrentHashMap<>();

    // userId → last paused state that was pushed to that user
    private final Map<Long, Boolean> lastSentPausedMap = new ConcurrentHashMap<>();

    // userId → driverId they were last assigned (for targeted cleanup on driver disconnect)
    private final Map<Long, Long> userDriverMap = new ConcurrentHashMap<>();

    public EtaService(DriverStateService driverStateService,
                      ZoneCommuterService zoneCommuterService) {
        this.driverStateService = driverStateService;
        this.zoneCommuterService = zoneCommuterService;
    }

    /**
     * Computes ETAs for every online user and returns only the users whose ETA
     * has changed enough to warrant a push (delta >= 20s or paused state changed).
     *
     * Called by WebSocketConnectionHandler on every valid DRIVER GPS ping.
     *
     * @return Map of userId → EtaDTO for users that need an update pushed.
     *         Empty map if no updates are needed.
     */
    public Map<Long, EtaDTO> computeEtas() {
        Collection<DriverState> drivers = driverStateService.getActiveDrivers();
        Map<Long, Long> userZoneMap = zoneCommuterService.getUserZoneMap(); // userId → zoneId
        List<Zones> allZones = zoneCommuterService.getZones();

        // Fast-exit: nothing to compute if no drivers or no online users
        if (drivers.isEmpty() || userZoneMap.isEmpty()) {
            return Collections.emptyMap();
        }

        // Build a zoneId → Zones lookup to avoid scanning the list per user
        Map<Long, Zones> zoneById = new HashMap<>(allZones.size());
        for (Zones z : allZones) {
            zoneById.put(z.getId(), z);
        }

        Map<Long, EtaDTO> updates = new HashMap<>();

        for (Map.Entry<Long, Long> entry : userZoneMap.entrySet()) {
            Long userId = entry.getKey();
            Long zoneId = entry.getValue();
            Zones zone = zoneById.get(zoneId);

            // User is online but not yet placed inside any zone — skip
            if (zone == null) continue;

            // ── Find the nearest active driver to this user's zone ───────────
            DriverState nearest = findNearestDriver(drivers, zone);

            // No active drivers available
            if (nearest == null) continue;

            // ── Calculate ETA ────────────────────────────────────────────────
            boolean paused = nearest.isStopped();
            int etaSeconds;

            if (paused) {
                // Driver is stopped: freeze ETA at the last known value.
                // If we've never sent an ETA to this user yet, skip until the
                // driver starts moving and we have a real speed to work with.
                Integer lastEta = lastSentEtaMap.get(userId);
                if (lastEta == null) continue;
                etaSeconds = lastEta;
            } else {
                double distanceM = GeoUtils.haversineDistance(
                        nearest.getLatitude(), nearest.getLongitude(),
                        zone.getLatitude(), zone.getLongitude()
                );
                etaSeconds = (int) (distanceM / nearest.getSpeedMs());
            }

            // ── 20-second threshold check ────────────────────────────────────
            Integer lastSentEta = lastSentEtaMap.get(userId);
            Boolean lastPaused  = lastSentPausedMap.get(userId);

            boolean pausedChanged          = (lastPaused == null || lastPaused != paused);
            boolean etaChangedSignificantly = (lastSentEta == null
                    || Math.abs(etaSeconds - lastSentEta) >= ETA_THRESHOLD_SECONDS);

            if (etaChangedSignificantly || pausedChanged) {
                lastSentEtaMap.put(userId, etaSeconds);
                lastSentPausedMap.put(userId, paused);
                userDriverMap.put(userId, nearest.getDriverId());
                updates.put(userId, new EtaDTO(userId, nearest.getDriverId(), etaSeconds, paused));
            }
        }

        return updates;
    }

    /**
     * Finds the nearest driver to the given zone by straight-line Haversine distance.
     * Drivers that are on their very first ping (speed == 0 and no history) are included —
     * they will simply appear as "stopped" until their second ping provides real speed.
     *
     * @param drivers collection of active driver states
     * @param zone    the destination zone for a user
     * @return the nearest DriverState, or null if the collection is empty
     */
    private DriverState findNearestDriver(Collection<DriverState> drivers, Zones zone) {
        DriverState nearest = null;
        double minDist = Double.MAX_VALUE;

        for (DriverState driver : drivers) {
            double dist = GeoUtils.haversineDistance(
                    driver.getLatitude(), driver.getLongitude(),
                    zone.getLatitude(), zone.getLongitude()
            );
            if (dist < minDist) {
                minDist = dist;
                nearest = driver;
            }
        }
        return nearest;
    }

    /**
     * Called when a user disconnects.
     * Removes all ETA tracking state for that user so memory doesn't leak.
     *
     * @param userId the user that disconnected
     */
    public void clearUserEta(Long userId) {
        lastSentEtaMap.remove(userId);
        lastSentPausedMap.remove(userId);
        userDriverMap.remove(userId);
    }

    /**
     * Called when a driver disconnects.
     * Clears ETA state only for users who were tracking that specific driver,
     * so they immediately receive a fresh ETA from the next nearest driver
     * on the following ping (threshold bypass — lastSentEta is null again).
     *
     * @param driverId the driver that went offline
     */
    public void clearDriverEtas(Long driverId) {
        userDriverMap.entrySet().removeIf(entry -> {
            if (entry.getValue().equals(driverId)) {
                Long userId = entry.getKey();
                lastSentEtaMap.remove(userId);
                lastSentPausedMap.remove(userId);
                return true; // remove from userDriverMap too
            }
            return false;
        });
    }
}
