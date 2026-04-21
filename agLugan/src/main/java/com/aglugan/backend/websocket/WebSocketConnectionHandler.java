package com.aglugan.backend.websocket;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

import com.aglugan.backend.dto.ZoneCountDTO;
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

    // ConcurrentHashMap: thread-safe — multiple users can connect simultaneously
    private final Map<String, WebSocketSession> webSessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Tracks which userId is tied to which sessionId (for disconnect cleanup)
    private final Map<String, Long> sessionUserMap = new ConcurrentHashMap<>();

    // Rate limiter: only broadcast zone counts at most once every 2 seconds
    private static final long BROADCAST_INTERVAL_MS = 2_000;
    private final AtomicLong lastZoneBroadcast = new AtomicLong(0);

    private final ZoneCommuterService zoneCommuterService;

    public WebSocketConnectionHandler(ZoneCommuterService zoneCommuterService) {
        this.zoneCommuterService = zoneCommuterService;
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

        // If this session belonged to a USER, remove them from zone counts immediately
        Long userId = sessionUserMap.remove(session.getId());
        if (userId != null) {
            List<ZoneCountDTO> updatedCounts = zoneCommuterService.removeUser(userId);
            broadcastZoneCounts(updatedCounts, null);
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

            // Check if this is a USER location update
            if (payload.has("role") && "USER".equals(payload.get("role").asText())
                    && payload.has("userId") && payload.has("latitude") && payload.has("longitude")) {

                Long userId = payload.get("userId").asLong();
                double latitude = payload.get("latitude").asDouble();
                double longitude = payload.get("longitude").asDouble();

                // Track which session belongs to this user (for disconnect cleanup)
                sessionUserMap.put(sender.getId(), userId);

                // Update zone counts
                List<ZoneCountDTO> updatedCounts = zoneCommuterService.updateUserLocation(userId, latitude, longitude);

                // Rate-limited broadcast: only send if 2 seconds have passed since last broadcast
                long now = System.currentTimeMillis();
                long last = lastZoneBroadcast.get();
                if (now - last >= BROADCAST_INTERVAL_MS && lastZoneBroadcast.compareAndSet(last, now)) {
                    broadcastZoneCounts(updatedCounts, null);
                }
            }

            // Broadcast the original enriched message to all OTHER connected clients (driver location, etc.)
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

    /**
     * Broadcasts the current zone commuter counts to all connected clients.
     * @param counts the updated zone count list
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
}