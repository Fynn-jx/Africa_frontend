import { EXTRACT_PROMPT, ADVISE_PROMPT } from "./_prompts.ts";
import {
  isEventTag,
  validateExtraction,
  validateAdvice,
} from "../src/data/eventAnalysisSchema.ts";

// Structural Vercel Node request/response types keep this function dependency-free.
interface Request {
  method?: string;
  body?: unknown;
}
interface Response {
  setHeader(name: string, value: string): unknown;
  status(code: number): Response;
  json(value: unknown): unknown;
}
class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const unit = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
const shortString = (v: unknown): v is string => typeof v === "string" && v.length <= 6000;
const hit = (v: unknown) => record(v) && shortString(v.name) && shortString(v.source) && unit(v.impact) &&
  Array.isArray(v.coordinates) && v.coordinates.length === 2 &&
  v.coordinates.every(n => typeof n === "number" && Number.isFinite(n)) &&
  Math.abs(v.coordinates[0]) <= 180 && Math.abs(v.coordinates[1]) <= 85 &&
  typeof v.costKm === "number" && Number.isFinite(v.costKm) && v.costKm >= 0;
function validateComputed(value: unknown) {
  if (!record(value)) return false;
  const c = value;
  return c.projectId === "tazara" && isEventTag(c.primary_tag) && unit(c.L) &&
    ["无预警", "关注", "警惕", "高危"].includes(String(c.warning_level)) &&
    typeof c.areaKm2 === "number" && Number.isFinite(c.areaKm2) && c.areaKm2 >= 0 &&
    Array.isArray(c.station_hits) && Array.isArray(c.asset_hits) && c.station_hits.length <= 300 && c.asset_hits.length <= 300 &&
    c.station_hits.every(hit) && c.asset_hits.every(hit) &&
    Array.isArray(c.review_reasons) && c.review_reasons.length <= 20 && c.review_reasons.every(shortString) &&
    record(c.evidence) && ["E", "S", "V", "C"].every(key => {
      const signal = (c.evidence as Record<string, unknown>)[key];
      return record(signal) && unit(signal.strength) && shortString(signal.evidence) &&
        (signal.strength === 0 || signal.evidence.trim().length > 0);
    }) && JSON.stringify(value).length <= 65000;
}

interface ModelRuntime {
  request?: typeof fetch;
  environment?: Record<string, string | undefined>;
  timeoutMs?: number;
}
// Runtime injection keeps transport tests offline, without real credentials.
export function createDeepSeekCaller({ request = fetch, environment = process.env, timeoutMs = 30000 }: ModelRuntime = {}) {
  async function callDeepSeek(prompt: string, input: unknown): Promise<unknown> {
    const key = environment.DEEPSEEK_API_KEY;
    if (!key?.trim())
      throw new ApiError(
        503,
        "MISSING_API_KEY",
        "服务端未配置 DEEPSEEK_API_KEY，请配置后重试。",
      );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const upstream = await request("https://api.deepseek.com/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: environment.DEEPSEEK_MODEL || "deepseek-chat",
          temperature: 0.1,
          response_format: { type: "json_object" },
          max_tokens: 3000,
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: JSON.stringify(input) },
          ],
        }),
      });
      // Never expose upstream bodies: providers may echo request details in errors.
      if (upstream.status !== 200)
        throw new ApiError(
          502,
          "UPSTREAM_ERROR",
          "AI 上游服务返回异常，请稍后重试或检查服务端配置。",
        );
      let envelope;
      try {
        envelope = await upstream.json();
      } catch {
        throw new ApiError(
          502,
          "INVALID_JSON",
          "AI 上游响应不是有效 JSON，请重试。",
        );
      }
      const content = envelope?.choices?.[0]?.message?.content;
      if (typeof content !== "string")
        throw new ApiError(
          502,
          "INVALID_RESPONSE",
          "AI 上游响应缺少结果，请重试。",
        );
      try {
        return JSON.parse(content);
      } catch {
        throw new ApiError(
          502,
          "INVALID_JSON",
          "AI 返回内容不是有效 JSON，请重试。",
        );
      }
    } catch (error) {
      if (controller.signal.aborted)
        throw new ApiError(
          504,
          "UPSTREAM_TIMEOUT",
          "AI 请求超过 30 秒，请稍后重试。",
        );
      if (error instanceof ApiError) throw error;
      throw new ApiError(502, "NETWORK_ERROR", "无法连接 AI 服务，请稍后重试。");
    } finally {
      clearTimeout(timer);
    }
  }
  // The model occasionally emits malformed JSON (e.g. unescaped quotes); retry once, never fabricate.
  return async function callWithRetry(prompt: string, input: unknown): Promise<unknown> {
    try {
      return await callDeepSeek(prompt, input);
    } catch (error) {
      if (error instanceof ApiError && error.code === "INVALID_JSON") return callDeepSeek(prompt, input);
      throw error;
    }
  };
}

// Injection supports deterministic contract tests without credentials or live requests.
export function createAnalyzeHandler(callModel = createDeepSeekCaller()) {
  return async function handler(req: Request, res: Response) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res
        .status(405)
        .json({ error: "仅支持 POST 请求。", code: "METHOD_NOT_ALLOWED" });
    }
    try {
      let body: unknown;
      // Vercel parses request.body lazily and can throw for malformed JSON.
      try { body = req.body; }
      catch { throw new ApiError(400, "INVALID_INPUT", "请求内容必须是有效 JSON。"); }
      if (typeof body === "string") {
        if (body.length > 70000)
          throw new ApiError(413, "INPUT_TOO_LARGE", "请求内容过长。");
        try {
          body = JSON.parse(body);
        } catch {
          throw new ApiError(400, "INVALID_INPUT", "请求内容必须是有效 JSON。");
        }
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new ApiError(400, "INVALID_INPUT", "请求内容必须是 JSON 对象。");
      const b = body as Record<string, unknown>;
      if (b.mode === "extract") {
        if (
          typeof b.text !== "string" ||
          Array.from(b.text.trim()).length < 10 ||
          Array.from(b.text.trim()).length > 6000
        ) {
          throw new ApiError(
            400,
            "INVALID_TEXT",
            "事件文本长度须为 10–6000 字符。",
          );
        }
        if (b.projectId !== "tazara")
          throw new ApiError(
            400,
            "INVALID_PROJECT",
            "请选择支持的项目：坦赞铁路 TAZARA。",
          );
        const result = await callModel(EXTRACT_PROMPT, {
          text: b.text.trim(),
          projectId: b.projectId,
        });
        try {
          return res
            .status(200)
            .json(validateExtraction(result, b.text.trim()));
        } catch {
          throw new ApiError(
            502,
            "INVALID_EXTRACTION",
            "AI 抽取字段或原文引句校验失败，请重试。",
          );
        }
      }
      if (b.mode === "advise") {
        if (!validateComputed(b.computed))
          throw new ApiError(
            400,
            "INVALID_COMPUTED",
            "计算结果缺少必要字段或数值无效，请先完成客户端计算。",
          );
        const result = await callModel(ADVISE_PROMPT, b.computed);
        try {
          return res.status(200).json(validateAdvice(result));
        } catch {
          throw new ApiError(
            502,
            "INVALID_ADVICE",
            "AI 建议格式校验失败，请重试。",
          );
        }
      }
      throw new ApiError(
        400,
        "INVALID_MODE",
        "mode 仅支持 extract 或 advise。",
      );
    } catch (error) {
      const safe =
        error instanceof ApiError
          ? error
          : new ApiError(500, "INTERNAL_ERROR", "研判服务暂时不可用，请重试。");
      return res
        .status(safe.status)
        .json({ error: safe.message, code: safe.code });
    }
  };
}
export default createAnalyzeHandler();
