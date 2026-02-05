package com.aglugan.backend.auth.authDTO;

public class GoogleUserDTO {

    private String id;
    private String name;
    private String email;
    private String profilePicture;
    private String role;

    public GoogleUserDTO() {}
    public GoogleUserDTO(String id, String name, String email, String profilePicture, String role) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.profilePicture = profilePicture;
        this.role = role;
    }

//    getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getProfilePicture() { return profilePicture; }
    public String getRole() { return role; }

//    setters
    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public void setRole(String role) { this.role = role; }
}
