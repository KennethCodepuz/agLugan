package com.aglugan.backend.dto;


public class UserLocationDTO {

    private Long userId;
    private double longitude;
    private double latitude;
    private String role;
    private double accuracy;
    private Long timestamp;

    public UserLocationDTO(){}
    public UserLocationDTO(Long userId, double longitude, double latitude, String role, double accuracy, Long timestamp) {
        this.userId = userId;
        this.longitude = longitude;
        this.latitude = latitude;
        this.role = role;
        this.accuracy = accuracy;
        this.timestamp = timestamp;
    }

    //    getters
    public Long getUserId() { return userId; }

    public double getLongitude() { return longitude; }

    public double getLatitude() { return latitude; }

    public String getRole() { return role; }

    public double getAccuracy() { return accuracy; }

    public Long getTimestamp() { return timestamp; }

    //    Setters
    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setLongtitude(double longitude) {
        this.longitude = longitude;
    }

    public void setLattitude(double latitude) {
        this.latitude = latitude;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public void setAccuracy(double accuracy) { this.accuracy = accuracy; }

    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

}
