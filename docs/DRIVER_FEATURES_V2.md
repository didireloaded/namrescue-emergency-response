# CareNear Driver V2 — Operations and safety

This is the next iteration of the driver interface at `/driver`. It uses the established CareNear design and the existing TanStack Start / React / Leaflet code. All changes are interactive **training UI**, not authorised emergency operations.

## Implemented in the UI

### Dispatch and assignments
- A sample dispatch displays pickup coordinates, training priority, hospital destination, patient requirements, approach notes, required equipment and caution flags in one place.
- The sample assignment appears as an on-screen alert with **one-tap Accept**, Decline and Review details.
- The driver can update the local dispatch state through Accepted → En Route → At Scene → Transporting → At Hospital → Completed. Driver stages cannot skip required transitions.
- Timestamps for each simulated status change are retained in the local session and in a completed trip timeline.

### Navigation and routing
- Leaflet shows an illustrative route to the scene or destination, with an external Google Maps directions link.
- Optional external Street View lookup is provided and may not be available at every destination.
- Current road name, other units' ETAs and a true ambulance-sized route are explicitly unavailable.
- **Emergency routing exemptions are NOT applied.** Restricted roads/turns, vehicle height/width constraints and rural offline maps require authorised traffic rules, maintained fleet profiles and a verified routing service. Do not instruct drivers to violate road regulations based on this map.

### Communications
- New Comms tab shows a local sample-message log, four preset phrases and local incident status timeline.
- Messages are always labelled **not transmitted**. The browser online/offline hint is visible on Home, Dispatch and Comms but is **not confirmation of control-room reachability**.
- Voice PTT, media upload, live video and real two-way messages remain disabled until connected to authenticated services.

### Vehicle, equipment and fleet
- Five-item vehicle pre-shift checklist remains mandatory.
- Equipment area contains demo stock levels, minimum thresholds and optional expiry dates.
- A critical shortage, an expired item or overdue maintenance prevents starting a shift / loading a new sample dispatch.
- Reporting a defect locks the example unit out of new work. If available, it marks the driver off duty. A live system must require fleet/dispatcher authorisation to clear defects.
- Stock edits and maintenance-date changes are disabled while a response is active.

### Crew safety, shift handover and clinical boundary
- Crew safety screen provides a local welfare check-in, rest flag that prevents new sample assignments, and a disabled duress control.
- The duress control **does not alert anyone**. Likewise, no audio/video monitoring runs.
- Shift handover notes are session-only and explicitly exclude patient-identifying data.
- SBAR is displayed as a reference outline. Patient records, medication interventions, vitals, clinical QR handover, protocols and hospital prenotification are reserved for authorised paramedic/clinical users and services, not driver-only data entry.
- Trip history displays sample completed trips and local status timestamps. These are **not tamper-resistant legal audit logs**.

## What the backend must provide before production

1. **Verified identity and role model.** Separate dispatch operators, drivers, paramedics, fleet supervisors and hospital receiving staff. Vehicle/driver licensing and medical credentials should be verified privately. No driver should see patient data that is irrelevant to their duties.
2. **Authoritative dispatch delivery.** Signed/secure incident offers, server-side assignment locks, acknowledgement, expiry/reassignment rules, duplicate prevention and notifications. A user-facing alert may only say **Received** after an explicit server confirmation.
3. **Status events with transport receipts.** Every message has an idempotency key, incident/vehicle/actor ID, event time, server time and `local_unsent | sending | acknowledged | rejected` status. Never treat browser local state as an acknowledged dispatch update.
4. **Offline-first delivery.** Encryption at rest, storage limits, authentication revalidation, retry bounds, event expiry, event ordering and conflict resolution. Do not auto-apply stale status events that could mislead the control room. Provide direct radio/phone fallback when the gateway is unavailable.
5. **Dispatch connectivity.** WebSocket/SSE/push for incoming offers, authenticated two-way messages, robust reconnect and failover endpoints. An online browser indicator does not establish service reachability.
6. **Navigation-grade routing.** Accurate live GPS with last-seen timestamp and road name, contracted vehicle-specific maps, road restrictions verified for each class of ambulance, legal exemption policy, offline tile packages and hard safety constraints. Third-party imagery and Street View depend on provider coverage and terms.
7. **Fleet & equipment.** Signed inspection reports, defect reporting, fleet clearance, repair history, vehicle assignment, stock counts, expiry reminders and auditable shift handover.
8. **Clinical integration.** Encrypted patient records; SBAR and vitals for authorised personnel; hospital prenotification and short-lived, authenticated QR handover. No medical data should be inserted into driver messages or unprotected local storage.
9. **Safety monitoring.** Monitored duress with explicit acknowledgement, privacy-controlled audio/video, server-side welfare deadlines and fatigue-management policies. An unattended timer is unsafe when there is no backend monitor.
10. **Audit trail.** Append-only server logs and operational reporting with retention, consent, oversight and access controls.

## UI design rules

Keep the existing CareNear navy/white/red, strong typography, large touch targets and five-tab structure: Home, Dispatch, Comms, Vehicle and Activity. Crew Safety is accessible from Home and Profile. Do not add fake telemetry or animated routes that imply actual ambulance movement. Never display a misleading "sent", "live", "offline synced" or "monitoring active" badge before the relevant service confirms the state. The driver must pull over safely before interacting.

## Testing and remaining work

Driver operations tests cover pre-shift lockouts, inventory thresholds, expiry, maintenance, defect reporting, fatigue rest, local messaging and status history. These tests still need to pass in an actual CI or local build.

Production release remains blocked on official fleet/dispatch integration, encrypted server data, clinician-led protocol review and a full Namibia field test. The example incident and fleet ID are fictional.
