package com.aglugan.backend.dto;

public class ZonesDTO {

    public Long id;
    public double longitude;
    public double latitude;
    public String classication;
    public String location;
    public String imageurl;

    public ZonesDTO() {}
    public ZonesDTO(Long id, double longitude, double latitude, String classication, String location, String imageurl) {
        this.id = id;
        this.longitude = longitude;
        this.latitude = latitude;
        this.classication = classication;
        this.location = location;
        this.imageurl = imageurl;
    }

    public Long getId() { return id; }

    public double getLongitude() { return longitude; }

    public double getLatitude() { return latitude; }

    public String getClassication() { return classication; }

    public String getLocation() { return location; }

    public String getImageurl() { return imageurl; }

    public void setId(Long id) { this.id = id; }

    public void setLongitude(double longitude) { this.longitude = longitude; }

    public void setLatitude(double latitude) { this.latitude = latitude; }

    public void setClassication(String classication) { this.classication = classication; }

    public void setLocation(String location) { this.location = location; }

    public void setImageurl(String imageurl) { this.imageurl = imageurl; }

}
