# CareNear Driver — mobile UI preview

## Scope

This is an isolated, mobile-first **driver interface** inside the existing CareNear project at `/driver`. It is a coherent visual prototype with interactive local state, NOT a live emergency service or a verified driver account.

The citizen app keeps its own navigation and workflows. Drivers eventually authenticate through a separate role-based application sharing a secure backend with the dispatch centre and clinical crew.

## Connected UI screens

1. **Shift overview** — driver status, assigned unit, readiness, active call and quick access.
2. **Vehicle inspection** — tyres, fuel, lights, radio and readiness check. Shift cannot start before checks.
3. **Available for dispatch** — clear online/offline status and a deliberately triggered training assignment.
4. **Incoming dispatch** — urgent sample incident, area, destination and accept/decline controls.
5. **Assignment accepted** — incident details and map before departure.
6. **En route** — Leaflet route illustration, external maps navigation button, explicit scene arrival.
7. **At scene** — nonclinical vehicle/crew coordination and readiness to transport.
8. **Transport to hospital** — sample receiving destination and external navigation.
9. **At hospital / complete** — driver-side logistics closeout, never medical handover verification.
10. **Activity and profile** — local training shift history, unit ID and connection disclaimers.

The driver bottom navigation uses Home, Dispatch, Vehicle and Activity. Profile is available from the header. A dedicated `/driver` route keeps the citizen experience separate.

## Data and safety

- Sample assignment: `CN-TRAIN-001`, sample unit `CN-TRAIN-01`. Both are fictional.
- A driver can only change local preview stages through valid state transitions.
- Leaflet displays static example route geometry, not live vehicle movement or a real ETA.
- The external navigation button opens an example coordinate in Google Maps for demonstration. It does not send any instructions to an ambulance.
- No real driver information, personal licence numbers or patient medical records appear.
- Driver-side completion is logistics-only. Clinical triage, patient information and handover require the qualified paramedic and authorised facility.
- The preview is accessible without authentication **because it cannot dispatch or modify live services**. All real driver routes must be behind identity, vehicle assignment, role permissions and audit logging before release.
- The state and trip log live in memory and reset on refresh.

## Next stage for a production driver app

- Authenticated driver onboarding, licences verified privately by administrators, fleet/shift assignment.
- Dispatch backend with offer expiry, safe rejection reasons, acknowledgment and collision-safe assignments.
- Current vehicle GPS telemetry, timestamp, stale signal handling, rerouting and accurate ETA via a contracted map provider.
- Dispatch-to-driver contact, voice channel and offline communications fallback.
- Driver/paramedic separation of duties, hospital selection and verified handover.
- Defect reporting, vehicle out-of-service workflow, incident audit events and shift logs.
- Connectivity-aware dispatch with strict non-delivery handling, resilient acknowledgements and manual operator fallback.
- Real mobile device testing under poor connectivity, bright daylight, gloves, screen-reader use and moving-vehicle safety. Do not encourage touch interaction while driving.

The current frontend deliberately avoids active GPS tracking, automatic assignment or simulated moving vehicle markers as evidence of a real emergency response.
