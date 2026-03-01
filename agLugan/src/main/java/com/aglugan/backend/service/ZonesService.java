package com.aglugan.backend.service;

import com.aglugan.backend.entity.Zones;
import com.aglugan.backend.repository.ZonesRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ZonesService {

    private final ZonesRepository zonesRepository;

    public ZonesService(ZonesRepository zonesRepository) {
        this.zonesRepository = zonesRepository;
    }

    public List<Zones> getAllZones() {
        return zonesRepository.findAll();
    }
}
