import { useLocation, Link } from "react-router-dom";
import { Shield, LayoutDashboard, TestTube, GitFork } from "lucide-react";

function Navigation() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="rounded-lg transition-all">
              <img
                src="./aigis-logo.png"
                alt="AIGIS Logo"
                className="w-32 h-32 sm:w-12 md:w-16 sm:h-12 md:h-16"
              />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold text-white">
              AIGIS
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
                isActive("/")
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              to="/test-page"
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
                isActive("/test-page")
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <TestTube className="w-4 h-4" />
              <span className="hidden sm:inline">Test URLs</span>
            </Link>
          </div>

          {/* GitHub Link */}
          <a
            href="https://github.com/itzzfalcon52/demo-WFA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm sm:text-base"
          >
            <GitFork className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline font-medium">GitHub</span>
          </a>

          {/* Status Indicator */}
          <div className="hidden md:flex px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <p className="text-xs text-emerald-300 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse block" />
              Online
            </p>
          </div>

          {/* Mobile Status - Just the dot */}
          <div className="md:hidden flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
