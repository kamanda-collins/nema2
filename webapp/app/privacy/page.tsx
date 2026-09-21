export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <header className="border-b-4 border-brand pb-5">
        <p className="label">Pilot privacy notice</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your location is sensitive.</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Treat a property pin, parcel reference, phone number, and payment information as sensitive
          information. This pilot is designed to minimize what it records.
        </p>
      </header>

      <section className="card space-y-3 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-bold text-slate-900">What the screening service uses</h2>
        <p>Your location input is sent to the screening API to find mapped water and wetland signals. The generic activity log records the result category, country, and input method, but not the precise coordinates.</p>
        <p>Do not enter an owner name, title number, identity document, phone number, or payment detail into the location/reference fields.</p>
      </section>

      <section className="card space-y-3 text-sm leading-relaxed text-slate-700">
        <h2 className="text-lg font-bold text-slate-900">What this pilot does not do</h2>
        <p>It does not establish ownership, verify a title, create a public parcel database, or disclose coordinates through public report verification.</p>
        <p>Professional reports and self-service payments are disabled while data provenance, reviewer workflow, retention, and entitlement controls are completed.</p>
      </section>

      <section className="rounded-xl bg-slate-900 p-5 text-sm leading-relaxed text-slate-100">
        <h2 className="font-bold">Before production launch</h2>
        <p className="mt-2 text-slate-300">The operator must publish contact details, a retention/deletion process, lawful basis and consent information, security measures, and applicable Kenya/Uganda data-protection compliance details. See the project’s updates.md for the operational checklist.</p>
      </section>
    </article>
  );
}
