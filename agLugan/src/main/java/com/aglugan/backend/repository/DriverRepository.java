package com.aglugan.backend.repository;

import com.aglugan.backend.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    Optional<Driver> findByGoogleSub(String googleSub);
}
