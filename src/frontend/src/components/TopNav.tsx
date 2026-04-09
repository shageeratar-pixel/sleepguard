import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Moon, PlayCircle, Search } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navLinks = [
  { label: "Overview", path: "/" },
  { label: "Session", path: "/session" },
  { label: "Analysis", path: "/analysis" },
  { label: "Settings", path: "/settings" },
];

export default function TopNav() {
  const { clear, identity } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
      style={{
        background: "oklch(0.11 0.028 258)",
        borderBottom: "1px solid oklch(0.22 0.04 255)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.58 0.22 278 / 0.2)" }}
          >
            <Moon
              className="w-4 h-4"
              style={{ color: "oklch(0.75 0.18 278)" }}
            />
          </div>
          <span className="font-display font-700 text-sm md:text-base text-foreground whitespace-nowrap">
            SleepGuard
            <span className="hidden md:inline text-muted-foreground font-normal">
              {" "}
              – AI Sleep Monitoring
            </span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              type="button"
              key={link.path}
              onClick={() => navigate({ to: link.path as "/" })}
              data-ocid={`nav.${link.label.toLowerCase()}.link`}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                currentPath === link.path
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            data-ocid="nav.search.button"
          >
            <Search className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            className="rounded-full font-semibold px-5"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.58 0.22 278), oklch(0.68 0.18 278))",
              color: "white",
            }}
            data-ocid="nav.start_session.primary_button"
            onClick={() => navigate({ to: "/session" as "/" })}
          >
            <PlayCircle className="w-4 h-4 mr-1.5" />
            Start Session
          </Button>
          {identity && (
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              data-ocid="nav.logout.button"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
