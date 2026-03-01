package com.aglugan.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name="zones")
public class Zones {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public double longitude;
    public double latitude;
    public String classification;
    public String location;
    public String imageurl;

    public Zones() {}
    public Zones(Long id, double longitude, double latitude, String classification, String location, String imageurl) {
        this.id = id;
        this.longitude = longitude;
        this.latitude = latitude;
        this.classification = classification;
        this.location = location;
        this.imageurl = imageurl;
    }

    public Long getId() { return id; }

    public double getLongitude() { return longitude; }

    public double getLatitude() { return latitude; }

    public String getClassification() { return classification; }

    public String getLocation() { return location; }

    public String getImageurl() { return imageurl; }

    public void setId(Long id) { this.id = id; }

    public void setLongitude(double longitude) { this.longitude = longitude; }

    public void setLatitude(double latitude) { this.latitude = latitude; }

    public void setClassification(String classification) { this.classification = classification; }

    public void setLocation(String location) { this.location = location; }

    public void setImageurl(String imageurl) { this.imageurl = imageurl; }

    @Override
    public String toString() {
        return "Zones: { id = " + id +
                ", longitude = " + longitude + '\'' +
                ", latitude = " + latitude + '\'' +
                ", classification = " + classification + '\'' +
                ", location =" + location + '\'' +
                ", imageUrl = " + imageurl + " }";
    }
}
