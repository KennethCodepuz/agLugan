package com.aglugan.backend.service;

/**
 * Immutable snapshot of a driver's last known position and derived speed.
 * A new instance is created on every GPS ping — no setters needed.
 *
 * speedMs is calculated in DriverStateService from consecutive pings.
 * It is used by EtaService to compute travel time.
 */
public class DriverState {

    // Speed below this threshold (m/s) is treated as "stopped"
    // 0.5 m/s ≈ 1.8 km/h — filters out GPS jitter while stationary
    public static final double STOPPED_THRESHOLD_MS = 0.5;

    private final long driverId;
    private final double latitude;
    private final double longitude;
    private final double speedMs;      // metres per second, derived from consecutive pings
    private final long lastPingTime;   // System.currentTimeMillis() when this state was recorded

    public DriverState(long driverId, double latitude, double longitude,
                       double speedMs, long lastPingTime) {
        this.driverId = driverId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speedMs = speedMs;
        this.lastPingTime = lastPingTime;
    }

    /** @return true when the driver is considered stationary (loading/unloading). */
    public boolean isStopped() {
        return speedMs < STOPPED_THRESHOLD_MS;
    }

    // ── Getters ─────────────────────────────────────────────────────────────

    public long getDriverId()    { return driverId; }
    public double getLatitude()  { return latitude; }
    public double getLongitude() { return longitude; }
    public double getSpeedMs()   { return speedMs; }
    public long getLastPingTime(){ return lastPingTime; }
}
