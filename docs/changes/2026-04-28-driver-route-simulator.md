# Feature: Driver Route Simulator Console

Date: 2026-04-28

---

## Summary

Created a standalone HTML simulator (`simulation/driver-sim-console.html`) for UAT and demo purposes. The console connects to the Spring Boot WebSocket backend and simulates one or more jeepney drivers driving along the real Laoag City route defined in `simulation/routes.txt`. Drivers send the exact `{ role: "DRIVER", userId, latitude, longitude, accuracy }` payload the backend expects, causing live 🚐 markers to appear and move on the mobile app map in real time.

---

## Files Modified

- `simulation/driver-sim-console.html` — new file (simulator console)
- `simulation/routes.txt` — reference data (not modified by code, coordinates fixed by user)

---

## Code Changes

### New File Created: `simulation/driver-sim-console.html`

**Key features implemented:**

1. **Route Playback** — Walks through all 31 shared waypoints then randomly takes Path A (7 extra points) or Path B (13 extra points) at the intersection. Loops back on completion with a new coin-flip.

2. **Linear Interpolation (Smooth Movement)** — Between every pair of waypoints, N sub-points are generated using `lat1 + (lat2-lat1)*t`. Each sub-point is sent as a separate GPS ping, making the map marker glide smoothly rather than jump.

3. **Randomize Start Toggle** — When enabled, each new driver is assigned a random starting waypoint (1–31) so multiple drivers are staggered and don't all travel together.

4. **Speed Slider** — Controls the interval between sub-pings: `interval = 30000 / speedKmh ms`. Range: 10–120 km/h.

5. **Smoothness Input** — Controls how many sub-points are interpolated between each pair of real waypoints (default: 20, max: 100).

6. **Multiple Drivers** — Each driver tracks its own state (`subIdx`, `interp`, `path`, `startIdx`, `speedKmh`, `steps`). Drivers can be added and stopped independently.

7. **Log Panel** — Logs every 5th sub-ping to avoid flooding; always logs connection events, loop restarts, and driver add/stop events.

**WebSocket payload sent per sub-ping:**
```json
{ "role": "DRIVER", "userId": 1, "latitude": 18.196042, "longitude": 120.592657, "accuracy": 5 }
```

---

## Why This Was Necessary

The existing `ws-test-console.html` only simulates a driver moving in a straight line with configurable lat/lon steps. For UAT demos, stakeholders need to see jeepney markers moving along the actual Laoag City road route, branching at the real intersection, and looping — matching real-world behavior.

---

    git commit -m 'feat: add driver route simulator console for UAT demos (simulation/driver-sim-console.html)'
