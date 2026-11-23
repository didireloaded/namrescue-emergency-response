# NamRescue citizen app — 60 feature register

UI direction: photographic iOS, native-feeling controls, minimal copy. Leaflet remains the map renderer. Mapping services are isolated for later Mapbox integration.

Statuses: **UI** means interactive app experience; **Preview** means simulated state, not real response; **Backend** means needs authenticated external integration; **Review** means needs clinical or localisation approval. UI does not imply production-ready.

## Emergency SOS
1. One-tap SOS — UI
2. Request for someone else — UI
3. Automatic GPS detection — UI
4. Manual location pin — UI
5. Emergency type selector — UI
6. Optional incident description — UI
7. Emergency dialer — UI, source-backed local/national contacts open native phone dialer; verify directory continuously
8. No-account emergency access — UI
9. Request acknowledgement — Preview
10. Duplicate submission protection — UI

## Live ambulance tracking
11. Tracking map — Preview
12. Arrival estimate — Preview
13. Road route — Preview
14. Response stages — UI, simulated data
15. Automatic ambulance telemetry — Backend
16. Vehicle registration and unit ID — Preview
17. Verified crew portraits — Preview imagery, real identities require integration
18. Contact dispatch — Backend
19. Arrival push alerts — Backend
20. Share live response with trusted contact — Backend

## Medical ID
21. Personal Medical ID — UI
22. Blood group — UI
23. Allergies — UI
24. Conditions — UI
25. Current medication — UI
26. Emergency contacts — UI
27. Protected sharing with medical crew — Backend

## Family & dependants
28. Add family member — UI
29. Request help for dependant — UI
30. Notify contacts during emergency — Backend
31. Temporary tracking permission — Backend
32. Caregiver and dependant notes — UI

## Location & map
33. Interactive map — UI (Leaflet)
34. Find current location — UI
35. Search Namibia places — UI (development geocoding)
36. Roadside accident detail — UI, scene presence, vehicles, injuries, direction and hazard notes
37. Measured location accuracy — UI
38. User-initiated location share — UI
39. Weak/offline service handling — Partial, errors shown; reliable delivery pending

## Communication
40. Request status notifications — Preview
41. En route updates — Preview
42. ETA change alerts — Backend
43. Dispatch messages — Backend
44. Call saved emergency contact — UI, native dialer with saved contact; local emergency service contacts use separate region-filtered directory
45. Network and service health — Partial

## Emergency guidance
46. First aid — Review, external Red Cross resources linked
47. CPR — Review, external guidance
48. Road accident safety — Review
49. Emergency preparation guidance — Partial
50. Official dispatcher instructions — Backend

## Requests and account
51. Resume active incident — UI
52. Previous incident history — UI, session-only
53. Unique reference ID — UI, local preview
54. Cancel request — UI before assignment, authoritative acknowledgement pending
55. Language preferences — UI picker, translations pending
56. Accessibility — Partial, touch targets, reduced motion and semantics; full audit pending
57. Privacy controls — UI, server-side enforcement pending
58. Profile management — UI with onboarding, optional avatar, home region/town, medical history and medical aid details
59. Post-response feedback — UI after explicit response completion, session-only rating/comments; authenticated service submission remains backend-dependent
60. Support — UI, connection status explained

## Security and operational constraints
This repository is the product UI, NOT an authorised emergency dispatch service yet. Never suggest a real ambulance has been assigned until a live, approved dispatch centre confirms it. All existing ambulance tracking, crew profiles, response ETAs and case references are simulated.

Sensitive citizen names, photos, medical history, contacts, and dependants are held in memory during the current session only. No localStorage is used for medical information. These values are not persistently saved or transmitted. Before release, implement authenticated encrypted records, role-based access, consent, retention and deletion, audit trails, and legal review.

Development services use public OpenStreetMap/Nominatim and OSRM access. A supported routing/geocoding service or private proxy is required before launch. Map rendering remains Leaflet until the agreed Mapbox migration.

## Remaining release gates
- Verified emergency number(s) and government dispatch partnership
- Authenticated accounts and encrypted personal medical record storage, without gating SOS
- Incident API with idempotency, acknowledgements, human triage and operational fallback
- Actual fleet telemetry and responder availability
- Approved emergency contact notifications, messaging and time-limited family sharing
- Local clinician-reviewed guidance and professionally translated interface
- Security, accessibility, unreliable-network and rural Namibia field testing
- Production map services, billing, monitoring and audit logs

Never remove service-not-connected safety messaging until these integrations are real and tested.

## Regional response update
- Home town is stored separately from the incident map pin and area.
- National fallback numbers remain visible. Published town-specific contacts never bleed into neighbouring towns or an entire region by default.
- Help Someone Else includes remote incidents, optional unknown-person details, and road accidents.
- Optional medical questions appear after the initial incident confirmation; they do not delay help requests.
- A GPS-first dispatch contract is available for later authorised backend integration, but the current app does not send requests.
- Leaflet remains the map, with Mapbox migration deferred.
- See docs/REGIONAL_RESPONSE.md for the source register and deployment limitations.

## Panic-state usability updates (2026-11-23)

- First-launch onboarding no longer blocks the Home SOS action. Profile setup remains optional.
- Location permission is user-initiated with a visible explanation; users can select a map pin instead.
- Browser offline detection makes the emergency calling directory available, but it is only a network hint, not proof of dispatch availability.
- Unsent preview requests explicitly say they were not received by a dispatcher. Preview assignment and tracking remain simulated.
- Request cancellation now requires an explicit destructive confirmation.
- Bottom sheet focus trapping, large-text preference, visible keyboard focus, high contrast, and map reduced-motion support were improved.
- Hold-to-SOS and silent emergency alerts are deferred pending accessibility research and authorised backend service protocols. Current SOS remains a tap to location verification followed by a separate confirmation.

See [Panic-state UX](PANIC_STATE_UX.md) for design decisions and remaining production safety work.

## Trusted-contact safety additions

A dedicated Safety Tools screen is accessible from Profile. It includes explicit permission-based, foreground-only location collection, a short ephemeral trail on the existing Leaflet map, and a user-directed SMS compose link for an existing trusted contact. It rejects stale coordinates and does not send or confirm delivery of any messages. The user's GPS trail is kept in memory only while the Safety Tools page is mounted.

Automatic distress detection, background voice or shake activation, unattended SMS delivery, offline alert queuing, unattended check-in timers, and community responder dispatch remain native/backend and operational integration requirements. No UI should represent these as operational.

See [Safety capabilities](SAFETY_CAPABILITIES.md) for native dependencies, platform restrictions, monitoring requirements, and the review of unverified SMS delivery claims.
