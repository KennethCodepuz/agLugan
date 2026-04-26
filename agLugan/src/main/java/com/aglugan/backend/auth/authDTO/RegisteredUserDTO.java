package com.aglugan.backend.auth.authDTO;

public class RegisteredUserDTO {
    private final Long id;
    private final String username;
    private final String name;
    private final String email;
    private final String role;
    private final String profilePicture;
    private final String phoneNumber;
    private String sessionToken;

    public RegisteredUserDTO(Long id, String username, String name, String email,
                             String role, String profilePicture, String phoneNumber) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.email = email;
        this.role = role;
        this.profilePicture = profilePicture;
        this.phoneNumber = phoneNumber;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getProfilePicture() { return profilePicture; }
    public String getPhoneNumber() { return phoneNumber; }
    
    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }
}