package com.aglugan.backend.service;

import com.aglugan.backend.util.GeoUtils;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tracks the live position and speed of every active driver in memory.
 *
 * No database is involved — all state is derived from incoming WebSocket
 * GPS pings. State is discarded immediately when a driver disconnects.
 *
 * Thread-safe: ConcurrentHashMap ensures correctness under concurrent pings
 * from multiple driver sessions.
 */
@Service
public class DriverStateService {

    // driverId → latest DriverState snapshot
    private final Map<Long, DriverState> activeDrivers = new ConcurrentHashMap<>();

    /**
     * Called on every DRIVER GPS ping received by WebSocketConnectionHandler.
     *
     * Speed is derived from the displacement between the previous and current
     * ping positions divided by the elapsed time between them.
     * On the very first ping from a driver, speed is set to 0.
     *
     * @param driverId the driver's database ID
     * @param latitude incoming GPS latitude
     * @param longitude incoming GPS longitude
     * @return the freshly created DriverState (useful for callers that need it immediately)
     */
    public DriverState updateDriverLocation(Long driverId, double latitude, double longitude) {
        long now = System.currentTimeMillis();
        DriverState previous = activeDrivers.get(driverId);

        double speedMs = 0.0;

        if (previous != null) {
            long timeDeltaMs = now - previous.getLastPingTime();

            // Guard against zero / negative deltas (e.g. clock skew, duplicate messages)
            if (timeDeltaMs > 0) {
                double distanceM = GeoUtils.haversineDistance(
                        previous.getLatitude(), previous.getLongitude(),
                        latitude, longitude
                );
                speedMs = distanceM / (timeDeltaMs / 1000.0); // metres per second
            }
        }

        DriverState updated = new DriverState(driverId, latitude, longitude, speedMs, now);
        activeDrivers.put(driverId, updated);
        return updated;
    }

    /**
     * Called when a driver's WebSocket session closes.
     * All in-memory state for that driver is immediately discarded.
     *
     * @param driverId the driver's database ID
     */
    public void removeDriver(Long driverId) {
        activeDrivers.remove(driverId);
    }

    /**
     * Returns a read-only view of all currently active drivers.
     * Used by EtaService to find the nearest driver to a user's zone.
     */
    public Collection<DriverState> getActiveDrivers() {
        return Collections.unmodifiableCollection(activeDrivers.values());
    }

    /**
     * Returns the current state of a single driver, or null if not active.
     */
    public DriverState getDriver(Long driverId) {
        return activeDrivers.get(driverId);
    }
}
