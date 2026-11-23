# Namibia regional response and incident UX

## What this phase changes

- Citizen onboarding includes a saved **home region and town/settlement**. This only personalises suggested telephone contacts.
- Each SOS uses a **separate emergency location** with a GPS fix or a user-placed map pin. The incident region/town can be manually confirmed and is NEVER copied from the saved home profile without user action.
- The **Call** sheet filters published emergency contacts by the selected area and always includes nationwide emergency fallback numbers. Each contact has a source link and its intended coverage. A town-only listing must not appear throughout an entire region.
- **Help someone else** supports nearby people, people elsewhere (without forcing the caller's GPS position), and road accidents.
- The emergency request starts with location confirmation. Once a preview request is created, users can optionally add patient symptoms or road-accident details. No additional questionnaire blocks SOS.
- After simulated assignment, Leaflet displays the route with responder information. The position, ETA, crew photo and vehicle identity remain explicitly simulated until a verified backend exists.
- Medical ID and optional medical-aid coverage are separate UI areas. Coverage must never gate emergency assistance.
- The post-completion summary allows an optional five-star rating and brief feedback, saved in the session only.

## Published contact references

Contact directory seed data was checked against:
- https://www.gov.uk/foreign-travel-advice/namibia/getting-help
- https://www.gov.uk/foreign-travel-advice/namibia/health
- https://www.methealth.com.na/emergency_numbers
- https://www.rundutown.com.na/emergency/

National fallback entries include 112, 10111 and 999 as listed in UK foreign travel advice. City of Windhoek emergency 061 211 111 is specific to Windhoek. The directory also includes a limited set of other town/coverage-specific services, with scope and source indicated. It is intentionally incomplete until every regional provider and emergency authority confirms operational hours, eligibility, coverage, charges, and number validity. No local number is inferred from geography.

## Dispatch contract

src/lib/dispatch-contract.ts prepares an **unsent** request envelope using incident GPS/manual coordinates and an optional area hint. It does not use the home town for dispatch, it does not automatically assign a driver, and it does not send any requests. A real regional dispatch backend needs verified coverage zones and a human dispatcher who can assign the most suitable available unit, including cross-region coordination.

## Mapping and tracking

Leaflet remains in use. Map provider functions live in src/lib/map-service.ts to ease a later Mapbox migration. Public Nominatim/OSRM endpoints are development resources and should not support a life-critical production service. Production requires contracted mapping, GPS freshness detection, route correction, accurate ETAs, network resilience, telemetry authentication, and no animation beyond the last valid GPS reading when feeds fail.

## Safety, privacy and release gates

- The current product UI is **not connected to ambulance dispatch**. No preview SOS can summon an ambulance.
- User-entered medical information, medical-aid membership, photographs, emergency contacts, dependants and incident details remain in memory. They are not securely stored or synced between devices.
- Telephone controls use the device dialer; they do not automatically call a provider or register an ambulance incident.
- Do not display public personal driving licence numbers, driver's age or unverified professional identities. The approved product should display verified role, photo (if authorised), fleet ID and vehicle registration.
- Feedback is kept in-session and not sent to a provider.
- Before launch: encrypted authentication-backed storage, verified regional phone directory, official dispatch agreement, incident API, accurate vehicle telemetry, opt-in sharing, clinical guidance review, multilingual validation, accessibility, network and field testing.

**Validation:** a GitHub PR was used to keep Lovable connected. Run the build and full test suite before representing any of these features as production-verified.
