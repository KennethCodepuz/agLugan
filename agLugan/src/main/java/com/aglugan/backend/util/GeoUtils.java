package com.aglugan.backend.util;

/**
 * Shared geospatial utility methods.
 * Centralised here so both ZoneCommuterService and DriverStateService
 * can use the same Haversine implementation without duplication.
 */
public final class GeoUtils {

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    // Utility class — not instantiable
    private GeoUtils() {}

    /**
     * Haversine formula: calculates the great-circle distance in metres
     * between two GPS coordinates.
     *
     * @param lat1 latitude of point A (degrees)
     * @param lon1 longitude of point A (degrees)
     * @param lat2 latitude of point B (degrees)
     * @param lon2 longitude of point B (degrees)
     * @return distance in metres
     */
    public static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }
}
