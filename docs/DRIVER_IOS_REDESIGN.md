# CareNear Driver — approved iOS visual direction

## Visual target

The user selected the four-screen iOS design featuring a photographic shift dashboard, immersive dark incoming dispatch, map-led navigation, and a clean white trip-details / handover screen. The implementation is in `src/components/nr/CareNearDriver.tsx`, mounted on the existing `/driver` route.

**Use this implementation as the current Driver visual design source.** The older `DriverApp.tsx` and `DriverOperations.tsx` are left in the repo for incremental migration, but the routed Driver app uses `CareNearDriver`.

### Key product decisions

- A deliberately restrained **four-tab iOS bottom navigation** with Home, Dispatch, Trips, Profile.
- Additional essential driver tools remain on the home screen: Navigation, Vehicle Check, Equipment, Crew Safety and Messages.
- Home uses a full-width photographic hero with CareNear wordmark, restrained shift/vehicle status strip, low-chrome iOS action surfaces and a compact shift summary.
- Incoming training dispatch uses a dark image-led surface with a transparent frosted information group, caution notes, one-tap Accept and a separate Decline confirmation.
- Navigation presents the existing Leaflet route as the central visual, with a dark destination banner and a low white iOS action sheet. It explicitly does **not** simulate turn-by-turn emergency routing, live ETA, a current road name or legal traffic exemptions.
- Trip Details uses a three-part native-style segmented control: Incident, Patient, Handover. A patient-data placeholder replaces invented vitals.
- Vehicle, Comms, Trips, Profile and Crew Safety screens use white grouped lists, simple native controls, large touch targets, clear typography, and minimal red outside urgent actions.
- The entire page remains a training prototype, and each unsupported operational action is explicitly disabled or labelled local-only.

### Licensed photographic assets

The build references two real photos under the [Unsplash License](https://unsplash.com/license), not AI-generated imagery. These are illustrative atmospheric photographs, **not photos of CareNear vehicles or the fictional Windhoek dispatch**.

- Hero photo by [Mathurin NAPOLY](https://unsplash.com/photos/an-ambulance-parked-on-the-side-of-the-road-at-night-pcP1HwNrSLQ). Asset `https://images.unsplash.com/photo-1642438114426-bad6b9ce05da`.
- Dispatch backdrop by [Klaus Birner](https://unsplash.com/photos/aerial-view-of-a-city-skyline-at-dusk-3mdHgIGJdrM). Asset `https://images.unsplash.com/photo-1771450092348-5f33e2cc2963`.

The UI degrades to a solid dark background if imagery is unavailable. The next production pass should replace the imagery with licenced CareNear-specific fleet/event photos when supplied by the organisation, not with automatically generated ambulance imagery.

## Production requirements and remaining limits

- All assignment data and fleet identifiers are sample training content, not real notifications.
- Driver controls preserve existing `driver-store` stage-transition guards. Calls, status updates, fatigue check-ins and messages stay in session memory and reset on reload.
- Any real dispatch requires identity verification, signed offers, server acknowledgments, offline queue conflict resolution, independent control-room monitoring and audited status timestamps.
- No real hospital pre-notification, patient clinical records, emergency exemptions, GPS tracking, media communication or live duress alert is implied or operational.
- External navigation and Street View may be unavailable depending on coverage; vehicle-specific legal routing must be verified separately.
- Verify build/tests, responsive layouts, map interactions, keyboard accessibility, reduced motion, and background image fallback in the actual target runtime before launch.

## Local preview

After pulling the updated main branch and running the Vite development server from this repository, open `http://localhost:5173/driver` (or use the port Vite reports). A browser console with `main.jsx` does not correspond to this TanStack Start driver route and suggests the wrong project or an old server is being accessed.
