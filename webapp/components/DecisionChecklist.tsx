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
    <section className="card border-l-4 border-l-brand">
      <p className="label">Before you pay a deposit</p>
      <h2 className="text-lg font-bold text-slate-900">Your next verification steps</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-700">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
