package com.aglugan.backend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import com.aglugan.backend.dto.LocationUpdateDTO;

@RestController
@RequestMapping("/api/driver")
public class DriverController {

    @PostMapping("/location-update")
    public ResponseEntity<String> updateLocation(@RequestBody LocationUpdateDTO location) {

        System.out.println("Received location: ");
        System.out.println("User ID: " + location.getUserId());
        System.out.println("Lat: " + location.getLatitude());
        System.out.println("Lng: " + location.getLongitude());
        System.out.println("Role: " + location.getRole());
        return ResponseEntity.ok("Succesfully Updated Location");
    }

}
