# CareNear on ChatGPT Sites

CareNear is a private browser-based training application for Namibia. Use fictional names, sample incidents and map pins in public areas. Citizen and Driver have separate navigation and session stores. The original solo simulations run independently. The private control center links Citizen requests and Driver assignments through Sites D1.

## Source and design

The migration uses GitHub main at `89404f3f7e5c85f3ba4b49ee0cffeb630ac9c573`, also reported by Lovable for the linked project. The approved Driver reference is [DRIVER_IOS_REDESIGN.md](./DRIVER_IOS_REDESIGN.md). The site retains the photographic shift home, high-priority incoming offer, map-first route preview and segmented trip details. The Citizen home foregrounds SOS and offers a separate Driver entry. Desktop navigation selects a workspace and leaves workflow progression inside the app.

The two Driver photographs are locally served copies of the licensed Unsplash assets credited in the Driver redesign document. The six Citizen photographs are the exact files from the source project's Lovable asset manifest, now served by Sites. Upstream attributes the skyline to Bries (Wikimedia Commons, CC BY-SA 2.5), ambulance night imagery to Th2city Santana (Pexels), and paramedic imagery to RDNE Stock project (Pexels). Confirm the original licence and attribution for every citizen asset before public redistribution.

## What runs

| Surface | Training behavior | External behavior |
| --- | --- | --- |
| Citizen SOS | Self or witness request, location confirmation, local receipt, explicit sample assignment, sample team and ETA, simulated arrival, summary and history | Optional device geolocation and third-party map requests. No request reaches a dispatcher |
| Citizen profile and safety | Medical ID preview, contacts and household, preferences, regional resources and foreground safety tools | Explicit dialer, SMS compose, clipboard or share actions may open a real device app. Emergency numbers require operational re-verification. Use fictional data |
| Driver shift and fleet | Checklist, inventory/expiry, maintenance, training shift, out-of-service and rest checks | No actual vehicle, stock or clearance record is changed |
| Driver dispatch and trips | Offer, accept or decline, route preview, scene and hospital milestones, training handover, trip history | Map providers may load preview tiles or directions. There are no dispatch acknowledgements or verified assignments |
| Driver communication and safety | Local messages, local check-ins and fatigue status | Voice/video and duress are unavailable. No supervisor, hospital or control room receives a notification |

Solo application state is held in browser memory. The shared drill stores only fictional workflow state, versioned status events, pairing metadata and hashed participant keys in Sites D1. The per-role key lives in browser session storage. Public map/geocoding/routing services receive tile requests, typed place searches or coordinates as applicable. Opening external maps or a device sharing action can hand off data to that provider. The private Sites access gate protects the preview and does not establish operational roles.

## Run the control center flow

1. Open the private Citizen app and choose **SOS**. Confirm the Windhoek pickup point, then select **Send ambulance request**.
2. Open **Control center** in a separate tab. Select **Assign Unit 01** from the new request in the queue.
3. Open **Driver → Assigned requests** in a third tab. Select **Start route to pickup**. Both other screens update to **Ambulance en route**.
4. Use **Confirm arrival** to complete the pickup flow and free the unit for another request.

All three views use one private Sites workspace and shared D1 records. The Citizen browser retains its own request access in session storage. The control center sees the queue and latest arrivals. One test unit can have one active assignment at a time. The workspace relies on owner-private Sites access for this walkthrough. Staff identity, independent role permissions, live fleet tracking and public intake require a separate rollout with an approved operator. Use a public landmark for pickup testing.

## Production integration design

1. **Identity and authorization.** Use trusted server-side identity and map it to verified organization membership. Require role and resource checks for each read or command, with organization, assigned unit, dispatch region and incident scope where relevant. Give Dispatch control over assignments, Driver access to assigned logistics, Paramedic access to authorized clinical data, Fleet access to readiness and maintenance, and Administration audited membership and policy controls. A workspace link grants zero operational privileges.
2. **Incidents and assignments.** Extend the existing dispatch-draft boundary with a validated server command and explicit receipt. Store an incident and immutable audit event atomically. Use server-issued, expiring offers bound to the receiving driver and unit. Accept/decline checks current assignment version, eligibility and expiry in a transaction. Return an authoritative acknowledgement and append a versioned event. Idempotency keys, uniqueness constraints and compare-and-set transitions protect retries and competing acknowledgements.
3. **Operational status.** Keep dispatch, vehicle readiness, communications and clinical handover as separate records. Use authoritative server timestamps. Durable queues and monitored delivery should distinguish queued, acknowledged, expired and failed states. Reconnect reconciles against server state. A real duress integration needs an independently monitored channel, delivery confirmation, escalation ownership and an agreed failure procedure before enablement.
4. **Privacy.** Keep training and production environments separate. Minimize location and medical data, encrypt transport and storage, restrict clinical notes and attachments to authorized staff, and redact telemetry. Define retention, access review and incident disclosure with the operating service. Use contracted map and communication providers with access controls, legal review and Namibia coverage. Verify every emergency contact with the responsible organization.
5. **Production release.** Obtain authorization and integrate with the licensed EMS operator. Test cross-role and cross-organization denial, offer expiry and duplicate accepts, failover, reconnect and audit reconciliation. Test lawful routing and real device GPS, accessibility, low connectivity and emergency fallback with the operator before enabling any live operation.

## Build

Run `bun install --frozen-lockfile`, then `bun run build:sites`. The existing TanStack Start app builds with Nitro, and the packaging script adapts that output to the Sites Worker layout. The private deployment uses a separate Sites source repository.
