export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-medium leading-tight text-ink">Your location is sensitive.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Treat a property pin, parcel reference, phone number, and payment information as sensitive
          information. This pilot is designed to minimize what it records.
        </p>
      </header>

      <section className="card space-y-3 p-5 text-sm leading-relaxed text-muted">
        <h2 className="text-base font-medium text-ink">What the screening service uses</h2>
        <p>
          Your location input is sent to the screening API to find mapped water and wetland signals.
          The generic activity log records the result category, country, and input method, but not
          the precise coordinates.
        </p>
        <p>
          Do not enter an owner name, title number, identity document, phone number, or payment
          detail into the location/reference fields.
        </p>
      </section>

      <section className="card space-y-3 p-5 text-sm leading-relaxed text-muted">
        <h2 className="text-base font-medium text-ink">What this pilot does not do</h2>
        <p>
          It does not establish ownership, verify a title, create a public parcel database, or
          disclose coordinates through public report verification.
        </p>
        <p>
          Professional reports and self-service payments are disabled while data provenance,
          reviewer workflow, retention, and entitlement controls are completed.
        </p>
      </section>

      <section className="card space-y-3 p-5 text-sm leading-relaxed text-muted">
        <h2 className="text-base font-medium text-ink">Before production launch</h2>
        <p>
          The operator must publish contact details, a retention/deletion process, lawful basis and
          consent information, security measures, and applicable Kenya/Uganda data-protection
          compliance details. See the project&apos;s updates.md for the operational checklist.
        </p>
      </section>
    </article>
  );
}
