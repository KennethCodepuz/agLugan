package com.aglugan.backend.controller;

import com.aglugan.backend.dto.DriverLocationDTO;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/driver")
public class DriverController {

    @PostMapping("/location-update")
    public ResponseEntity<String> updateLocation(@RequestBody DriverLocationDTO location) {

        System.out.println("Received location: ");
        System.out.println("User ID: " + location.getUserId());
        System.out.println("Lat: " + location.getLatitude());
        System.out.println("Lng: " + location.getLongitude());
        System.out.println("Role: " + location.getRole());
        return ResponseEntity.ok("Succesfully Updated Location");
    }

}
