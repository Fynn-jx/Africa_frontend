// Node 24+: directly exercises the real Vercel handler; reads process env only.
// Never load, display, or write credentials. Use the shell's environment securely.
import handler from "../api/analyze.ts";
import { eventAnalysisSamples } from "../src/data/eventAnalysisSamples.ts";

for (const sample of eventAnalysisSamples) {
  let status = 200;
  let payload;
  const res = {
    setHeader() {},
    status(code) {
      status = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
  };
  await handler(
    {
      method: "POST",
      body: { mode: "extract", text: sample.text, projectId: "tazara" },
    },
    res,
  );
  if (status !== 200) {
    console.error(
      JSON.stringify({
        sample: sample.id,
        status,
        code: payload?.code,
        error: payload?.error,
      }),
    );
    process.exitCode = 1;
    continue;
  }
  console.log(
    JSON.stringify(
      {
        sample: sample.id,
        status,
        is_risk_event: payload.is_risk_event,
        primary_tag: payload.primary_tag,
        secondary_tags: payload.secondary_tags,
        signals: payload.signals,
        confirmation: payload.confirmation,
        places: payload.places,
        event_date: payload.event_date,
        summary: payload.summary,
        confidence: payload.confidence,
        reason: payload.reason,
      },
      null,
      2,
    ),
  );
}
