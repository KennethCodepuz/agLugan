package com.aglugan.backend.websocket;

import java.io.IOException;
import java.util.HashMap;

import org.jspecify.annotations.NonNull;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class WebSocketConnectionHandler extends TextWebSocketHandler {

    HashMap<String, WebSocketSession> webSessions = new HashMap<>();

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

        webSessions.forEach((id, session) -> {
            if (session != sender && session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message.getPayload().toString()));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        });
    }

}
