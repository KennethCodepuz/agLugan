package com.aglugan.backend.websocket;

import java.io.IOException;
import java.util.HashMap;

import org.jspecify.annotations.NonNull;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class WebSocketConnectionHandler extends TextWebSocketHandler {

    private final HashMap<String, WebSocketSession> webSessions = new HashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(@NonNull WebSocketSession session) throws Exception {
        webSessions.put(session.getId(), session);
        System.out.println("Client connected: " + session.getId());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        System.out.println("Client disconnected: " + session.getId());
        webSessions.remove(session.getId());
    }

    @Override
    public void handleMessage(WebSocketSession sender, WebSocketMessage<?> message) throws Exception {
        super.handleMessage(sender, message);

        try {
            // Parse the incoming JSON and inject the sender's sessionId
            ObjectNode payload = (ObjectNode) objectMapper.readTree(message.getPayload().toString());
            payload.put("sessionId", sender.getId());

            String enrichedMessage = objectMapper.writeValueAsString(payload);

            // Broadcast to all OTHER connected clients
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
}