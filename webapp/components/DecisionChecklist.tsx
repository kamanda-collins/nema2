import type { AssessPlotResponse } from "@/lib/types";

export default function DecisionChecklist({ result }: { result: AssessPlotResponse }) {
  const overlap = result.compliance.in_wetland || result.risk.traffic_light === "red";
  const unverified = result.provenance.coverage_status !== "verified";
  const steps = [
    overlap
      ? "Pause any deposit or construction commitment until a qualified professional has inspected the site."
      : "Keep this screen with the sale information; it is a starting point, not proof that the plot is clear.",
    "Ask a registered surveyor to confirm the actual parcel boundary and its relationship to any water feature.",
    "Verify the title and any encumbrances through the applicable land registry.",
    "Ask the responsible environmental or water authority which approval path applies before construction.",
  ];

  if (unverified) {
    steps.splice(1, 0, "Request an authority or licensed-data map check: this result used community or unverified mapped data.");
  }

  return (
    <section className="card p-5">
      <h2 className="text-base font-medium leading-tight text-ink">Before you pay a deposit</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-faint">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
