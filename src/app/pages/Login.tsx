import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Database, Globe, AlertTriangle, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // 模拟登录验证
    setTimeout(() => {
      // 简单的验证逻辑
      if (email && password) {
        // 保存登录状态到 localStorage
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userEmail", email);
        // 跳转到首页
        navigate("/");
      } else {
        setError("请输入账号和密码");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#005BBB] via-[#003D7A] to-[#001F3D] flex items-center justify-center p-8 relative overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 世界地图网格 */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* 浮动图标 */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 text-white/10"
        >
          <Globe className="w-32 h-32" />
        </motion.div>

        <motion.div
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-32 right-32 text-white/10"
        >
          <Database className="w-40 h-40" />
        </motion.div>

        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/3 right-1/4 text-white/10"
        >
          <AlertTriangle className="w-24 h-24" />
        </motion.div>

        {/* 数据流线条 */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.line
            x1="0" y1="20%" x2="100%" y2="80%"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            animate={{
              x2: ["0%", "100%", "0%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.line
            x1="100%" y1="30%" x2="0%" y2="70%"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            animate={{
              x2: ["100%", "0%", "100%"],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* 左侧：产品信息 */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white space-y-8"
        >
          {/* 产品名称 */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight">
                非洲出海安全官
              </h1>
            </div>
          </div>

          {/* 关键特性 */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              大数据驱动
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" />
              非洲全景监测
            </div>
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              智能风险预警
            </div>
          </div>

          {/* 大赛信息 */}
          <div className="space-y-4 pt-8 border-t border-white/20">
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full text-sm font-semibold text-gray-900">
              第一届数字经济实践大赛
            </div>
            <div className="space-y-2 text-white/80 text-sm leading-relaxed">
              <p>本系统为参赛作品</p>
              <p>💡 重在产品设计理念</p>
              <p>📊 部分数据为模拟演示</p>
            </div>
          </div>

          {/* 数据指标 */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00D4FF]">27+</div>
              <div className="text-sm text-white/70 mt-1">数据来源</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00D4FF]">50+</div>
              <div className="text-sm text-white/70 mt-1">非洲国家</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#00D4FF]">24/7</div>
              <div className="text-sm text-white/70 mt-1">实时监测</div>
            </div>
          </div>
        </motion.div>

        {/* 右侧：登录表单 */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md ml-auto">
            {/* 登录标题 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎登录</h2>
              <p className="text-gray-600 text-sm">访问非洲出海安全官</p>
            </div>

            {/* 登录表单 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 账号输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  账号
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入您的账号"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005BBB] focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* 密码输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入您的密码"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#005BBB] focus:border-transparent transition-all pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* 登录按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#005BBB] to-[#003D7A] text-white py-4 rounded-xl font-medium hover:shadow-lg hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    登录
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* 提示信息 */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                演示账号：任意非空账号即可登录
                <br />
                本平台数据仅供演示，部分数据为模拟
              </p>
            </div>

            {/* 特色功能 */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-[#005BBB]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Globe className="w-4 h-4 text-[#005BBB]" />
                </div>
                <div className="text-xs text-gray-600">风险地图</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-[#005BBB]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-4 h-4 text-[#005BBB]" />
                </div>
                <div className="text-xs text-gray-600">冲突预警</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-[#005BBB]/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Database className="w-4 h-4 text-[#005BBB]" />
                </div>
                <div className="text-xs text-gray-600">数据来源</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 底部版权信息 */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs">
        © 2026 非洲出海安全官 | 第一届数字经济实践大赛参赛作品
      </div>
    </div>
  );
}
