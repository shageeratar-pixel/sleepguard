import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Moon,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: Activity,
    title: "AI Audio Analysis",
    description:
      "Real-time microphone monitoring detects snoring, gasping, and irregular breathing patterns.",
  },
  {
    icon: ShieldCheck,
    title: "Risk Detection",
    description:
      "Assess risk for Sleep Apnea, Insomnia, and RBD with scientifically-grounded algorithms.",
  },
  {
    icon: TrendingUp,
    title: "Trend Tracking",
    description:
      "Track your sleep quality over weeks and identify patterns to improve your health.",
  },
];

export default function LandingPage() {
  const { login, loginStatus } = useInternetIdentity();
  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.09 0.025 260) 0%, oklch(0.07 0.02 255) 60%, oklch(0.08 0.03 280) 100%)",
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.58 0.22 278 / 0.2)" }}
          >
            <Moon
              className="w-5 h-5"
              style={{ color: "oklch(0.75 0.18 278)" }}
            />
          </div>
          <span className="font-display font-bold text-lg text-foreground">
            SleepGuard
          </span>
        </div>
        <Button
          onClick={login}
          disabled={isLoggingIn}
          variant="outline"
          size="sm"
          className="rounded-full border-primary/40 text-primary hover:bg-primary/10"
          data-ocid="landing.login.button"
        >
          {isLoggingIn ? "Connecting..." : "Login"}
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Moon glow */}
          <div className="relative mb-8 flex justify-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.58 0.22 278 / 0.3) 0%, oklch(0.58 0.22 278 / 0.05) 70%)",
                boxShadow: "0 0 60px oklch(0.58 0.22 278 / 0.4)",
              }}
            >
              <Moon
                className="w-12 h-12"
                style={{ color: "oklch(0.85 0.16 278)" }}
              />
            </div>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Monitor your sleep.
            <br />
            <span className="gradient-text">Protect your health.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            SleepGuard uses AI to analyze your sleep patterns in real-time —
            detecting snoring, breathing irregularities, and movement to
            generate comprehensive risk assessments.
          </p>

          <Button
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="rounded-full px-10 font-semibold text-base shadow-glow"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.58 0.22 278), oklch(0.68 0.18 278))",
              color: "white",
            }}
            data-ocid="landing.get_started.primary_button"
          >
            {isLoggingIn ? "Connecting..." : "Get Started"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {features.map((feat) => (
            <div
              key={feat.title}
              className="sleep-card sleep-card-glow p-6 text-left rounded-2xl"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "oklch(0.58 0.22 278 / 0.15)" }}
              >
                <feat.icon
                  className="w-5 h-5"
                  style={{ color: "oklch(0.75 0.18 278)" }}
                />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">
                {feat.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Medical disclaimer */}
        <motion.div
          className="mt-12 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{
              background: "oklch(0.17 0.025 255 / 0.6)",
              border: "1px solid oklch(0.22 0.04 255)",
            }}
          >
            <AlertCircle
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "oklch(0.72 0.17 60)" }}
            />
            <p className="text-xs text-muted-foreground text-left">
              <strong className="text-foreground">Medical Disclaimer:</strong>{" "}
              This app is for informational purposes only and is not a medical
              device. Consult a healthcare professional for diagnosis or
              treatment of sleep disorders.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SleepGuard. Developed by Shageer.
        </p>
      </footer>
    </div>
  );
}
