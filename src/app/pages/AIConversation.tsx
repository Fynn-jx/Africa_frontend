import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileSearch,
  Globe2,
  Layers,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  UserRound,
} from "lucide-react";

type ChatRole = "assistant" | "user";
type ScopeId = "all" | "pori" | "case" | "data" | "project";

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  references?: string[];
}

interface ScopeOption {
  id: ScopeId;
  label: string;
  count: string;
  icon: typeof Globe2;
}

const scopeOptions: ScopeOption[] = [
  { id: "all", label: "全平台", count: "风险 / 案例 / 数据 / 项目", icon: Globe2 },
  { id: "pori", label: "风险情绪指数", count: "PORI 15维", icon: ShieldAlert },
  { id: "case", label: "案例分析", count: "4个重点案例", icon: FileSearch },
  { id: "data", label: "数据中心", count: "基础与衍生数据", icon: Database },
  { id: "project", label: "重点项目", count: "资产与通道", icon: Layers },
];

const initialMessages: ChatMessage[] = [
  {
    id: "m-0",
    role: "assistant",
    content:
      "我已接入当前平台的风险情绪指数、案例分析、数据中心和重点项目模块。你可以直接问事件、国家、指数口径、数据来源或处置方案，我会按平台内已有信息回答。",
    references: ["风险情绪指数", "案例分析", "数据中心"],
  },
];

const quickFacts = [
  { label: "当前案例", value: "4" },
  { label: "PORI维度", value: "15" },
  { label: "衍生指数", value: "5" },
  { label: "数据域", value: "基础 + 衍生" },
];

const referenceItems = [
  { title: "赞比亚谦比希尾矿坝事故", type: "案例", detail: "环境事故 / 铜带省 / 2025-02-18" },
  { title: "坦桑尼亚达累斯萨拉姆港停摆", type: "案例", detail: "交通运输 / 坦赞走廊 / 2025-10-29" },
  { title: "津巴布韦锂精矿出口禁令", type: "案例", detail: "经营管理 / 锂供应链 / 2026-02-25" },
  { title: "刚果（金）鲁巴亚钶钽矿塌方", type: "案例", detail: "供应链 / 北基伍省 / 2026-01-28" },
  { title: "PORI舆情风险情绪指数", type: "指数", detail: "3个大维度 / 15个小维度" },
  { title: "PERI / SCRI / LBTI / LECSI", type: "指数", detail: "政策准入、产业链、物流、ESG民意" },
];

const loadingSteps = ["检索平台知识库", "关联案例与指数口径", "生成可引用答复"];

const promptHints = [
  "达累斯萨拉姆港案例的风险链路是什么？",
  "PORI情绪数据包含哪些维度？",
];

function buildAssistantReply(question: string, scope: ScopeId): ChatMessage {
  const normalized = question.toLowerCase();

  if (question.includes("达累斯萨拉姆") || question.includes("坦桑") || normalized.includes("dar")) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "坦桑尼亚案例的核心不是单一港口运营中断，而是“大选争议 - 抗议宵禁 - 断网黑箱 - 港口闭库 - 铁路与边境倒灌 - 铜钴出口中断”的链式风险。达累斯萨拉姆港承载了非洲对华铜出口的关键份额，一旦关闭，刚果（金）和赞比亚矿山货物会同时挤向替代港口，造成德班、贝拉、沃尔维斯湾等节点二次拥堵。处置上建议分层分货：高价值急单走空运或公路，大宗低优先级货物保留在内陆仓库等待窗口恢复，同时自动归集宵禁令、闭库通知和航运异常，作为保险理赔与延期交付证据。",
      references: ["坦桑尼亚达累斯萨拉姆港停摆", "LBTI物流通道安全指数", "案例分析-交通运输场景"],
    };
  }

  if (question.includes("鲁巴亚") || question.includes("刚果") || question.includes("钽") || question.includes("塌方")) {
    if (question.includes("简报") || question.includes("报告")) {
      return {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "事件情况：2026年1月28日，刚果（金）北基伍省鲁巴亚钶钽矿区发生特大塌方。该矿区是全球钽供应链关键节点，事故造成严重人员伤亡，并引发下游电子、航空航天和电容器产业的供应紧张。原因研判：强降雨是直接触发因素，但真正的风险放大器是M23控制下的掠夺性开采、无支护矿洞、超员作业和救援通道受阻。方案建议：立即将该节点纳入冲突矿产一级响应，启动巴西、澳大利亚等合规替代供应；同步生成供应链风险排除报告，证明企业未采购受灾非法区域矿石；对当地人员和NGO发布撤离提示，并用气象、社群线索、遥感与道路通行数据建立灾害预警模型。",
        references: ["刚果（金）鲁巴亚钶钽矿塌方", "SCRI产业链韧性预警指数", "冲突矿产合规报告"],
      };
    }

    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "鲁巴亚事件属于“灾害触发、治理失效放大、供应链外溢”的复合风险。强降雨只是导火索，深层原因是M23控制下的掠夺性开采、矿坑超员、无支护平行挖掘和救援通道受阻。平台建议把气象预警、矿井渗水社群线索、夜光遥感、道路通行和钽矿非正式报价放在同一个监测框架里；一旦确认停产，应立即启动巴西、澳大利亚等合规替代供应，生成供应链风险排除报告，证明企业未采购受灾非法区域矿石，降低“冲突矿产”合规和声誉风险。",
      references: ["刚果（金）鲁巴亚钶钽矿塌方", "SCRI产业链韧性预警指数", "刺猬安全社群数据"],
    };
  }

  if (question.includes("津巴布韦") || question.includes("锂") || question.includes("禁令")) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "津巴布韦锂精矿禁令体现的是资源民族主义和政策突袭风险。企业原本按2027年全面禁令安排出货，但抢出口行为刺激政府提前采取“即刻生效、覆盖在途货物、清洗贸易商”的强行政命令。系统应重点监测总统、矿业部长、议会辩论和本地主流媒体中“禁止原矿出口、本土化加工、增加国家收入”等高危语义。一旦进入橙色预警，应清点在途货物与边境库存，抢运高价值精矿，同步启动澳大利亚、南美备用采购，并保存纳税、装运和政府沟通证据，服务豁免申请或仲裁。",
      references: ["津巴布韦锂精矿出口禁令", "PERI政策准入风险指数", "SCRI产业链韧性预警指数"],
    };
  }

  if (question.includes("赞比亚") || question.includes("谦比希") || question.includes("尾矿")) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "赞比亚案例的风险主线是尾矿坝工程失效叠加社区信任透支。事故点位于铜带省谦比希湿法冶炼厂尾矿坝，酸性尾矿水进入姆旺巴希河与卡富埃水系，影响水源、农田和渔业生态。传统做法通常依赖事后修复和公关说明，但平台方案更强调前置监测：把降雨、水位、渗压、坝体位移、视频巡检和社区投诉放入同一预警模型，并用第三方水质采样、临时供水、健康筛查和赔偿台账来重建政府与社区信任。",
      references: ["赞比亚谦比希尾矿坝事故", "LECSI本地ESG民意风险指数", "环境修复台账"],
    };
  }

  if (question.includes("PORI") || question.includes("情绪") || question.includes("15") || question.includes("维度")) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "PORI当前按三组风险展开。第一组是核心政治与权力博弈风险，覆盖政权更迭、军事冲突、恐怖极端主义、国际制裁、意识形态与民族主义脱钩。第二组是经济、贸易与资源对抗风险，覆盖供应链卡脖子、能源价格、跨境金融、贸易保护、技术冷战。第三组是治理、合规与长臂管辖风险，覆盖国有化征收、监管武器化、网络与数据主权、气候绿色壁垒、社会动荡与ESG舆情。前端展示时已经做了短标签，详情解释仍保留原义。",
      references: ["PORI舆情风险情绪指数", "风险情绪指数页面", "数据中心-PORI字段"],
    };
  }

  if (question.includes("刺猬安全") || question.includes("社区交流群")) {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "刺猬安全被作为“非洲社区交流群数据”的一个来源，用来补充开源信息之外的前方线索。当前样例中集中记录了多起涉及中方人员、矿区、绑架、袭击、抗议和抢劫的事件，覆盖马里、刚果（金）、喀麦隆、尼日利亚、津巴布韦和几内亚等国家。这类数据的价值在于补足正式媒体和政府通报的滞后，尤其适合识别矿区安保、社区敌意、极端组织袭击和中资企业现场风险。",
      references: ["非洲社区交流群数据", "刺猬安全", "基础数据源"],
    };
  }

  if (question.includes("衍生") || question.includes("指数") || question.includes("数据中心") || scope === "data") {
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "平台衍生数据目前包括PORI舆情风险情绪指数、PERI政策准入风险指数、SCRI产业链韧性预警指数、LBTI物流通道安全指数和LECSI本地ESG民意风险指数。它们分别对应国家情绪、选址准入、经营管理、交通运输和社区生态场景。基础数据侧包括新闻事件、社交媒体、社区交流群、冲突事件、重点资产、人口空间、公共设施和矿产矿床等，用于支撑指数计算、案例分析和方案报告生成。",
      references: ["数据中心", "平台衍生指数", "基础数据目录"],
    };
  }

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content:
      "我会按当前平台数据先给出一个可核查回答：建议把问题拆成对象、地点、时间、风险类型和想要的输出。比如询问“某个案例的原因”“某个国家的PORI维度”“某条物流通道的替代方案”或“某类数据的字段来源”。如果你希望我进一步生成报告，我可以按“事件情况 - 原因研判 - 处置方案”的结构输出。",
    references: ["全平台检索", "案例分析", "数据中心"],
  };
}

export default function AIConversation() {
  const [activeScope, setActiveScope] = useState<ScopeId>("all");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const timeoutRef = useRef<number[]>([]);

  const activeScopeOption = useMemo(
    () => scopeOptions.find((item) => item.id === activeScope) ?? scopeOptions[0],
    [activeScope],
  );

  useEffect(() => {
    return () => {
      timeoutRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const clearPendingTimers = () => {
    timeoutRef.current.forEach((timer) => window.clearTimeout(timer));
    timeoutRef.current = [];
  };

  const handleSend = (raw?: string, presetScope?: ScopeId) => {
    const text = (raw ?? input).trim();
    if (!text || isThinking) return;

    const nextScope = presetScope ?? activeScope;
    setActiveScope(nextScope);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    clearPendingTimers();
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoadingStep(0);
    setIsThinking(true);

    timeoutRef.current = [
      window.setTimeout(() => setLoadingStep(1), 520),
      window.setTimeout(() => setLoadingStep(2), 1080),
      window.setTimeout(() => {
        const reply = buildAssistantReply(text, nextScope);
        setMessages((prev) => [...prev, reply]);
        setIsThinking(false);
        setLoadingStep(0);
        timeoutRef.current = [];
      }, 1780),
    ];
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#F6F8FB] px-8 py-6">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-5">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#005BBB]">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950">AI对话</h1>
              <p className="mt-1 text-sm text-gray-500">非洲出海安全官智能问答工作台</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            系统知识已同步
          </div>
        </header>

        <div className="grid min-h-[720px] grid-cols-[280px_minmax(0,1fr)_320px] gap-5">
          <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
              <Search className="h-4 w-4 text-[#005BBB]" />
              检索范围
            </div>
            <div className="mt-4 space-y-2">
              {scopeOptions.map((item) => {
                const Icon = item.icon;
                const isActive = activeScope === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveScope(item.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      isActive ? "border-blue-200 bg-blue-50 text-[#005BBB]" : "border-gray-100 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                    <div className="mt-1 pl-6 text-xs text-gray-500">{item.count}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-500">当前上下文</div>
              <div className="mt-2 text-sm font-semibold text-gray-950">{activeScopeOption.label}</div>
              <div className="mt-1 text-xs leading-5 text-gray-500">{activeScopeOption.count}</div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {quickFacts.map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                  <div className="text-[11px] text-gray-500">{item.label}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-950">{item.value}</div>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#005BBB]" />
                <div>
                  <div className="text-sm font-semibold text-gray-950">智能问答</div>
                  <div className="text-xs text-gray-500">回答基于当前平台已配置内容生成</div>
                </div>
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{activeScopeOption.label}</div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isThinking && <LoadingBubble step={loadingStep} />}
            </div>

            <div className="border-t border-gray-100 p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">试试问：</span>
                {promptHints.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => handleSend(question)}
                    disabled={isThinking}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#005BBB] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {question}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2 focus-within:border-blue-300 focus-within:bg-white">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-6 text-gray-900 outline-none placeholder:text-gray-400"
                  placeholder="询问案例、指数、数据字段、风险原因或处置方案..."
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isThinking}
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#005BBB] text-white transition hover:bg-[#004a99] disabled:cursor-not-allowed disabled:bg-gray-300"
                  aria-label="发送"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
              <Database className="h-4 w-4 text-[#005BBB]" />
              可引用对象
            </div>
            <div className="mt-4 space-y-3">
              {referenceItems.map((item) => (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -1 }}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold leading-5 text-gray-950">{item.title}</div>
                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-gray-500">{item.type}</span>
                  </div>
                  <div className="mt-2 text-xs leading-5 text-gray-500">{item.detail}</div>
                </motion.div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function LoadingBubble({ step }: { step: number }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#005BBB]">
        <Bot className="h-4 w-4" />
      </div>
      <div className="w-[420px] rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4" />
          AI正在处理
          <TypingDots />
        </div>
        <div className="mt-3 space-y-2">
          {loadingSteps.map((label, index) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  index <= step ? "border-[#005BBB] bg-[#005BBB] text-white" : "border-blue-200 bg-white text-blue-300"
                }`}
              >
                {index + 1}
              </div>
              <span className={index <= step ? "font-medium text-blue-950" : "text-blue-400"}>{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
          <motion.div
            className="h-full rounded-full bg-[#005BBB]"
            animate={{ width: `${34 + step * 33}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-[#005BBB]"
          animate={{ opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.16 }}
        />
      ))}
    </span>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#005BBB]">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div className={`max-w-[78%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-xl px-4 py-3 text-sm leading-6 ${
            isUser ? "bg-[#005BBB] text-white" : "border border-gray-100 bg-gray-50 text-gray-800"
          }`}
        >
          {message.content}
        </div>
        {!isUser && message.references && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.references.map((reference) => (
              <span key={reference} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-[#005BBB]">
                {reference}
              </span>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <UserRound className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
