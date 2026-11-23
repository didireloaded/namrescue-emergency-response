# Safety capabilities for CareNear

The current Lovable project is a web app. It is not a certified emergency dispatch system and must not pretend that local state or opening a message composer constitutes a successful alert.

## Web capabilities added in this phase

- Safety Tools is accessible from Profile.
- User starts foreground location collection only after deliberately pressing a button. Samples are kept in memory, displayed on Leaflet, capped to 100, and location tracking stops on screen hide or unmount.
- Last-known location, estimated GPS accuracy and timestamp are shown.
- The app refuses to compose a location message when the reading is over five minutes old.
- Users can choose an existing trusted contact and open an SMS composition screen, or copy the message. Sending is always user-controlled, and CareNear cannot confirm delivery.
- No medical data, location trails or contact information are uploaded by these tools.

## Native mobile capabilities and operational prerequisites

| Feature | Dependency and restriction |
| --- | --- |
| Voice and shake triggers | Native sensor/microphone access, explicit consent, foreground/background permissions, false alarm testing and accessible alternatives. |
| Hold-to-trigger SOS | Optional preference only. Keep tap → location verification → confirmation for accessibility. |
| Automatic accident detection | Validated detection model, false-positive safeguards, user cancellation and approved escalation protocols. Never silently dispatch based on an unvalidated model. |
| Silent SOS | Approved control-room response plan, discreet UI and verified notification transport. |
| Offline SMS fallback | Official receiving number, agreed message protocol, device/platform policy review, acknowledgement, carrier field tests. Automatic SMS sending isn't a reliable generic web capability. |
| Automatic alert queue | Encrypted records, message expiry, idempotency, retry, operator acknowledgements and explicit pending/unsent states. |
| Background location trail | Native background permission, battery-aware sampling, retention, access control and consent revocation. |
| Live family tracking | Secure invitation, time-limited viewer access, authentication, revoke and audit trail. |
| Contact 'I'm on my way' | Trusted contact verification and an actual two-way service. Never confuse a family acknowledgment with ambulance assignment. |
| Missed check-in / safe arrival | Server-controlled deadline and escalation. Browser timers won't reliably run after the screen closes. |
| Medical ID on lock screen | Native OS features such as Apple Medical ID and Android emergency information. A web app cannot install health details on the system lock screen. |
| Professional monitoring | Contracted 24/7 control room, service-level commitments, legal permissions and secure audit logs. |
| Multilingual and low-literacy UI | Human-reviewed Namibian translations, icon + text pairing and real accessibility testing. |
| Community responders | Verified training, screening, consent, dispatcher-controlled assignments and liability / safeguarding protocols. |

## Namibia integration priority

1. Confirm whether NAM-SOS and other local control rooms offer legitimate integration and service coverage. Their published app description does not establish permission or an API.
2. Define the authoritative incident states local draft → transmitting → confirmed received → triaged → assigned → responding → on scene → closed.
3. Every live status requires evidence from the approved control room. A locally created incident is never 'received' by default.
4. Test remote and rural connectivity, SIM and 2G behavior, low-battery GPS, roaming and position accuracy before offering unattended emergency features.
5. Only then consider native background triggers, SMS gateway delivery, trusted contact tracking and responders.

## Reliability warning

The cited 98.7% SMS delivery rate has not been verified for Namibia. Historical ETSI reports include approximately 98% under particular operator conditions, which does not guarantee emergency delivery, acknowledgement or appropriate dispatch.

Sources:
- https://apps.apple.com/na/app/nam-sos/id1467876927
- https://www.rfc-editor.org/rfc/rfc5724.html
- https://developer.apple.com/documentation/messageui/mfmessagecomposeviewcontroller
- https://support.google.com/googleplay/android-developer/answer/18265346
- https://developer.apple.com/documentation/corelocation/handling-location-updates-in-the-background
- https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
- https://www.etsi.org/deliver/etsi_tr/102400_102499/102444/01.01.01_60/tr_102444v010101p.pdf
