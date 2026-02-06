package com.aglugan.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name="users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;


    @Column(unique = true, nullable = false)
    private String googleSub;

    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String email;

    @Column(nullable = false)
    private String role;

    private String profilePicture;

    protected User() {}
    public User(String googleSub, String name, String email, String role, String profilePicture) {
        this.googleSub = googleSub;
        this.name = name;
        this.email = email;
        this.profilePicture = profilePicture;
        this.role = role;
    }

//    getters
    public String getGoogleSub() { return googleSub; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getProfilePicture() { return profilePicture; }

//    setters

    public void setGoogleSub(String googleSub) {
        this.googleSub = googleSub;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
