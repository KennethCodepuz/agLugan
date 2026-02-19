package com.aglugan.backend.auth.authDTO;

public class GoogleUserDTO {

    private String googleSub;
    private String name;
    private String email;
    private String profilePicture;
    private String role;

    public GoogleUserDTO() {}
    public GoogleUserDTO(String googleSub, String name, String email, String profilePicture, String role) {
        this.googleSub = googleSub;
        this.email = email;
        this.name = name;
        this.profilePicture = profilePicture;
        this.role = role;
    }

    @Override
    public String toString() {
        return "googleUser{" +
                "googleSub=" + googleSub +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", profilePicture='" + profilePicture + '\'' +
                '}';
    }
//    getters
    public String getGoogleSub() { return googleSub; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getProfilePicture() { return profilePicture; }
    public String getRole() { return role; }

//    setters
    public void setId(String googleSub) { this.googleSub = googleSub; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public void setRole(String role) { this.role = role; }
}
