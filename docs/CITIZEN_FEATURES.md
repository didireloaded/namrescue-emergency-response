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
7. Emergency dialer — Backend, verified number required
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
36. Roadside accident detail — Partial, location pin and note currently
37. Measured location accuracy — UI
38. User-initiated location share — UI
39. Weak/offline service handling — Partial, errors shown; reliable delivery pending

## Communication
40. Request status notifications — Preview
41. En route updates — Preview
42. ETA change alerts — Backend
43. Dispatch messages — Backend
44. Call saved emergency contact — UI, native dialer with saved contact
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
58. Profile management — UI with onboarding, optional avatar, medical history
59. Post-response feedback — Backend
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
