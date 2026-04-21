package com.aglugan.backend.service;

import com.aglugan.backend.dto.ZoneCountDTO;
import com.aglugan.backend.entity.Zones;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class ZoneCommuterService {

    private final ZonesService zonesService;

    // zoneId → set of userIds currently inside that zone
    private final Map<Long, Set<Long>> zoneCommuterMap = new ConcurrentHashMap<>();

    // userId → zoneId they are currently tracked in (for fast removal)
    private final Map<Long, Long> userZoneMap = new ConcurrentHashMap<>();

    // --- Zone Cache ---
    // Zones rarely change, so we cache them to avoid a DB query on every GPS ping.
    // Cache refreshes automatically every 5 minutes.
    private static final long CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes
    private volatile List<Zones> cachedZones = Collections.emptyList();
    private final AtomicLong lastCacheRefresh = new AtomicLong(0);

    public ZoneCommuterService(ZonesService zonesService) {
        this.zonesService = zonesService;
    }

    /**
     * Returns the zone list from cache. Only hits the DB when the cache is
     * empty or older than 5 minutes (double-checked locking for thread safety).
     */
    private List<Zones> getZones() {
        long now = System.currentTimeMillis();
        if (now - lastCacheRefresh.get() > CACHE_TTL_MS || cachedZones.isEmpty()) {
            synchronized (this) {
                if (now - lastCacheRefresh.get() > CACHE_TTL_MS || cachedZones.isEmpty()) {
                    cachedZones = zonesService.getAllZones();
                    lastCacheRefresh.set(System.currentTimeMillis());
                    System.out.println("Zone cache refreshed: " + cachedZones.size() + " zones loaded.");
                }
            }
        }
        return cachedZones;
    }

    /**
     * Called when a user sends a GPS location update.
     * Finds the nearest zone and checks if the user is within its radius.
     * Returns the updated commuter counts for all zones.
     */
    public List<ZoneCountDTO> updateUserLocation(Long userId, double latitude, double longitude) {
        List<Zones> allZones = getZones();

        if (allZones.isEmpty()) {
            return buildZoneCountList(allZones);
        }

        // Find the nearest zone by straight-line distance
        Zones nearestZone = null;
        double nearestDistance = Double.MAX_VALUE;

        for (Zones zone : allZones) {
            double distance = haversineDistance(latitude, longitude, zone.getLatitude(), zone.getLongitude());
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestZone = zone;
            }
        }

        // Remove user from their previous zone (if any)
        Long previousZoneId = userZoneMap.get(userId);
        if (previousZoneId != null) {
            Set<Long> previousSet = zoneCommuterMap.get(previousZoneId);
            if (previousSet != null) {
                previousSet.remove(userId);
            }
            userZoneMap.remove(userId);
        }

        // Check if user is inside the nearest zone's radius
        if (nearestZone != null && nearestDistance <= nearestZone.getRadius()) {
            Long nearestZoneId = nearestZone.getId();
            zoneCommuterMap.computeIfAbsent(nearestZoneId, k -> ConcurrentHashMap.newKeySet()).add(userId);
            userZoneMap.put(userId, nearestZoneId);
        }

        return buildZoneCountList(allZones);
    }

    /**
     * Called when a user disconnects from the WebSocket.
     * Immediately removes them from any zone they were counted in.
     * Returns the updated commuter counts for all zones.
     */
    public List<ZoneCountDTO> removeUser(Long userId) {
        Long zoneId = userZoneMap.remove(userId);
        if (zoneId != null) {
            Set<Long> zoneSet = zoneCommuterMap.get(zoneId);
            if (zoneSet != null) {
                zoneSet.remove(userId);
            }
        }
        return buildZoneCountList(getZones());
    }

    /**
     * Builds the full list of ZoneCountDTO for all zones, including zones with 0
     * commuters.
     */
    private List<ZoneCountDTO> buildZoneCountList(List<Zones> allZones) {
        List<ZoneCountDTO> result = new ArrayList<>();
        for (Zones zone : allZones) {
            Set<Long> commuters = zoneCommuterMap.getOrDefault(zone.getId(), Collections.emptySet());
            result.add(new ZoneCountDTO(
                    zone.getId(),
                    zone.getLocation(),
                    zone.getLatitude(),
                    zone.getLongitude(),
                    zone.getRadius(),
                    commuters.size()));
        }
        return result;
    }

    /**
     * Haversine formula: calculates the great-circle distance in meters
     * between two GPS coordinates.
     */
    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double EARTH_RADIUS_METERS = 6_371_000.0;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}
