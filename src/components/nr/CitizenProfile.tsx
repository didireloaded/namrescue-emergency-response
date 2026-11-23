import { Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bell, Camera, ChevronRight, CircleHelp, Clock3,
  HeartPulse, Languages, LockKeyhole, MapPin, Phone, Plus, ShieldCheck,
  Trash2, UserRound, UsersRound, Check, BookOpen, Pencil, CircleAlert,
  Accessibility, Shield, Ambulance, type LucideIcon,
} from "lucide-react";
import { BottomNav } from "@/components/nr/chrome";
import { citizen, useCitizen, type Contact, type Dependant } from "@/lib/citizen-store";
import { demo, useDemo } from "@/lib/demo-store";
import { AreaSelector } from "./AreaSelector";
import { areaLabel } from "@/lib/regions";

type Panel = "overview" | "onboarding" | "edit" | "medical" | "family" | "contacts" | "guidance" | "privacy" | "notifications" | "help" | "area" | "coverage";
const field = "h-12 w-full rounded-2xl border border-[#DDE2E8] bg-white px-4 text-[15px] text-[#172232] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10";
const secondary = "flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#DDE2E8] bg-white px-4 text-[15px] font-semibold";
const primary = "flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#162235] px-5 py-3 text-[15px] font-semibold text-white active:scale-[.99]";
const subtitle = "text-[13px] leading-relaxed text-[#647084]";

function Row({ icon: Icon, label, detail, onClick, red = false }: {
  icon: LucideIcon;
  label: string;
  detail?: string;
  onClick: () => void;
  red?: boolean;
}) {
  return <button onClick={onClick} className="flex min-h-[63px] w-full items-center gap-3 border-b border-[#EEF0F4] py-2 text-left last:border-b-0">
    <span className={"grid size-10 shrink-0 place-items-center rounded-[14px] " + (red ? "bg-[#FFF0F1] text-[#DC2636]" : "bg-[#EDF2F8] text-[#25354D]")}><Icon className="size-5" /></span>
    <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold text-[#182435]">{label}</span>{detail && <span className="block truncate text-[12px] text-[#7C8797]">{detail}</span>}</span>
    <ChevronRight className="size-[18px] text-[#ABB4C1]" />
  </button>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[13px] font-semibold text-[#40506A]">{children}</label>;
}
function Field({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string;
}) {
  return <div><Label>{label}</Label><input className={field} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></div>;
}
function Note({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 rounded-2xl bg-[#EFF3F7] p-3 text-[12px] leading-relaxed text-[#4E6079]"><LockKeyhole className="mt-0.5 size-4 shrink-0" />{children}</div>;
}
function Avatar({ image, name, large = false }: { image: string | null; name: string; large?: boolean }) {
  return <span className={"grid shrink-0 place-items-center overflow-hidden rounded-full border-[3px] border-white bg-[#D8DFE9] text-[#40506A] shadow-sm " + (large ? "size-24" : "size-14")}>
    {image ? <img alt="" src={image} className="size-full object-cover" /> : <UserRound className={large ? "size-11" : "size-6"} />}
  </span>;
}
const GUIDES = [
  { name: "CPR", detail: "When someone is unresponsive", link: "https://www.redcross.org/take-a-class/cpr/performing-cpr/cpr-steps" },
  { name: "Severe bleeding", detail: "Respond safely while help is coming", link: "https://www.redcross.org/take-a-class/first-aid/performing-first-aid" },
  { name: "Road accident", detail: "Keep the scene safe", link: "https://www.redcross.org/take-a-class/first-aid/performing-first-aid" },
  { name: "Choking", detail: "First aid guidance", link: "https://www.redcross.org/take-a-class/first-aid/performing-first-aid" },
  { name: "Burns", detail: "First aid guidance", link: "https://www.redcross.org/take-a-class/first-aid/performing-first-aid" },
  { name: "Unconscious person", detail: "Assess the scene and request help", link: "https://www.redcross.org/take-a-class/first-aid/performing-first-aid" },
] as const;

export default function Profile() {
  const state = useCitizen();
  const incident = useDemo();
  const [panel, setPanel] = useState<Panel>("overview");
  const [step, setStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [contactDraft, setContactDraft] = useState<Omit<Contact, "id">>({ name: "", phone: "", relationship: "" });
  const [dependantDraft, setDependantDraft] = useState<Omit<Dependant, "id">>({ name: "", relationship: "", dateOfBirth: "", medicalNotes: "" });
  const avatarInput = useRef<HTMLInputElement>(null);
  const { profile, medical, medicalAid, homeArea, contacts, dependants, preferences } = state;
  const open = (name: Panel) => { setPanel(name); setShowWelcome(false); };
  const editingOnboarding = panel === "onboarding" || (panel === "overview" && !profile.completedOnboarding && showWelcome);
  const upload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000) { alert("Choose a JPG, PNG or WebP image under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") citizen.updateProfile({ avatar: reader.result }); };
    reader.readAsDataURL(file);
  };
  const complete = () => {
    citizen.updateProfile({ completedOnboarding: true });
    setPanel("overview");
    setShowWelcome(false);
  };
  const addContact = () => {
    if (!contactDraft.name.trim() || !contactDraft.phone.trim()) return;
    citizen.addContact({ ...contactDraft, name: contactDraft.name.trim(), phone: contactDraft.phone.trim() });
    setContactDraft({ name: "", phone: "", relationship: "" });
  };
  const addDependant = () => {
    if (!dependantDraft.name.trim() || !dependantDraft.relationship.trim()) return;
    citizen.addDependant({ ...dependantDraft, name: dependantDraft.name.trim() });
    setDependantDraft({ name: "", relationship: "", dateOfBirth: "", medicalNotes: "" });
  };

  return <div className="flex h-full flex-col bg-[#F7F9FC] text-[#162235]">
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {editingOnboarding ? <>
        <div className="relative bg-[#162235] px-6 pb-7 pt-safe text-white">
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => { setShowWelcome(false); setPanel("overview"); }} className="flex min-h-11 items-center gap-1 text-[13px] text-white/80"><ArrowLeft className="size-4" /> Later</button>
            <span className="text-[12px] font-semibold tracking-wide text-white/60">STEP {step + 1} OF 5</span>
          </div>
          <div className="mt-5 flex gap-1.5">{[0,1,2,3,4].map((n) => <span key={n} className={"h-1 flex-1 rounded-full " + (n <= step ? "bg-[#FF4551]" : "bg-white/20")} />)}</div>
          <h1 className="mt-7 text-[31px] font-bold leading-tight">{["Let's get to know you", "Where do you live?", "Make it yours", "Your Medical ID", "Someone to contact"][step]}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-white/70">{["A few basics. You can still request help without setting up a profile.", "Your home area makes local contacts easier to find. Emergencies use the actual incident location.", "Add a photo so the profile feels personal.", "Share only what you feel comfortable sharing.", "Choose someone responders can contact when needed."][step]}</p>
        </div>
        <div className="space-y-4 px-6 py-6">
          {step === 0 && <>
            <Field label="Full name" value={profile.name} onChange={(name) => citizen.updateProfile({ name })} placeholder="Your name" />
            <Field label="Mobile number" value={profile.phone} onChange={(phone) => citizen.updateProfile({ phone })} type="tel" placeholder="+264" />
            <Field label="Email (optional)" value={profile.email} onChange={(email) => citizen.updateProfile({ email })} type="email" placeholder="you@example.com" />
            <Field label="Date of birth (optional)" value={profile.dateOfBirth} onChange={(dateOfBirth) => citizen.updateProfile({ dateOfBirth })} type="date" />
          </>}
          {step === 1 && <AreaSelector value={homeArea} onChange={(area) => citizen.updateHomeArea(area)} />}
          {step === 2 && <div className="flex flex-col items-center gap-4 py-6">
            <Avatar image={profile.avatar} name={profile.name} large />
            <button className={secondary} onClick={() => avatarInput.current?.click()}><Camera className="mr-2 size-5" /> Choose photo</button>
            <p className={subtitle}>Optional. JPG, PNG or WebP, up to 2 MB.</p>
          </div>}
          {step === 3 && <MedicalForm />}
          {step === 4 && <>
            <ContactForm value={contactDraft} set={setContactDraft} />
            <button onClick={addContact} disabled={!contactDraft.name.trim() || !contactDraft.phone.trim()} className={secondary}><Plus className="mr-2 size-4" /> Add contact</button>
            {contacts.map((c) => <p key={c.id} className="rounded-xl bg-white px-4 py-3 text-[14px]">{c.name} · {c.relationship || "Contact"}</p>)}
          </>}
          <Note>Medical information and photos currently remain in this browser session only. Secure accounts and encrypted storage must be connected before public use.</Note>
          <button onClick={() => step < 4 ? setStep(step + 1) : complete()} className={primary}>{step === 4 ? "Finish profile" : "Continue"} <ArrowRight className="size-5" /></button>
          {step > 0 && <button onClick={() => setStep(step - 1)} className={secondary}>Back</button>}
          <button onClick={() => { setShowWelcome(false); setPanel("overview"); }} className="flex min-h-11 w-full items-center justify-center text-[13px] font-semibold text-[#66748A]">Skip for now</button>
        </div>
      </> : panel === "overview" ? <>
        <div className="relative bg-[#162235] px-6 pb-9 pt-safe text-white">
          <div className="mt-5 flex items-center justify-between">
            <span className="text-[14px] font-semibold tracking-[.04em]">My profile</span>
            <button onClick={() => open("notifications")} aria-label="Notifications" className="grid size-11 place-items-center rounded-full bg-white/10"><Bell className="size-5" /></button>
          </div>
          <div className="mt-7 flex items-center gap-4">
            <Avatar image={profile.avatar} name={profile.name} large />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[24px] font-bold">{profile.name || "Your profile"}</h1>
              <p className="mt-1 truncate text-[13px] text-white/65">{profile.phone || "Add your personal details"}</p>
              <p className="mt-1 truncate text-[12px] text-white/65">{areaLabel(homeArea)}</p>
              <button onClick={() => open("edit")} className="mt-3 flex min-h-9 items-center gap-1.5 text-[13px] font-semibold text-white/95"><Pencil className="size-4" /> Edit profile</button>
            </div>
          </div>
          {!profile.completedOnboarding && <button onClick={() => { setStep(0); open("onboarding"); }} className="mt-5 flex min-h-11 w-full items-center justify-between rounded-2xl bg-white/10 px-4 text-[13px] font-medium">Finish setting up your profile <ArrowRight className="size-4" /></button>}
        </div>
        <div className="relative -mt-4 space-y-5 rounded-t-[28px] bg-[#F7F9FC] px-5 pb-8 pt-7">
          <button onClick={() => open("medical")} className="flex w-full items-center gap-4 rounded-[22px] bg-[#E9EEF5] p-4 text-left">
            <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#D82835]"><HeartPulse className="size-6" /></span>
            <span className="flex-1"><span className="block font-bold">Medical ID</span><span className="text-[12px] text-[#647084]">{medical.bloodType ? "Blood group " + medical.bloodType : "Important details for an emergency"}</span></span>
            <ChevronRight className="size-5 text-[#65758A]" />
          </button>
          <section><p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[.12em] text-[#8792A2]">My people</p>
            <div className="rounded-[22px] bg-white px-4">
              <Row icon={UsersRound} label="Family & dependants" detail={dependants.length + " saved"} onClick={() => open("family")} />
              <Row icon={Phone} label="Emergency contacts" detail={contacts.length + " saved"} onClick={() => open("contacts")} />
            </div>
          </section>
          <section><p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[.12em] text-[#8792A2]">Your services</p>
            <div className="rounded-[22px] bg-white px-4">
              <Row icon={MapPin} label="Home area" detail={areaLabel(homeArea)} onClick={() => open("area")} />
              <Row icon={Shield} label="Medical aid" detail={medicalAid.provider || "Optional cover details"} onClick={() => open("coverage")} />
              <Row icon={Clock3} label="My requests" detail={incident.status === "idle" ? "Request history" : "An emergency request is active"} onClick={() => open("notifications")} />
              <Row icon={BookOpen} label="Emergency guidance" detail="First aid resources" onClick={() => open("guidance")} />
              <Row icon={Bell} label="Notifications" onClick={() => open("notifications")} />
            </div>
          </section>
          <section><p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-[.12em] text-[#8792A2]">Preferences</p>
            <div className="rounded-[22px] bg-white px-4">
              <Row icon={ShieldCheck} label="Privacy & permissions" onClick={() => open("privacy")} />
              <Row icon={CircleHelp} label="Help & support" onClick={() => open("help")} />
            </div>
          </section>
          <Link to="/" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#DCE2E8] bg-white text-[14px] font-semibold text-[#D32332]"><Ambulance className="size-5" /> Emergency SOS</Link>
        </div>
      </> : <>
        <header className="sticky top-0 z-10 border-b border-[#E9EDF2] bg-[#F7F9FC] px-5 pb-4 pt-safe">
          <button onClick={() => setPanel("overview")} className="mt-2 flex min-h-10 items-center gap-1 text-[14px] font-semibold text-[#1B66C9]"><ArrowLeft className="size-5" /> Profile</button>
          <h1 className="mt-4 text-[29px] font-bold tracking-tight">{({ edit:"Edit profile", medical:"Medical ID", family:"Family & dependants", contacts:"Emergency contacts", guidance:"Emergency guidance", privacy:"Privacy & permissions", notifications:"My requests & alerts", help:"Help & support", area:"My home area", coverage:"Medical aid", overview:"Profile", onboarding:"Onboarding" } as Record<Panel, string>)[panel]}</h1>
        </header>
        <main className="space-y-5 px-5 pb-8 pt-5">
          {panel === "edit" && <>
            <div className="flex items-center gap-4"><Avatar image={profile.avatar} name={profile.name} large /><button className={secondary} onClick={() => avatarInput.current?.click()}><Camera className="mr-2 size-4" /> Change photo</button></div>
            <Field label="Full name" value={profile.name} onChange={(name) => citizen.updateProfile({ name })} />
            <Field label="Mobile number" value={profile.phone} onChange={(phone) => citizen.updateProfile({ phone })} type="tel" />
            <Field label="Email" value={profile.email} onChange={(email) => citizen.updateProfile({ email })} type="email" />
            <Field label="Date of birth" value={profile.dateOfBirth} onChange={(dateOfBirth) => citizen.updateProfile({ dateOfBirth })} type="date" />
            <Note>Changes are not securely saved between sessions until account storage is connected.</Note>
            <button className={primary} onClick={() => setPanel("overview")}><Check className="size-4" /> Done</button>
          </>}
          {panel === "area" && <>
            <AreaSelector value={homeArea} onChange={(area) => citizen.updateHomeArea(area)} heading="Home region and town" help="Used for local contacts. Every emergency still asks for the incident location." />
            <button className={primary} onClick={() => setPanel("overview")}>Done</button>
          </>}
          {panel === "coverage" && <>
            <p className={subtitle}>Optional. A government emergency request must never depend on medical aid membership.</p>
            <Field label="Medical aid provider" value={medicalAid.provider} onChange={(provider) => citizen.updateMedicalAid({ provider })} placeholder="Provider or PSEMAS" />
            <Field label="Scheme / plan" value={medicalAid.scheme} onChange={(scheme) => citizen.updateMedicalAid({ scheme })} />
            <Field label="Membership number" value={medicalAid.membershipNumber} onChange={(membershipNumber) => citizen.updateMedicalAid({ membershipNumber })} />
            <Field label="Main member" value={medicalAid.mainMemberName} onChange={(mainMemberName) => citizen.updateMedicalAid({ mainMemberName })} />
            <Note>Coverage details are kept in this session only and are not checked or transmitted.</Note>
            <button className={primary} onClick={() => setPanel("overview")}>Done</button>
          </>}
          {panel === "medical" && <>
            <div className="flex items-center gap-3 rounded-[22px] bg-[#E6EDF5] p-4"><HeartPulse className="size-7 text-[#CC2633]" /><div><h2 className="font-bold">Your emergency medical ID</h2><p className={subtitle}>Only share with authorised responders.</p></div></div>
            <MedicalForm />
            <Note>Medical history isn't a substitute for a clinical record. These details are not sent to any ambulance or saved securely until a verified backend is connected.</Note>
            <button className={primary} onClick={() => setPanel("overview")}>Done</button>
          </>}
          {panel === "contacts" && <>
            <p className={subtitle}>People you would like contacted during an emergency.</p>
            {contacts.map((c) => <div key={c.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"><div className="min-w-0 flex-1"><p className="font-semibold">{c.name}</p><p className={subtitle}>{c.relationship} · {c.phone}</p></div><a aria-label={"Call " + c.name} href={"tel:" + c.phone.replace(/[^0-9+]/g, "")} className="grid size-11 place-items-center rounded-full bg-[#EFF5FB] text-[#246AC1]"><Phone className="size-5" /></a><button aria-label={"Remove " + c.name} onClick={() => citizen.removeContact(c.id)} className="grid size-11 place-items-center text-[#C82B3A]"><Trash2 className="size-5" /></button></div>)}
            <ContactForm value={contactDraft} set={setContactDraft} />
            <button onClick={addContact} disabled={!contactDraft.name.trim() || !contactDraft.phone.trim()} className={primary}><Plus className="size-4" /> Add contact</button>
            <Note>Contact notifications require a verified communications service and consent. Nothing will be sent from this screen yet.</Note>
          </>}
          {panel === "family" && <>
            <p className={subtitle}>Keep the information for children, parents or people you care for in one place.</p>
            {dependants.map((d) => <div key={d.id} className="flex items-center gap-3 rounded-2xl bg-white p-4"><UsersRound className="size-6 text-[#25354D]" /><div className="flex-1"><p className="font-semibold">{d.name}</p><p className={subtitle}>{d.relationship}</p></div><button aria-label={"Remove " + d.name} onClick={() => citizen.removeDependant(d.id)} className="grid size-11 place-items-center text-[#C82B3A]"><Trash2 className="size-5" /></button></div>)}
            <Field label="Dependant's name" value={dependantDraft.name} onChange={(name) => setDependantDraft({ ...dependantDraft, name })} />
            <Field label="Relationship" value={dependantDraft.relationship} onChange={(relationship) => setDependantDraft({ ...dependantDraft, relationship })} placeholder="Child, parent, partner…" />
            <Field label="Date of birth (optional)" value={dependantDraft.dateOfBirth || ""} type="date" onChange={(dateOfBirth) => setDependantDraft({ ...dependantDraft, dateOfBirth })} />
            <Field label="Important care notes (optional)" value={dependantDraft.medicalNotes || ""} onChange={(medicalNotes) => setDependantDraft({ ...dependantDraft, medicalNotes })} />
            <button onClick={addDependant} disabled={!dependantDraft.name.trim() || !dependantDraft.relationship.trim()} className={primary}><Plus className="size-4" /> Add dependant</button>
            <Note>Dependant details stay in this session until a secure family-account service is available.</Note>
          </>}
          {panel === "guidance" && <>
            <div className="rounded-[22px] bg-[#162235] p-5 text-white"><CircleAlert className="mb-3 size-6 text-[#FF5965]" /><h2 className="text-[18px] font-bold">If someone needs help now</h2><p className="mt-2 text-[14px] leading-relaxed text-white/70">Request emergency assistance, check that the scene is safe, and follow instructions from trained responders.</p><Link to="/" className="mt-4 flex min-h-11 items-center gap-2 font-semibold text-white"><Ambulance className="size-5" /> Go to SOS <ArrowRight className="ml-auto size-4" /></Link></div>
            <h2 className="text-[14px] font-bold">First-aid resources</h2>
            <div className="divide-y divide-[#EDF0F4] rounded-[22px] bg-white px-4">
              {GUIDES.map((g) => <a key={g.name} href={g.link} target="_blank" rel="noreferrer" className="flex min-h-15 items-center justify-between gap-3 py-3"><span><span className="block font-semibold">{g.name}</span><span className={subtitle}>{g.detail}</span></span><ChevronRight className="size-5 text-[#9BA8B8]" /></a>)}
            </div>
            <Note>Guidance opens the Red Cross website. Local clinical review is needed before in-app instructions can be used in a live emergency service.</Note>
          </>}
          {panel === "privacy" && <>
            <PreferenceRow title="Location during emergency requests" desc="Ask to share your location when you request help." checked={preferences.locationOnRequest} onChange={(locationOnRequest) => citizen.updatePreferences({ locationOnRequest })} icon={MapPin} />
            <PreferenceRow title="Share Medical ID with crew" desc="Permission for a future verified responder integration." checked={preferences.shareMedicalWithCrew} onChange={(shareMedicalWithCrew) => citizen.updatePreferences({ shareMedicalWithCrew })} icon={HeartPulse} />
            <PreferenceRow title="Notify emergency contacts" desc="Requires consent and an approved messaging provider." checked={preferences.notifyContacts} onChange={(notifyContacts) => citizen.updatePreferences({ notifyContacts })} icon={Bell} />
            <PreferenceRow title="Larger text" desc="Increase key labels and text." checked={preferences.largeText} onChange={(largeText) => citizen.updatePreferences({ largeText })} icon={Accessibility} />
            <div><Label>Preferred language</Label><select className={field} value={preferences.language} onChange={(e) => citizen.updatePreferences({ language: e.target.value as typeof preferences.language })}>{["English","Oshiwambo","Afrikaans","Otjiherero","Khoekhoegowab"].map((x) => <option key={x}>{x}</option>)}</select></div>
            <Note>The interface currently uses English. Translation and accessibility validation are still required.</Note>
            <button onClick={() => { if (window.confirm("Clear all personal details entered in this session?")) { citizen.clear(); setPanel("overview"); } }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#EBC3C6] text-[14px] font-semibold text-[#BC2635]"><Trash2 className="size-4" /> Clear session information</button>
          </>}
          {panel === "notifications" && <>
            <div className="rounded-[22px] bg-white p-5"><p className="text-[13px] font-semibold text-[#66748A]">Current request</p><h2 className="mt-1 text-[20px] font-bold capitalize">{incident.status === "idle" ? "No active request" : incident.status}</h2><p className={subtitle}>{incident.status === "idle" ? "When you request an ambulance, you will see the incident status here." : "This request is a preview and has not been delivered to emergency services."}</p>
              {incident.status === "received" && <Link to="/request" className="mt-4 block text-[14px] font-semibold text-[#1B66C9]">View request</Link>}
              {incident.status === "assigned" && <Link to="/tracking" className="mt-4 block text-[14px] font-semibold text-[#1B66C9]">Open tracking</Link>}
            </div>
            <h2 className="font-bold">Request history</h2>
            {incident.history.length ? incident.history.map((item) => <div className="rounded-2xl bg-white p-4" key={item.id}><p className="font-semibold">{item.label}</p><p className={subtitle}>{new Date(item.at).toLocaleString()}</p></div>) : <p className={subtitle}>No previous requests in this session.</p>}
            <Note>Live push notifications, dispatch messages, and family tracking need a secure server and approved messaging integration.</Note>
          </>}
          {panel === "help" && <>
            <div className="rounded-[22px] bg-white p-5"><Phone className="mb-4 size-7 text-[#CC2633]" /><h2 className="text-[20px] font-bold">Emergency calling</h2><p className="mt-2 text-[14px] leading-relaxed text-[#647084]">The Call option on Home lists published nationwide numbers and selected local services. Tapping a number opens your phone's dialer. This directory is incomplete and provider coverage must be verified.</p></div>
            <div className="rounded-[22px] bg-white p-5"><Shield className="mb-4 size-6" /><h2 className="text-[17px] font-bold">Service connection</h2><p className={subtitle}>This interface is not yet linked to a government ambulance dispatch centre. Use existing emergency telephone services for real emergencies.</p></div>
          </>}
        </main>
      </>}
    </div>
    <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Upload profile photo" onChange={(e) => upload(e.target.files?.[0])} />
    <BottomNav active="/profile" />
  </div>;
}

export function MedicalForm() {
  const { medical } = useCitizen();
  return <div className="space-y-4">
    <div><Label>Blood group (if known)</Label><select className={field} value={medical.bloodType} onChange={(e) => citizen.updateMedical({ bloodType: e.target.value })}>
      {["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((v) => <option key={v} value={v}>{v || "Not sure / rather not say"}</option>)}
    </select></div>
    <Field label="Allergies (optional)" value={medical.allergies} onChange={(allergies) => citizen.updateMedical({ allergies })} placeholder="e.g. penicillin" />
    <Field label="Medical conditions (optional)" value={medical.conditions} onChange={(conditions) => citizen.updateMedical({ conditions })} placeholder="Conditions responders should know" />
    <Field label="Current medication (optional)" value={medical.medication} onChange={(medication) => citizen.updateMedical({ medication })} placeholder="Medication and dosage if known" />
    <div><Label>Important notes (optional)</Label><textarea className={field + " min-h-24 py-3"} value={medical.notes} onChange={(e) => citizen.updateMedical({ notes: e.target.value })} placeholder="Anything else that could help" /></div>
  </div>;
}
function ContactForm({ value, set }: { value: Omit<Contact,"id">; set: (value: Omit<Contact,"id">) => void }) {
  return <div className="space-y-4">
    <Field label="Contact name" value={value.name} onChange={(name) => set({ ...value, name })} />
    <Field label="Phone number" value={value.phone} onChange={(phone) => set({ ...value, phone })} type="tel" />
    <Field label="Relationship" value={value.relationship} onChange={(relationship) => set({ ...value, relationship })} placeholder="Parent, partner, friend…" />
  </div>;
}
function PreferenceRow({ title, desc, checked, onChange, icon: Icon }: {
  title: string; desc: string; checked: boolean; onChange: (value: boolean) => void; icon: LucideIcon;
}) {
  return <label className="flex min-h-20 items-center gap-3 rounded-2xl bg-white px-4 py-3">
    <Icon className="size-5 shrink-0 text-[#42546D]" />
    <span className="flex-1"><span className="block text-[14px] font-semibold">{title}</span><span className={subtitle}>{desc}</span></span>
    <input aria-label={title} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 accent-[#1F6BCA]" />
  </label>;
}
