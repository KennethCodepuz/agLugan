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

    private String username;

    private String phoneNumber;

    protected User() {}
    public User(String googleSub, String name, String email, String role, String profilePicture, String username, String phoneNumber) {
        this.googleSub = googleSub;
        this.name = name;
        this.email = email;
        this.profilePicture = profilePicture;
        this.role = role;
        this.username = username;
        this.phoneNumber = phoneNumber;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                "googleSub='" + googleSub + '\'' +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", profilePicture='" + profilePicture + '\'' +
                '}';
    }

//    getters

    public long getId() { return id; }
    public String getGoogleSub() { return googleSub; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getProfilePicture() { return profilePicture; }
    public String getUsername() { return username; }
    public String getPhoneNumber() { return phoneNumber; }
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

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

}
