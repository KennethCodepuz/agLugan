package com.aglugan.backend.websocket;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import com.aglugan.backend.dto.EtaDTO;
import com.aglugan.backend.dto.ZoneCountDTO;
import com.aglugan.backend.service.DriverStateService;
import com.aglugan.backend.service.EtaService;
import com.aglugan.backend.service.ZoneCommuterService;
import com.aglugan.backend.websocket.websocketDTO.WebSocketDTO;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component
public class WebSocketConnectionHandler extends TextWebSocketHandler {

    // ConcurrentHashMap: thread-safe — multiple clients can connect simultaneously
    private final Map<String, WebSocketSession> webSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // sessionId → userId  (for zone-count cleanup on user disconnect)
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();

    // userId → sessionId  (reverse lookup — for targeted ETA pushes to a specific user)
    private final Map<Long, String> userSessionMap = new ConcurrentHashMap<>();

    // sessionId → driverId  (for driver state cleanup on driver disconnect)
    private final Map<String, Long> sessionDriverMap = new ConcurrentHashMap<>();

    // Rate limiter: only broadcast zone counts at most once every 2 seconds
    private static final long BROADCAST_INTERVAL_MS = 2_000;
    private final AtomicLong lastZoneBroadcast = new AtomicLong(0);

    private final ZoneCommuterService zoneCommuterService;
    private final DriverStateService driverStateService;
    private final EtaService etaService;

    public WebSocketConnectionHandler(ZoneCommuterService zoneCommuterService,
                                      DriverStateService driverStateService,
                                      EtaService etaService) {
        this.zoneCommuterService = zoneCommuterService;
        this.driverStateService = driverStateService;
        this.etaService = etaService;
    }

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        webSessions.put(session.getId(), session);
        System.out.println("Client connected: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        System.out.println("Client disconnected: " + session.getId());
        webSessions.remove(session.getId());

        // ── USER disconnect ──────────────────────────────────────────────────
        Long userId = sessionUserMap.remove(session.getId());
        if (userId != null) {
            userSessionMap.remove(userId);                          // clean reverse map
            List<ZoneCountDTO> updatedCounts = zoneCommuterService.removeUser(userId);
            etaService.clearUserEta(userId);                        // clean ETA state
            broadcastZoneCounts(updatedCounts, null);
            broadcastUserOffline(userId);
            System.out.println("User " + userId + " went offline.");
        }

        // ── DRIVER disconnect ────────────────────────────────────────────────
        Long driverId = sessionDriverMap.remove(session.getId());
        if (driverId != null) {
            driverStateService.removeDriver(driverId);
            etaService.clearDriverEtas(driverId);                   // clean affected users' ETA state
            broadcastDriverOffline(driverId);
            System.out.println("Driver " + driverId + " went offline — state cleared.");
        }
    }

    @Override
    public void handleMessage(WebSocketSession sender, WebSocketMessage<?> message) throws Exception {
        super.handleMessage(sender, message);

        try {
            // Parse the incoming JSON and inject the sender's sessionId
            ObjectNode payload = (ObjectNode) objectMapper.readTree(message.getPayload().toString());
            payload.put("sessionId", sender.getId());

            String enrichedMessage = objectMapper.writeValueAsString(payload);
            String role = payload.has("role") ? payload.get("role").asText() : "";

            // ── USER location update ─────────────────────────────────────────
            if ("USER".equals(role)
                    && payload.has("userId")
                    && payload.has("latitude")
                    && payload.has("longitude")) {

                Long userId = payload.get("userId").asLong();
                double latitude  = payload.get("latitude").asDouble();
                double longitude = payload.get("longitude").asDouble();

                // Keep both direction maps in sync
                sessionUserMap.put(sender.getId(), userId);
                userSessionMap.put(userId, sender.getId());

                List<ZoneCountDTO> updatedCounts = zoneCommuterService.updateUserLocation(userId, latitude, longitude);

                // Rate-limited broadcast: at most once every 2 seconds
                long now  = System.currentTimeMillis();
                long last = lastZoneBroadcast.get();
                if (now - last >= BROADCAST_INTERVAL_MS && lastZoneBroadcast.compareAndSet(last, now)) {
                    broadcastZoneCounts(updatedCounts, null);
                }
            }

            // ── DRIVER location update ───────────────────────────────────────
            if ("DRIVER".equals(role)
                    && payload.has("userId")     // DriverLocationDTO uses userId field
                    && payload.has("latitude")
                    && payload.has("longitude")) {

                Long driverId = payload.get("userId").asLong();
                double latitude  = payload.get("latitude").asDouble();
                double longitude = payload.get("longitude").asDouble();

                // Track session → driver (for disconnect cleanup)
                sessionDriverMap.put(sender.getId(), driverId);

                // Store driver position and derive speed from consecutive pings
                driverStateService.updateDriverLocation(driverId, latitude, longitude);

                // Compute ETAs for all online users and push only those that changed
                Map<Long, EtaDTO> etaUpdates = etaService.computeEtas();
                etaUpdates.forEach(this::sendEtaToUser);
            }

            // Broadcast the enriched message to all OTHER connected clients
            // (users need the driver's raw location to render the map marker)
            webSessions.forEach((id, session) -> {
                if (session != sender && session.isOpen()) {
                    try {
                        session.sendMessage(new TextMessage(enrichedMessage));
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            });

        } catch (Exception e) {
            System.err.println("Failed to parse message from " + sender.getId() + ": " + e.getMessage());
        }
    }

    // ── Private send helpers ─────────────────────────────────────────────────

    /**
     * Sends an ETA_UPDATE message privately to a single user's session.
     * No other client receives this message.
     *
     * @param userId the user to receive the ETA
     * @param etaDto the ETA payload to send
     */
    private void sendEtaToUser(Long userId, EtaDTO etaDto) {
        String sessionId = userSessionMap.get(userId);
        if (sessionId == null) return;

        WebSocketSession session = webSessions.get(sessionId);
        if (session == null || !session.isOpen()) return;

        try {
            WebSocketDTO<EtaDTO> wrapper = new WebSocketDTO<>("ETA_UPDATE", etaDto);
            String json = objectMapper.writeValueAsString(wrapper);
            session.sendMessage(new TextMessage(json));
        } catch (IOException e) {
            System.err.println("Failed to send ETA_UPDATE to user " + userId + ": " + e.getMessage());
        }
    }

    /**
     * Broadcasts the current zone commuter counts to all connected clients.
     *
     * @param counts  the updated zone count list
     * @param exclude a session to skip (null = broadcast to everyone)
     */
    private void broadcastZoneCounts(List<ZoneCountDTO> counts, WebSocketSession exclude) {
        try {
            WebSocketDTO<List<ZoneCountDTO>> wrapper = new WebSocketDTO<>("ZONE_COUNT", counts);
            String json = objectMapper.writeValueAsString(wrapper);
            TextMessage textMessage = new TextMessage(json);

            webSessions.forEach((id, session) -> {
                if (session != exclude && session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to broadcast zone counts: " + e.getMessage());
        }
    }

    /**
     * Broadcasts a DRIVER_OFFLINE event to all connected clients when a driver disconnects.
     * Frontend should clear the driver's map marker and any ETA countdown on receipt.
     *
     * @param driverId the ID of the driver that went offline
     */
    private void broadcastDriverOffline(Long driverId) {
        try {
            WebSocketDTO<Long> wrapper = new WebSocketDTO<>("DRIVER_OFFLINE", driverId);
            String json = objectMapper.writeValueAsString(wrapper);
            TextMessage textMessage = new TextMessage(json);

            webSessions.forEach((id, session) -> {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to broadcast DRIVER_OFFLINE for driver " + driverId + ": " + e.getMessage());
        }
    }

    /**
     * Broadcasts a USER_OFFLINE event to all connected clients when a user disconnects.
     * Frontend should clear the user's map marker on receipt.
     *
     * @param userId the ID of the user that went offline
     */
    private void broadcastUserOffline(Long userId) {
        try {
            WebSocketDTO<Long> wrapper = new WebSocketDTO<>("USER_OFFLINE", userId);
            String json = objectMapper.writeValueAsString(wrapper);
            TextMessage textMessage = new TextMessage(json);

            webSessions.forEach((id, session) -> {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to broadcast USER_OFFLINE for user " + userId + ": " + e.getMessage());
        }
    }
}