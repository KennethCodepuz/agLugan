# ETA Feature

**Feature area:** WebSocket / Real-time  
**Status:** Implemented  
**Files added/modified:** `EtaDTO.java`, `EtaService.java`, `WebSocketConnectionHandler.java`, `ZoneCommuterService.java`

---

## Overview

When a driver sends a GPS ping, the backend calculates an estimated time of arrival (ETA) in seconds for every online user to their nearest driver, then pushes that ETA **privately** to each user's WebSocket session. The frontend counts down locally and only receives a new ETA when it changes by more than **20 seconds**, or when the driver's moving/stopped state changes.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **Event-driven, not scheduled** | ETA is only computed when a driver GPS ping arrives. No background thread or `@Scheduled` task needed. Keeps computation proportional to actual activity. |
| **Per-user private push** | Each `ETA_UPDATE` is sent only to the specific user it belongs to via `sendEtaToUser()`. Other users never see it. |
| **Frontend counts down** | Backend sends seconds-remaining, frontend runs the countdown timer. This eliminates continuous server pushes and makes the UI feel responsive even between pings. |
| **20-second threshold** | Backend only re-sends an ETA when the new value differs from the last sent by ≥ 20 seconds, OR the paused state changes. Prevents unnecessary traffic on every 3s ping. |
| **Nearest driver wins** | Each user is assigned the driver with the smallest Haversine distance to their zone. With ≤ 10 active drivers and zone-based destinations, this O(users × drivers) loop is negligible. |
| **Zone as destination** | Users wait at fixed zones, so the ETA target is the zone's centre coordinates — not the user's live GPS position. This is stable and doesn't require re-fetching user location for ETA calculation. |
| **No circular dependency** | `EtaService` does not inject `WebSocketConnectionHandler`. It returns a `Map<userId, EtaDTO>` and the handler delivers them. Clean separation. |

---

## Files

### `EtaDTO.java` — `com.aglugan.backend.dto`
The payload pushed to a user on an ETA update.

```json
{
  "type": "ETA_UPDATE",
  "data": {
    "userId":     12,
    "driverId":   7,
    "etaSeconds": 145,
    "paused":     false
  }
}
```

| Field | Description |
|---|---|
| `userId` | The user this ETA belongs to |
| `driverId` | The nearest driver this ETA is derived from |
| `etaSeconds` | Seconds until the driver reaches the user's zone |
| `paused` | `true` when the driver is stationary — frontend should freeze countdown |

---

### `EtaService.java` — `com.aglugan.backend.service`

**Core method:** `computeEtas() → Map<Long, EtaDTO>`  
Called by `WebSocketConnectionHandler` on every valid DRIVER ping.

**Algorithm per user:**
```
1. Get user's zone from ZoneCommuterService.getUserZoneMap()
2. Find nearest active driver (min Haversine distance to zone centre)
3. If driver.isStopped():
       etaSeconds = last known ETA (frozen)
       paused = true
   else:
       etaSeconds = distance(m) / driver.speedMs
       paused = false
4. If |etaSeconds - lastSent| >= 20  OR  paused changed:
       add to updates map
```

**In-memory state:**
```java
Map<Long, Integer> lastSentEtaMap    // userId → last pushed etaSeconds
Map<Long, Boolean> lastSentPausedMap // userId → last pushed paused state
Map<Long, Long>    userDriverMap     // userId → driverId (for targeted cleanup)
```

**Cleanup methods:**
```java
etaService.clearUserEta(userId)      // called on user disconnect
etaService.clearDriverEtas(driverId) // called on driver disconnect — only clears
                                     // state for users who were tracking that driver
```

---

### `WebSocketConnectionHandler.java` — Changes

- **`userSessionMap: Map<Long, String>`** (userId → sessionId) — reverse lookup for private ETA delivery. Kept in sync with `sessionUserMap` at all times.
- **`sendEtaToUser(userId, etaDto)`** — looks up the session and sends an `ETA_UPDATE` message to that user only.
- **DRIVER ping trigger** — after `driverStateService.updateDriverLocation()`, calls `etaService.computeEtas()` and delivers each result via `sendEtaToUser()`.
- **Disconnect cleanup** — user disconnect removes from `userSessionMap` and calls `clearUserEta()`; driver disconnect calls `clearDriverEtas()`.

---

### `ZoneCommuterService.java` — Changes

- `getZones()` promoted from `private` → `public` so `EtaService` can access the cached zone list.
- `getUserZoneMap()` added — returns unmodifiable view of `userZoneMap` (userId → zoneId).

---

## WebSocket Message Contract

### `ETA_UPDATE` — sent **privately** to one user
```json
{ "type": "ETA_UPDATE", "data": { "userId": 12, "driverId": 7, "etaSeconds": 145, "paused": false } }
```

### `DRIVER_OFFLINE` — broadcast to **all** clients
```json
{ "type": "DRIVER_OFFLINE", "data": 7 }
```
On receipt: clear the ETA countdown and remove driver map marker.

---

## Edge Cases

| Case | Behaviour |
|---|---|
| Driver's first ping (speed = 0, no previous state) | ETA not sent — paused=true but no lastSentEta yet, so skip |
| User not in any zone | ETA not sent — no fixed destination coordinate |
| Driver arrives at zone | `etaSeconds = 0` sent once; state cleared from map |
| Driver goes offline | `clearDriverEtas()` resets affected users' state so they get fresh ETA from next nearest driver on next ping |
| User disconnects | `clearUserEta()` removes all ETA state for that user |
| No active drivers | `computeEtas()` fast-exits with empty map |

---

## Scalability Note
Current implementation is O(users × drivers) per driver ping.
At launch target (≤ 10 drivers, ≤ 50–100 concurrent users), each computation
takes microseconds. A spatial index (e.g. R-tree or grid bucketing) should be
added when driver/user counts grow significantly in production.
