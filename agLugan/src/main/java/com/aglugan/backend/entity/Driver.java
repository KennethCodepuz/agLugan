package com.aglugan.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name="drivers")
public class Driver {

    @Id
    private Long id;

    private String name;
    private String email;
    private String role;

}
