import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Building2, Database, Eye, EyeOff, Globe2, Landmark } from "lucide-react";
import hnuAfricaLogo from "../../assets/logos/logo-hnu-africa-institute-transparent.png";
import ciweiLogo from "../../assets/logos/logo-ciwei-security-transparent.png";
import smartLabLogo from "../../assets/logos/logo-smart-lab-transparent.png";
import shujizheLogo from "../../assets/logos/logo-shujizhe-transparent.png";
import titanSharkLogo from "../../assets/logos/logo-titanshark-transparent.png";
import africaMapOutline from "../../assets/africa-countries-outline.svg";

const partnerLogos = [
  { name: "湖南大学非洲研究院", src: hnuAfricaLogo, className: "h-12 w-auto max-w-[300px]" },
  { name: "中非经贸合作智能实验室", src: smartLabLogo, className: "h-16 w-auto max-w-[390px]" },
  { name: "刺猬安全", src: ciweiLogo, className: "h-10 w-auto max-w-[170px]" },
  { name: "数迹者", src: shujizheLogo, className: "h-10 w-auto max-w-[230px]" },
  { name: "钛鲨科技", src: titanSharkLogo, className: "h-10 w-auto max-w-[260px]" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"enterprise" | "government">("enterprise");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    window.setTimeout(() => {
      if (email && password) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        navigate("/");
      } else {
        setError("请输入账号和密码");
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-6">
      <div className="mx-auto grid min-h-[calc(100vh-48px)] max-w-screen-2xl grid-cols-1 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl lg:grid-cols-[3fr_2fr]">
        <section className="relative overflow-hidden bg-[#071B34] px-10 py-10 text-white lg:px-14">
          <div className="absolute inset-0 opacity-[0.14]">
            <svg className="h-full w-full" viewBox="0 0 900 760" preserveAspectRatio="none">
              <defs>
                <pattern id="login-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                  <path d="M48 0H0V48" fill="none" stroke="#FFFFFF" strokeWidth="0.7" />
                </pattern>
              </defs>
              <rect width="900" height="760" fill="url(#login-grid)" />
            </svg>
          </div>

          <div className="pointer-events-none absolute right-[92px] top-[96px] h-[720px] w-[585px] opacity-[0.22]">
            <img src={africaMapOutline} alt="" className="h-full w-full object-contain" aria-hidden="true" />
          </div>

          <div className="relative z-10 flex min-h-full flex-col">
            <div className="pt-10">
              <div className="max-w-2xl">
                <div>
                  <div>
                    <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">非洲出海安全官</h1>
                    <p className="mt-3 text-sm leading-6 text-blue-100">面向企业出海、供应链管理与海外安全决策的智能风险平台。</p>
                  </div>
                </div>
              </div>

              <div className="mt-14">
                <div className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/90">联合建设与数据支持</div>
                <div className="space-y-5">
                  {partnerLogos.map((logo) => (
                    <div key={logo.name} className="flex items-center">
                      <img src={logo.src} alt={logo.name} className={logo.className} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-12">
              <div className="grid grid-cols-3 gap-3">
                <FeatureTile icon={Globe2} label="风险地图" variant="dark" />
                <FeatureTile icon={Database} label="数据中心" variant="dark" />
                <FeatureTile icon={AlertTriangle} label="案例分析" variant="dark" />
              </div>
              <p className="mt-6 max-w-2xl text-xs leading-5 text-blue-100/80">
                本系统用于风险监测、案例研判、数据目录展示与智能问答演示，部分数据为模拟演示口径。
              </p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-[390px]"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-semibold tracking-tight text-gray-950">欢迎登录</h2>
              <p className="mt-2 text-sm text-gray-500">访问非洲出海安全官工作台</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">选择访问端</label>
                <div className="grid grid-cols-2 gap-3">
                  <RoleCard
                    icon={Building2}
                    title="企业端"
                    description="出海安全决策"
                    active={selectedRole === "enterprise"}
                    onClick={() => setSelectedRole("enterprise")}
                  />
                  <RoleCard
                    icon={Landmark}
                    title="政府端"
                    description="区域态势监管"
                    active={selectedRole === "government"}
                    onClick={() => setSelectedRole("government")}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">账号</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入账号"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#005BBB]"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm text-gray-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-[#005BBB]"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#005BBB] py-3.5 text-sm font-semibold text-white transition hover:bg-[#004A99] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isLoading ? (
                  <>
                    <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    登录
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </section>
      </div>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  description,
  active = false,
  onClick,
}: {
  icon: typeof Globe2;
  title: string;
  description: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-xl border px-3 py-3 text-left transition ${
        active
          ? "border-[#005BBB] bg-blue-50 text-[#005BBB] shadow-sm"
          : "border-gray-200 bg-white text-gray-500"
      } hover:border-blue-200 hover:bg-blue-50/50`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            active ? "bg-[#005BBB] text-white" : "bg-gray-100 text-gray-400"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {active && (
          <span className="h-2 w-2 rounded-full bg-[#005BBB]" />
        )}
      </div>
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-1 text-xs text-gray-500">{description}</div>
    </button>
  );
}

function FeatureTile({ icon: Icon, label, variant = "light" }: { icon: typeof Globe2; label: string; variant?: "light" | "dark" }) {
  if (variant === "dark") {
    return (
      <div className="rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-4 text-center">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-100">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-xs font-medium text-blue-50">{label}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-4 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#005BBB]/10 text-[#005BBB]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
    </div>
  );
}
