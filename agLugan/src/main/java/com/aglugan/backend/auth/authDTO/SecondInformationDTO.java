package com.aglugan.backend.auth.authDTO;

import jakarta.validation.constraints.*;

public class SecondInformationDTO {

    @NotBlank(message = "tempToken is required")
    public String tempToken;

    public String role;

    @NotNull(message = "Name cannot be null")
    @Size(min = 2, max = 50, message = "Name must be 2-50 characters")
    public String username;


    @Pattern(regexp = "^(\\+63|0)?9\\d{9}$",
            message = "Invalid mobile number")
    public String phoneNumber;


    public String vehicleNumber;
    public String licensePlate;
    public String driversLicense;

    public SecondInformationDTO() {}
    public SecondInformationDTO(String tempToken, String role, String username, String phoneNumber, String vehicleNumber, String licensePlate, String driversLicense) {
        this.tempToken = tempToken;
        this.role = role;
        this.username = username;
        this.phoneNumber = phoneNumber;
        this.vehicleNumber = vehicleNumber;
        this.licensePlate = licensePlate;
        this.driversLicense = driversLicense;
    }

    public String getDriversLicense() { return driversLicense; }

    public String getLicensePlate() { return licensePlate; }

    public String getPhoneNumber() { return phoneNumber; }

    public String getRole() { return role; }

    public String gettempToken() { return tempToken; }

    public String getUsername() { return username; }

    public String getVehicleNumber() { return vehicleNumber; }

    public void setDriversLicense(String driversLicense) { this.driversLicense = driversLicense; }

    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }

    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public void setRole(String role) { this.role = role; }

    public void settempToken(String tempToken) { this.tempToken = tempToken; }

    public void setUsername(String username) { this.username = username; }

    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    @Override
    public String toString() {
        return "Information: { " +
                "tempToken: " + tempToken + '\'' +
                "role: " + role + '\'' +
                "username: " + username + '\'' +
                "phoneNumber: " + phoneNumber + '\'' +
                "vehicleNumber: " + vehicleNumber + '\'' +
                "licensePlate: " + licensePlate + '\'' +
                "diversLicense: " + driversLicense + '\'' +
                " }";

    }
}
