package com.aglugan.backend.websocket.websocketDTO;

public class WebSocketDTO<T> {

    private String type;
    private T data;

    // Constructors
    public WebSocketDTO() {
    }

    public WebSocketDTO(String type, T data) {
        this.type = type;
        this.data = data;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}