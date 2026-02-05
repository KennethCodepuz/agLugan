package com.aglugan.backend.dto;


public class LocationUpdateDTO {

    private Long userId;
    private double longitude;
    private double latitude;
    private String role;

    public LocationUpdateDTO(){}
    public LocationUpdateDTO(Long userId, double longitude, double latitude, String role) {
        this.userId = userId;
        this.longitude = longitude;
        this.latitude = latitude;
        this.role = role;
    }

//    getters
    public Long getUserId() { return userId; }

    public double getLongitude() { return longitude; }

    public double getLatitude() { return latitude; }

    public String getRole() { return role; }

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

}
