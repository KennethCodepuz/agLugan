package com.aglugan.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name="drivers")
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String googleSub;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String role;

    private String profilePicture;

    private String username;

    private String phoneNumber;

    public String vehicleNumber;

    public String licensePlate;

    public String driversLicense;

    public Driver() {}
    public Driver(String googleSub, String name, String email, String role, String profilePicture, String username, String phoneNumber, String vehicleNumber, String licensePlate, String driversLicense) {
        this.googleSub = googleSub;
        this.name = name;
        this.email = email;
        this.role = role;
        this.profilePicture = profilePicture;
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.vehicleNumber = vehicleNumber;
        this.licensePlate = licensePlate;
        this.driversLicense = driversLicense;
    }

    public String getGoogleSub() { return googleSub; }

    public String getName() { return name; }

    public String getEmail() { return email; }

    public String getRole() { return role; }

    public String getProfilePicture() { return profilePicture; }

    public String getUsername() { return username; }

    public String getPhoneNumber() { return phoneNumber; }

    public String getVehicleNumber() { return vehicleNumber; }

    public String getLicensePlate() { return licensePlate; }

    public String getDriversLicense() { return driversLicense; }

    public void setGoogleSub(String googleSub) { this.googleSub = googleSub; }

    public void setName(String name) { this.name = name; }

    public void setEmail(String email) { this.email = email; }

    public void setRole(String role) { this.role = role; }

    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public void setUsername(String username) { this.username = username; }

    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public void setDriversLicense(String driversLicense) { this.driversLicense = driversLicense; }
}
