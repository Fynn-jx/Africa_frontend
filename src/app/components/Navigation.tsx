import { Link, useLocation, useNavigate } from "react-router-dom";
import { Globe, AlertTriangle, Target, Layers, Database, LogOut } from "lucide-react";

const navItems = [
  {
    path: "/",
    label: "风险情绪指数",
    icon: Globe,
  },
  {
    path: "/conflict-warning",
    label: "冲突预警",
    icon: AlertTriangle,
  },
  {
    path: "/impact-simulator",
    label: "影响模拟器",
    icon: Target,
  },
  {
    path: "/regional-insights",
    label: "重点项目",
    icon: Layers,
  },
  {
    path: "/data-sources",
    label: "数据中心",
    icon: Database,
  },
];

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-screen-2xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-[#005BBB]" />
            <h1 className="text-lg tracking-tight text-gray-900">
              非洲出海安全官
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/" && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg
                      transition-all duration-300
                      ${
                        isActive
                          ? "bg-[#005BBB] text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-50"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="h-6 w-px bg-gray-300"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-all duration-300"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">退出</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
