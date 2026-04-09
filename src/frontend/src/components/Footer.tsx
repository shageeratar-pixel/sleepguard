import { Link } from "@tanstack/react-router";
import { Heart, Moon } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  return (
    <footer
      className="mt-16 py-8 px-6"
      style={{
        background: "oklch(0.11 0.028 258)",
        borderTop: "1px solid oklch(0.22 0.04 255)",
      }}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4" style={{ color: "oklch(0.75 0.18 278)" }} />
          <span className="text-sm font-semibold text-foreground">
            SleepGuard
          </span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-5">
          {["Features", "Privacy", "Terms", "Support", "Blog"].map((label) => (
            <span
              key={label}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              {label}
            </span>
          ))}
        </nav>

        {/* Copyright + credits */}
        <div className="flex flex-col items-center md:items-end gap-1">
          <p className="text-xs text-muted-foreground">
            © {year}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with <Heart className="inline w-3 h-3 text-red-400" /> using
              caffeine.ai
            </a>
          </p>
          <p className="text-xs" style={{ color: "oklch(0.75 0.18 278)" }}>
            Developed by Shageer
          </p>
        </div>
      </div>

      {/* Medical disclaimer */}
      <div
        className="max-w-[1200px] mx-auto mt-6 pt-4"
        style={{ borderTop: "1px solid oklch(0.18 0.03 255)" }}
      >
        <p
          className="text-xs text-center"
          style={{ color: "oklch(0.55 0.04 245)" }}
        >
          ⚕️ This app is for informational purposes only and is not a medical
          device. Consult a healthcare professional for diagnosis.
        </p>
      </div>
    </footer>
  );
}
