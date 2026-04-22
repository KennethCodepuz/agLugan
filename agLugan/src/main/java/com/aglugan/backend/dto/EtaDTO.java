package com.aglugan.backend.dto;

/**
 * Payload pushed to a user's WebSocket session when their ETA changes.
 *
 * This message is PRIVATE — sent only to the specific user it belongs to.
 * Other users never receive this payload.
 *
 * Frontend behaviour:
 *   - On receive: reset local countdown to {@code etaSeconds}
 *   - If {@code paused = true}: freeze the countdown (driver is stopped)
 *   - If {@code paused = false}: resume counting down
 *   - On DRIVER_OFFLINE: clear the ETA display entirely
 */
public class EtaDTO {

    private Long userId;
    private Long driverId;
    private int etaSeconds;

    /**
     * True when the nearest driver is stationary (speed below threshold).
     * The frontend should freeze its countdown while this is true.
     */
    private boolean paused;

    public EtaDTO() {}

    public EtaDTO(Long userId, Long driverId, int etaSeconds, boolean paused) {
        this.userId = userId;
        this.driverId = driverId;
        this.etaSeconds = etaSeconds;
        this.paused = paused;
    }

    // ── Getters ─────────────────────────────────────────────────────────────

    public Long getUserId()    { return userId; }
    public Long getDriverId()  { return driverId; }
    public int getEtaSeconds() { return etaSeconds; }
    public boolean isPaused()  { return paused; }

    // ── Setters ─────────────────────────────────────────────────────────────

    public void setUserId(Long userId)       { this.userId = userId; }
    public void setDriverId(Long driverId)   { this.driverId = driverId; }
    public void setEtaSeconds(int etaSeconds){ this.etaSeconds = etaSeconds; }
    public void setPaused(boolean paused)    { this.paused = paused; }
}
