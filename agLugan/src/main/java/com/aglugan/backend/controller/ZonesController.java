package com.aglugan.backend.controller;

import com.aglugan.backend.entity.Zones;
import com.aglugan.backend.service.ZonesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ZonesController {

    private final ZonesService zonesService;

    public ZonesController(ZonesService zonesService) {
        this.zonesService = zonesService;
    }

    @GetMapping("/getzones")
    public ResponseEntity<List<Zones>> getALlZones() {
        List<Zones> zones = zonesService.getAllZones();
        return ResponseEntity.status(200).body(zones);
    }
}
