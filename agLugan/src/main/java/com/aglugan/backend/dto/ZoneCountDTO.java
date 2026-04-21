package com.aglugan.backend.dto;

public class ZoneCountDTO {

    private Long zoneId;
    private String location;
    private double latitude;
    private double longitude;
    private double radius;
    private int commuterCount;

    public ZoneCountDTO() {}

    public ZoneCountDTO(Long zoneId, String location, double latitude, double longitude, double radius, int commuterCount) {
        this.zoneId = zoneId;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.radius = radius;
        this.commuterCount = commuterCount;
    }

    // Getters
    public Long getZoneId() { return zoneId; }
    public String getLocation() { return location; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public double getRadius() { return radius; }
    public int getCommuterCount() { return commuterCount; }

    // Setters
    public void setZoneId(Long zoneId) { this.zoneId = zoneId; }
    public void setLocation(String location) { this.location = location; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public void setRadius(double radius) { this.radius = radius; }
    public void setCommuterCount(int commuterCount) { this.commuterCount = commuterCount; }
}
