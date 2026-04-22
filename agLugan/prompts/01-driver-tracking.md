# Driver Tracking — Gap Fixes

**Feature area:** WebSocket / Real-time  
**Status:** Implemented  
**Files added/modified:** `GeoUtils.java`, `DriverState.java`, `DriverStateService.java`, `WebSocketConnectionHandler.java`, `ZoneCommuterService.java`

---

## Problem

The original `WebSocketConnectionHandler` had three critical gaps when it came to driver location handling:

1. **No driver state in memory** — The backend blindly rebroadcast driver GPS messages without ever storing the driver's position. Any user connecting *after* the last driver ping had no way to know where the driver was until the next ping. More importantly, the backend had no data to compute ETAs from.

2. **No session-to-driver mapping** — There was a `sessionUserMap` for users but no equivalent for drivers. When a driver disconnected, their "ghost" state remained in memory indefinitely and connected users were never notified.

3. **No driver message validation** — DRIVER messages were never explicitly parsed or validated. The handler just passed them through. A malformed message (missing `latitude`, `longitude`, or `userId`) would silently be rebroadcast corrupted.

---

## Solution

### `GeoUtils.java` — `com.aglugan.backend.util`
Extracted the Haversine formula from `ZoneCommuterService` into a shared utility class. Both `ZoneCommuterService` and `DriverStateService` (and later `EtaService`) use this, eliminating duplication.

```java
GeoUtils.haversineDistance(lat1, lon1, lat2, lon2) // returns metres
```

---

### `DriverState.java` — `com.aglugan.backend.service`
Immutable snapshot of a driver's position at a point in time. A new instance is created on every GPS ping — no setters.

Key fields:
| Field | Type | Description |
|---|---|---|
| `driverId` | `long` | Driver's database ID |
| `latitude` / `longitude` | `double` | Current GPS position |
| `speedMs` | `double` | Instantaneous speed in m/s, derived from consecutive pings |
| `lastPingTime` | `long` | `System.currentTimeMillis()` when this state was recorded |

```java
driver.isStopped() // true when speedMs < 0.5 m/s (≈ 1.8 km/h)
```
The `isStopped()` threshold filters out GPS drift while the vehicle is stationary.

---

### `DriverStateService.java` — `com.aglugan.backend.service`
In-memory registry of all active drivers. No database involved.

```java
driverStateService.updateDriverLocation(driverId, lat, lon) // called on every GPS ping
driverStateService.removeDriver(driverId)                   // called on disconnect
driverStateService.getActiveDrivers()                       // read-only view
driverStateService.getDriver(driverId)                      // single driver lookup
```

Speed is computed from the displacement between the previous and current ping positions divided by elapsed time:
```
speed (m/s) = distance (m) / (timeDelta (ms) / 1000)
```
On the first ping from a driver, speed is `0.0` (no previous position to compare).

---

### `WebSocketConnectionHandler.java` — Changes
- Added `sessionDriverMap: Map<String, Long>` (sessionId → driverId)
- Added explicit `role: DRIVER` validation block in `handleMessage()` — mirrors the `USER` block
- On driver disconnect: calls `driverStateService.removeDriver()` and broadcasts `DRIVER_OFFLINE`

### `ZoneCommuterService.java` — Changes
- `getZones()` promoted from `private` to `public` (needed by `EtaService`)
- Added `getUserZoneMap()` returning an unmodifiable view of `userZoneMap`

---

## WebSocket Message: `DRIVER_OFFLINE`
Broadcast to **all** connected clients when a driver's session closes.

```json
{
  "type": "DRIVER_OFFLINE",
  "data": 7
}
```
Frontend should remove the driver's map marker when this is received.

---

## Notes
- Driver messages still use `userId` (not `driverId`) because `DriverLocationDTO` was already defined this way. Changing it would be a breaking change on the frontend.
- All state is purely in-memory. If the server restarts, driver state is lost — drivers must reconnect and send at least one ping to reappear.
