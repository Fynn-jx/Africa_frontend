import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { registerHooks } from "node:module";
import { readFile } from "node:fs/promises";
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch (e) {
        if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
      }
    }
    return nextResolve(specifier, context);
  },
});
const {
  calculateSignalStrength,
  getWarningLevel,
  resolvePlace,
  getReviewReasons,
  computeEventAnalysis,
  buildAdviceInput,
  uniqueStations,
} = await import("../src/utils/eventAnalysis.ts");
const { validateExtraction, validateAdvice, EVENT_TAG_GROUPS } =
  await import("../src/data/eventAnalysisSchema.ts");
const { createAnalyzeHandler, createDeepSeekCaller, default: realHandler } =
  await import("../api/analyze.ts");
const { EXTRACT_PROMPT, ADVISE_PROMPT } = await import("../api/_prompts.ts");
const { loadTazaraData } = await import("../src/utils/loadTazaraData.ts");
const coordinate = [31.2067054, -10.2434633];
const station = { name: "Kasama", coordinates: coordinate, type: "zambia" };
const fixture = () => ({
  is_risk_event: true,
  primary_tag: "社会ESG舆情",
  secondary_tags: [],
  signals: {
    E: { strength: 0.8, evidence: "发生抗议" },
    S: { strength: 0.6, evidence: "发生抗议" },
    V: { strength: 0.3, evidence: "运输受阻" },
    C: { strength: 0, evidence: "" },
  },
  confirmation: false,
  places: [{ name: "Kasama", country: "赞比亚", lat: null, lon: null }],
  event_date: "2026-10-12",
  summary: "测试事件摘要",
  confidence: 0.8,
  reason: "测试判断依据",
});
const land = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [28, -13],
            [34, -13],
            [34, -7],
            [28, -7],
            [28, -13],
          ],
        ],
      },
    },
  ],
};
const data = {
  stations: [station, { ...station }],
  railLines: [
    {
      type: "zambia",
      coordinates: [
        [31, -10.24],
        [31.5, -10.24],
      ],
    },
  ],
};
const invoke = async (handler, body, method = "POST") => {
  const response = {
    statusCode: 200,
    headers: {},
    payload: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(value) {
      this.payload = value;
      return this;
    },
  };
  await handler({ method, body }, response);
  return response;
};

test("signal composition uses E/S/V weights and excludes confirmation strength C", () => {
  const e = fixture();
  assert.ok(Math.abs(calculateSignalStrength(e.signals) - 0.59) < 1e-12);
  e.signals.C.strength = 1;
  assert.ok(Math.abs(calculateSignalStrength(e.signals) - 0.59) < 1e-12);
});
test("warning thresholds include exact boundaries and confirmation upgrades one level, capped at high", () => {
  for (const [L, level] of [
    [0, "无预警"],
    [0.0999, "无预警"],
    [0.1, "关注"],
    [0.2499, "关注"],
    [0.25, "警惕"],
    [0.4999, "警惕"],
    [0.5, "高危"],
    [1, "高危"],
  ])
    assert.equal(getWarningLevel(L), level);
  for (const [L, level] of [
    [0, "关注"],
    [0.1, "警惕"],
    [0.25, "高危"],
    [0.5, "高危"],
  ])
    assert.equal(getWarningLevel(L, true), level);
});
test("place resolution prioritizes station/Chinese alias, then city, then low-confidence LLM coordinate", () => {
  const p = { name: "卡萨马站附近", country: "", lat: 0, lon: 0 };
  assert.equal(resolvePlace(p, [station]).source, "站点库");
  assert.deepEqual(resolvePlace(p, [station]).coordinates, coordinate);
  assert.equal(
    resolvePlace({ ...p, name: "Lusaka" }, [station]).source,
    "城市库",
  );
  assert.equal(
    resolvePlace({ ...p, name: "Unknown Junction", lat: -10, lon: 31 }, [
      station,
    ]).source,
    "LLM 坐标·低置信",
  );
  assert.equal(
    resolvePlace({ ...p, name: "Kasamaville", lat: null, lon: null }, [station])
      .source,
    "unresolved",
  );
});
test("unresolved, low confidence, non-risk and LLM-only coordinates produce explicit review reasons", () => {
  const e = fixture();
  e.places = [{ name: "某非洲内陆小镇", country: "", lat: null, lon: null }];
  const r = computeEventAnalysis(e, data, land);
  assert.ok(r.reviewReasons.some((x) => x.includes("unresolved")));
  assert.equal(r.model, null);
  assert.equal(r.L, null);
  e.confidence = 0.59;
  e.is_risk_event = false;
  const reasons = getReviewReasons(e, [
    resolvePlace({ ...e.places[0], lat: -10, lon: 31 }, []),
  ]);
  assert.equal(reasons.length, 3);
});
test("L uses spatial maximum times signal only once; actual footprint and deduplicated hits use R", () => {
  const r = computeEventAnalysis(fixture(), data, land);
  assert.ok(Math.abs(r.L - 0.59) < 1e-6);
  assert.equal(r.warningLevel, "高危");
  assert.equal(r.maximumSpatialImpact, 1);
  assert.equal(r.stationHits.length, 1);
  assert.ok(Math.abs(r.stationHits[0].impact - r.L) < 1e-6);
  assert.ok(r.model.areaKm2 > 0);
  assert.equal(uniqueStations(data.stations).length, 1);
  const input = buildAdviceInput(r);
  assert.equal(input.L, r.L);
  assert.equal(input.areaKm2, r.model.areaKm2);
});
test("subthreshold signals retain real L below 0.1 without inventing hits", () => {
  const e = fixture();
  for (const signal of Object.values(e.signals)) signal.strength = 0.05;
  const r = computeEventAnalysis(e, data, land);
  assert.ok(Math.abs(r.L - 0.05) < 1e-6);
  assert.equal(r.stationHits.length, 0);
  assert.equal(r.model.areaKm2, 0);
  assert.equal(r.warningLevel, "无预警");
});
test("non-risk events have no footprint or warning; manual correction recalculates without modifying original extraction", () => {
  const e = fixture();
  e.is_risk_event = false;
  e.confirmation = true;
  const r = computeEventAnalysis(e, data, land);
  assert.equal(r.model, null);
  assert.equal(r.warningLevel, null);
  assert.throws(() => buildAdviceInput(r));
  const manual = {
    primaryTag: "能源价格",
    place: resolvePlace(e.places[0], [station]),
    isRiskEvent: true,
  };
  const corrected = computeEventAnalysis(e, data, land, manual);
  assert.ok(corrected.model);
  assert.equal(corrected.parameters.halfDistanceKm, 75);
  assert.equal(e.primary_tag, "社会ESG舆情");
  assert.equal(e.is_risk_event, false);
  assert.equal(corrected.manual, manual);
  assert.equal(corrected.extraction, e);
  assert.throws(() =>
    computeEventAnalysis(e, data, land, {
      ...manual,
      place: { ...manual.place, coordinates: [NaN, -10] },
    }),
  );
});
test("strict extraction rejects invented quotes, invalid categories, dates and coordinates; advice requires 3–5 actions", () => {
  const source = "Kasama 发生抗议，运输受阻。";
  assert.deepEqual(validateExtraction(fixture(), source), fixture());
  for (const edit of [
    (e) => (e.primary_tag = "新标签"),
    (e) => (e.signals.E.evidence = "未出现的引文"),
    (e) => (e.signals.E.strength = 2),
    (e) => (e.event_date = "2026-02-30"),
    (e) => (e.places[0].lat = 91),
    (e) => (e.confirmation = true),
  ]) {
    const e = fixture();
    edit(e);
    assert.throws(() => validateExtraction(e, source));
  }
  assert.throws(() =>
    validateAdvice({
      warning: "测试",
      recommendations: ["一条"],
      watch_signals: [],
    }),
  );
});
test("taxonomy in prompts matches all existing categories; advice prompt constrains facts", async () => {
  const source = await readFile(
    new URL("../src/app/pages/RegionalInsights.tsx", import.meta.url),
    "utf8",
  );
  for (const group of EVENT_TAG_GROUPS)
    for (const tag of group.tags) {
      assert.ok(source.includes(`"${tag}": {`));
      assert.ok(EXTRACT_PROMPT.includes(tag));
    }
  assert.ok(ADVISE_PROMPT.includes("不能把空间命中当作实际受损"));
});
test("API validates inputs, JSON contract, errors and allows only POST", async () => {
  let calls = 0;
  const handler = createAnalyzeHandler(async () => {
    calls++;
    return fixture();
  });
  const source = "Kasama 发生抗议，运输受阻。";
  const ok = await invoke(handler, {
    mode: "extract",
    text: source,
    projectId: "tazara",
  });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.headers["Cache-Control"], "no-store");
  for (const body of [
    undefined,
    "{",
    { mode: "x" },
    { mode: "extract", text: "短", projectId: "tazara" },
    { mode: "extract", text: "x".repeat(6001), projectId: "tazara" },
    { mode: "extract", text: source, projectId: "invalid" },
    { mode: "advise", computed: { L: NaN } },
  ]) {
    const r = await invoke(handler, body);
    assert.equal(r.statusCode, 400);
    assert.ok(r.payload.error);
  }
  assert.equal(calls, 1);
  assert.equal((await invoke(handler, {}, "GET")).statusCode, 405);
  const bad = await invoke(
    createAnalyzeHandler(async () => ({ unexpected: true })),
    { mode: "extract", text: source, projectId: "tazara" },
  );
  assert.equal(bad.statusCode, 502);
  assert.equal(bad.payload.code, "INVALID_EXTRACTION");
  const failure = await invoke(
    createAnalyzeHandler(async () => {
      throw new Error("private upstream detail");
    }),
    { mode: "extract", text: source, projectId: "tazara" },
  );
  assert.equal(failure.statusCode, 500);
  assert.ok(!JSON.stringify(failure.payload).includes("private upstream"));
  const advice = {
    warning: "待核实",
    recommendations: ["核实站点", "核对库存", "协调发运"],
    watch_signals: ["通行状态"],
  };
  const advised = await invoke(
    createAnalyzeHandler(async () => advice),
    {
      mode: "advise",
      computed: buildAdviceInput(computeEventAnalysis(fixture(), data, land)),
    },
  );
  assert.equal(advised.statusCode, 200);
  assert.deepEqual(advised.payload, advice);
});
test("missing server credential is a clear 503 error, never a fabricated result", async () => {
  const saved = process.env.DEEPSEEK_API_KEY;
  try {
    delete process.env.DEEPSEEK_API_KEY;
    const r = await invoke(realHandler, {
      mode: "extract",
      text: "Kasama 发生抗议，运输受阻。",
      projectId: "tazara",
    });
    assert.equal(r.statusCode, 503);
    assert.equal(r.payload.code, "MISSING_API_KEY");
    assert.equal(r.payload.summary, undefined);
  } finally {
    if (saved === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = saved;
  }
});
test("real TAZARA stations and country polygons yield hits at Kasama with library coordinates", async () => {
  const saved = globalThis.fetch;
  try {
    globalThis.fetch = async (url) =>
      new Response(await readFile(new URL(`../public${url}`, import.meta.url)));
    const rail = await loadTazaraData();
    const countries = JSON.parse(
      await readFile(
        new URL(
          "../public/data/african-countries-only.geojson",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    const r = computeEventAnalysis(fixture(), rail, countries);
    assert.equal(r.selectedPlace.source, "站点库");
    assert.ok(r.model.areaKm2 > 0);
    assert.ok(r.stationHits.some((hit) => hit.name === "Kasama"));
    assert.ok(r.L >= 0.5 && r.L <= 1);
  } finally {
    globalThis.fetch = saved;
  }
});
test("SPA rewrite excludes the API namespace while preserving deep links", async () => {
  const config = JSON.parse(
    await readFile(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  const re = new RegExp(`^${config.rewrites[0].source}$`);
  assert.equal(re.test("/api/analyze"), false);
  assert.equal(re.test("/api"), false);
  assert.equal(re.test("/event-analysis"), true);
  assert.equal(re.test("/"), true);
});


test("manual correction resolves location warnings while retaining low confidence and original evidence", () => {
  const e = fixture();
  e.confidence = 0.4;
  e.places = [];
  const manual = { primaryTag: "社会ESG舆情", place: resolvePlace(fixture().places[0], [station]), isRiskEvent: true };
  const result = computeEventAnalysis(e, data, land, manual);
  assert.ok(result.model);
  assert.equal(result.reviewReasons.length, 1);
  assert.ok(result.reviewReasons[0].includes("置信度"));
  assert.ok(result.originalReviewReasons.some(reason => reason.includes("unresolved")));
  assert.deepEqual(buildAdviceInput(result).original_review_reasons, result.originalReviewReasons);
  assert.equal(e.places.length, 0);

  const nonRisk = computeEventAnalysis(e, data, land, { ...manual, place: null, isRiskEvent: false });
  assert.equal(nonRisk.model, null);
  assert.equal(nonRisk.L, null);
  assert.ok(nonRisk.reviewReasons.some(reason => reason.includes("非风险")));
  assert.throws(() => computeEventAnalysis(e, data, land, { ...manual, place: null }));
});

test("API handles Vercel lazy JSON parse failures as a 400 client error", async () => {
  const handler = createAnalyzeHandler(async () => { throw new Error("Must not call model"); });
  const req = { method: "POST", get body() { throw new SyntaxError("Malformed JSON"); } };
  let status, payload;
  const res = { setHeader() {}, status(code) { status = code; return this; }, json(value) { payload = value; } };
  await handler(req, res);
  assert.equal(status, 400);
  assert.equal(payload.code, "INVALID_INPUT");
});

test("advice rejects malformed evidence, coordinates, impacts and review reasons before calling model", async () => {
  const computed = buildAdviceInput(computeEventAnalysis(fixture(), data, land));
  let called = false;
  const handler = createAnalyzeHandler(async () => { called = true; return {}; });
  for (const change of [
    c => c.evidence = {},
    c => c.evidence.E.strength = 2,
    c => c.evidence.E.evidence = "",
    c => c.station_hits = [{ ...c.station_hits[0], impact: 2 }],
    c => c.asset_hits = [{ name: "Bad asset", source: "test", coordinates: [200, -10], impact: 0.5, costKm: 1 }],
    c => c.review_reasons = [{}],
  ]) {
    const invalid = structuredClone(computed);
    change(invalid);
    const response = await invoke(handler, { mode: "advise", computed: invalid });
    assert.equal(response.statusCode, 400);
    assert.equal(response.payload.code, "INVALID_COMPUTED");
  }
  assert.equal(called, false);
});

// The marker below is random, in-memory test data, never a real credential.
// Every transport in these tests is injected; no request can reach a network.
const testEnvironment = () => ({ DEEPSEEK_API_KEY: randomUUID() });
const extractBody = () => ({ mode: "extract", text: "Kasama 发生抗议，运输受阻。", projectId: "tazara" });
const envelope = value => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] }));

test("DeepSeek transport uses JSON mode, the configured model and validated input", async () => {
  let requests = 0;
  const caller = createDeepSeekCaller({
    environment: { ...testEnvironment(), DEEPSEEK_MODEL: "configured-model" },
    request: async (url, init) => {
      requests++;
      assert.equal(url, "https://api.deepseek.com/chat/completions");
      assert.equal(init.method, "POST");
      assert.ok(init.signal instanceof AbortSignal);
      const body = JSON.parse(init.body);
      assert.equal(body.model, "configured-model");
      assert.deepEqual(body.response_format, { type: "json_object" });
      assert.equal(body.temperature, 0.1);
      assert.equal(body.messages[0].content, EXTRACT_PROMPT);
      assert.deepEqual(JSON.parse(body.messages[1].content), { text: extractBody().text, projectId: "tazara" });
      return envelope(fixture());
    },
  });
  const response = await invoke(createAnalyzeHandler(caller), extractBody());
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, fixture());
  assert.equal(requests, 1);
});

test("DeepSeek non-200, malformed JSON, missing result and network errors never expose upstream bodies", async () => {
  for (const [request, code] of [
    [async () => new Response("private provider detail", { status: 429 }), "UPSTREAM_ERROR"],
    [async () => new Response("not JSON"), "INVALID_JSON"],
    [async () => new Response(JSON.stringify({ choices: [{ message: { content: "not JSON" } }] })), "INVALID_JSON"],
    [async () => new Response("{}"), "INVALID_RESPONSE"],
    [async () => { throw new Error("private provider detail"); }, "NETWORK_ERROR"],
  ]) {
    const caller = createDeepSeekCaller({ environment: testEnvironment(), request });
    const response = await invoke(createAnalyzeHandler(caller), extractBody());
    assert.equal(response.statusCode, 502);
    assert.equal(response.payload.code, code);
    assert.ok(response.payload.error);
    assert.equal(response.payload.summary, undefined);
    assert.ok(!JSON.stringify(response.payload).includes("private provider detail"));
  }
});

test("DeepSeek timeout aborts the upstream request and returns 504", async () => {
  let aborted = false;
  const caller = createDeepSeekCaller({
    environment: testEnvironment(), timeoutMs: 5,
    request: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => { aborted = true; reject(signal.reason); }, { once: true });
    }),
  });
  const response = await invoke(createAnalyzeHandler(caller), extractBody());
  assert.equal(aborted, true);
  assert.equal(response.statusCode, 504);
  assert.equal(response.payload.code, "UPSTREAM_TIMEOUT");
  assert.equal(response.payload.summary, undefined);
});

test("four-sample API runner reports missing credentials for every example without fake results", () => {
  const response = spawnSync(process.execPath, ["scripts/test-analyze-api.mjs"], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, DEEPSEEK_API_KEY: "" },
    encoding: "utf8",
  });
  assert.equal(response.status, 1);
  const lines = response.stderr.trim().split(/\r?\n/).map(line => JSON.parse(line));
  assert.equal(lines.length, 4);
  assert.deepEqual(lines.map(line => line.sample), ["kasama", "multilingual", "non-risk", "unresolved"]);
  for (const line of lines) {
    assert.equal(line.status, 503);
    assert.equal(line.code, "MISSING_API_KEY");
    assert.equal(line.summary, undefined);
  }
  assert.equal(response.stdout, "");
});


test("compiled API modules resolve rewritten imports and preserve the handler contract", async () => {
  const ts = (await import("typescript")).default;
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");
  const root = fileURLToPath(new URL("..", import.meta.url));
  const configPath = path.join(root, "api", "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
  const files = new Map();
  const program = ts.createProgram(parsed.fileNames, {
    ...parsed.options,
    rootDir: root,
    outDir: path.join(root, "tmp", "analysis-api-smoke"),
  });
  const result = program.emit(undefined, (file, content) => files.set(file.replaceAll("\\", "/"), content));
  const errors = ts.getPreEmitDiagnostics(program).filter(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory: () => root, getCanonicalFileName: file => file, getNewLine: () => "\n"
  }));
  assert.equal(result.emitSkipped, false);
  const emitted = suffix => {
    const content = [...files].find(([file]) => file.endsWith(suffix))?.[1];
    assert.ok(content, "Expected emitted " + suffix);
    return content;
  };
  const moduleURL = content => "data:text/javascript;base64," + Buffer.from(content, "utf8").toString("base64");
  const schema = moduleURL(emitted("/src/data/eventAnalysisSchema.js"));
  const prompts = moduleURL(emitted("/api/_prompts.js").replace("../src/data/eventAnalysisSchema.js", schema));
  const source = emitted("/api/analyze.js");
  assert.ok(!source.includes('from "./_prompts.ts"'));
  assert.ok(source.includes('from "./_prompts.js"'));
  const compiled = await import(moduleURL(source.replace("./_prompts.js", prompts).replace("../src/data/eventAnalysisSchema.js", schema)));
  const response = await invoke(compiled.createAnalyzeHandler(async () => fixture()), extractBody());
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, fixture());
});
