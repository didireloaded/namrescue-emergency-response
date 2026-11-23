# Panic-state UX and accessibility review

This change set implements the supplied review's highest-value changes without turning CareNear into a generic Material Design application.

## Interaction approach

- Keep the existing iOS-style typography, bottom navigation labels, photographic layout and bottom sheets. Do not introduce Material UI as a second interaction language.
- The prominent SOS control remains a **single tap to open location confirmation**, NOT a long hold. A separate explicit confirmation already prevents accidental submission. A mandatory hold can be problematic with injuries, limited dexterity and accessibility devices. Revisit with actual emergency-user testing.
- First-launch onboarding no longer takes over the Home screen. A user can open SOS immediately; onboarding remains available through Profile.
- The emergency location screen no longer prompts for GPS automatically on mount. The user sees a short explanation, then chooses the locate button or manually places/searches a pin.
- Dismissing or cancelling a created preview request requires a second explicit destructive confirmation. The action sheet uses accessible focus handling and Escape.
- Keep navigation tab **text labels** paired with icons. Recognition is more important than aesthetic minimalism.
- The existing reduced-motion CSS now also applies to Leaflet map recentering. Keyboard focus states, high-contrast mode and the large-text preference have been improved.

## Offline behavior

The app uses browser online/offline events only as a **network hint**. They do not prove that a dispatch endpoint is reachable.

- If the device reports offline, the Home page offers an immediate path to the national/local emergency number directory.
- Request confirmation is unavailable during a reported offline state. Users are directed to the native telephone dialer instead.
- A new preview request can be created only after the browser reports online, but it is **still local simulation**, not an emergency transmission.
- The app must NEVER show a request as received by a real dispatcher without a server acknowledgement.
- Do not silently queue or auto-send SOS alerts from a browser without an authorised dispatch partner, audited retry and acknowledgement handling. An unsent draft must always be labelled **unsent**, and a telephone fallback must remain visible.

## Deliberately deferred

- Silent SOS transmission, discreet alerting, SMS fallback and background retries all require a real control-room protocol, delivery guarantees and user testing. Displaying such features as operational before integration would be unsafe.
- Automated route telemetry and live driver identity must come from trusted responder data. Simulated maps and ETAs remain visibly labelled.
- Native iOS edge-swipe gestures must be handled by the platform/browser. Do not replace system back behavior with a risky custom gesture.
- Claims of WCAG 2.2 AA compliance require complete automated and manual testing on real devices with VoiceOver, Switch Control and large text.
- Translating the interface requires review from competent local-language experts, not unverified machine translations.

## Existing ecosystem

NAM-SOS already offers a GPS-based emergency response app in Namibia. Its public app listings advertise a control-room response pathway. Interoperability or an approved partnership should be researched before a separate national dispatch network is claimed.

References:
- https://apps.apple.com/na/app/nam-sos/id1467876927
- https://play.google.com/store/apps/details?id=za.co.mdits.sasos.namibia
- https://developer.apple.com/design/human-interface-guidelines/gestures/
- https://developer.apple.com/design/human-interface-guidelines/accessibility

## Before production

A full compile, test run, screen-reader audit, offline/degraded-network field tests, Namibian emergency service validation and clinical/legal review are still required. This PR is frontend hardening, not an operational ambulance service.
