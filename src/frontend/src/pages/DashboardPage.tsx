import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Clock,
  Mic,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SleepSession } from "../backend.d";
import { useSession } from "../context/SessionContext";
import { useMySessions, useUserProfile } from "../hooks/useQueries";
import { getRiskLevel, getSleepQualityLabel } from "../utils/mlUtils";

// ─── Sleep Score Ring ────────────────────────────────────────────────────────
function SleepScoreRing({ score }: { score: number }) {
  const radius = 80;
  const stroke = 12;
  const norm = radius - stroke / 2;
  const circumference = 2 * Math.PI * norm;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={180}
        height={180}
        className="-rotate-90"
        role="img"
        aria-label="Sleep score ring"
      >
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={90}
          cy={90}
          r={norm}
          fill="none"
          stroke="oklch(0.22 0.04 255)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={90}
          cy={90}
          r={norm}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-6xl font-bold text-foreground">
          {score}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: "oklch(0.75 0.14 185)" }}
        >
          {getSleepQualityLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ─── Risk Card ───────────────────────────────────────────────────────────────
function RiskCard({ title, score }: { title: string; score: number }) {
  const risk = getRiskLevel(score);
  return (
    <div className="sleep-card p-4 rounded-xl flex-1 min-w-0">
      <p className="text-xs text-muted-foreground mb-2">{title}</p>
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            background: risk.dotColor,
            boxShadow: `0 0 6px ${risk.dotColor}`,
          }}
        />
        <span className="font-bold text-lg text-foreground">{score}%</span>
      </div>
      <p className={`text-xs font-medium mt-1 ${risk.color}`}>{risk.label}</p>
    </div>
  );
}

// ─── Audio Analysis SVG ──────────────────────────────────────────────────────
function AudioAnalysisCard() {
  const bars = Array.from({ length: 60 }, (_, i) => {
    const h = 10 + Math.sin(i * 0.4) * 8 + Math.random() * 12;
    return h;
  });

  return (
    <div className="sleep-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mic className="w-4 h-4" style={{ color: "oklch(0.75 0.18 278)" }} />
          Audio Analysis
        </h3>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{
            background: "oklch(0.58 0.22 278 / 0.15)",
            color: "oklch(0.75 0.18 278)",
          }}
        >
          Last session
        </span>
      </div>
      <div className="flex items-center gap-0.5 h-16">
        {bars.map((h, barIdx) => {
          const barKey = `bar-${barIdx}-${Math.floor(h * 100)}`;
          return (
            <div
              key={barKey}
              className="flex-1 rounded-full"
              style={{
                height: `${Math.min(100, h)}%`,
                background:
                  barIdx > 40
                    ? "oklch(0.75 0.14 185 / 0.6)"
                    : "oklch(0.58 0.22 278 / 0.7)",
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2">
        {["11:00 PM", "1:00 AM", "3:00 AM", "5:00 AM", "7:00 AM"].map((t) => (
          <span key={t} className="text-xs text-muted-foreground">
            {t}
          </span>
        ))}
      </div>
      <div
        className="flex gap-4 mt-3 pt-3"
        style={{ borderTop: "1px solid oklch(0.18 0.03 255)" }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "oklch(0.58 0.22 278)" }}
          />
          <span className="text-xs text-muted-foreground">
            Snoring detected
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "oklch(0.75 0.14 185)" }}
          />
          <span className="text-xs text-muted-foreground">
            Normal breathing
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Trends Chart ────────────────────────────────────────────────────────────
function TrendsChart({ sessions }: { sessions: SleepSession[] }) {
  const [range, setRange] = useState<"7D" | "30D">("7D");

  const data = useMemo(() => {
    const days = range === "7D" ? 7 : 30;
    const now = Date.now();
    const result: {
      label: string;
      score: number | null;
      duration: number | null;
    }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now - i * 86400000);
      const label = day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const dayStart = new Date(day).setHours(0, 0, 0, 0);
      const dayEnd = dayStart + 86400000;
      const daySessions = sessions.filter((s) => {
        const ts = Number(s.startTimestamp) / 1_000_000;
        return ts >= dayStart && ts < dayEnd;
      });
      const score =
        daySessions.length > 0
          ? Math.round(
              daySessions.reduce((a, s) => a + s.sleepScore, 0) /
                daySessions.length,
            )
          : null;
      const duration =
        daySessions.length > 0
          ? Math.round(
              (daySessions.reduce((a, s) => a + s.durationMinutes, 0) / 60) *
                10,
            ) / 10
          : null;
      result.push({ label, score, duration });
    }
    return result;
  }, [sessions, range]);

  return (
    <div className="sleep-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp
            className="w-4 h-4"
            style={{ color: "oklch(0.75 0.14 185)" }}
          />
          Sleep Trends & Quality
        </h3>
        <div className="flex gap-1">
          {(["7D", "30D"] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs rounded-md transition-all ${
                range === r
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
              style={
                range === r
                  ? {
                      background: "oklch(0.58 0.22 278 / 0.2)",
                      color: "oklch(0.75 0.18 278)",
                    }
                  : {}
              }
              data-ocid={`trends.${r.toLowerCase()}.toggle`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.04 255)" />
          <XAxis
            dataKey="label"
            tick={{ fill: "oklch(0.65 0.04 245)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={range === "7D" ? 0 : 6}
          />
          <YAxis
            tick={{ fill: "oklch(0.65 0.04 245)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.13 0.03 255)",
              border: "1px solid oklch(0.22 0.04 255)",
              borderRadius: "8px",
              fontSize: 12,
            }}
            labelStyle={{ color: "oklch(0.95 0.015 240)" }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
            name="Sleep Score"
          />
          <Line
            type="monotone"
            dataKey="duration"
            stroke="#2DD4BF"
            strokeWidth={2}
            dot={false}
            name="Duration (hrs)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Active Session Mini ─────────────────────────────────────────────────────
function ActiveSessionMini() {
  const { activeSession } = useSession();
  if (!activeSession?.isRecording) return null;

  const elapsed = Math.floor((Date.now() - activeSession.startTime) / 1000);
  const h = Math.floor(elapsed / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((elapsed % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  const lastReading =
    activeSession.sensorReadings[activeSession.sensorReadings.length - 1];

  return (
    <section className="mt-10">
      <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 pulse-dot" />
        Current Active Session
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sleep-card p-5 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Mic
              className="w-4 h-4"
              style={{ color: "oklch(0.75 0.14 185)" }}
            />
            <span className="text-sm font-semibold text-foreground">
              Recording
            </span>
          </div>
          <div className="font-display text-3xl font-bold text-foreground">
            {h}:{m}:{s}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Microphone active
          </p>
        </div>
        <div className="sleep-card p-5 rounded-2xl">
          <p className="text-sm font-semibold text-foreground mb-3">
            Live Sensors
          </p>
          {lastReading ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Heart Rate",
                  value: `${lastReading.hr} bpm`,
                  color: "#EF4444",
                },
                {
                  label: "HRV",
                  value: `${lastReading.hrv} ms`,
                  color: "#8B5CF6",
                },
                {
                  label: "SpO₂",
                  value: `${lastReading.spo2}%`,
                  color: "#2DD4BF",
                },
                {
                  label: "Movement",
                  value: `${lastReading.movement}/10`,
                  color: "#F59E0B",
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="p-3 rounded-lg"
                  style={{ background: "oklch(0.17 0.025 255)" }}
                >
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p
                    className="font-bold text-sm mt-0.5"
                    style={{ color: m.color }}
                  >
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Awaiting sensor data...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const { data: sessions = [], isLoading: sessionsLoading } = useMySessions();

  const latestSession = useMemo(() => {
    if (sessions.length === 0) return null;
    return sessions.reduce((a, b) =>
      Number(a.startTimestamp) > Number(b.startTimestamp) ? a : b,
    );
  }, [sessions]);

  const score = latestSession?.sleepScore ?? 0;
  const risk = latestSession?.riskAssessment ?? {
    sleepApnea: 0,
    insomnia: 0,
    rbd: 0,
  };
  const lastDate = latestSession
    ? new Date(
        Number(latestSession.startTimestamp) / 1_000_000,
      ).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const userName = profile?.name ?? "User";
  const isLoading = profileLoading || sessionsLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
          Your Sleep Health Dashboard
        </h1>
        {isLoading ? (
          <Skeleton className="h-5 w-64" />
        ) : (
          <p className="text-muted-foreground">
            Hi, <span className="text-foreground font-medium">{userName}!</span>{" "}
            View your recent sleep data below.
          </p>
        )}
      </div>

      {/* No sessions banner */}
      {!isLoading && sessions.length === 0 && (
        <div
          className="mb-6 p-4 rounded-2xl flex items-center gap-4"
          style={{
            background: "oklch(0.17 0.025 255)",
            border: "1px solid oklch(0.22 0.04 255)",
          }}
          data-ocid="dashboard.empty_state"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "oklch(0.58 0.22 278 / 0.15)" }}
          >
            <Activity
              className="w-5 h-5"
              style={{ color: "oklch(0.75 0.18 278)" }}
            />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground">
              Start your first sleep monitoring session to see your data.
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-full"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.58 0.22 278), oklch(0.68 0.18 278))",
              color: "white",
            }}
            data-ocid="dashboard.start_session.primary_button"
            onClick={() => navigate({ to: "/session" as "/" })}
          >
            <PlayCircle className="w-4 h-4 mr-1.5" />
            Start Session
          </Button>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Sleep Score */}
        <div className="sleep-card sleep-card-glow p-6 rounded-2xl flex flex-col items-center">
          <h2 className="text-sm font-semibold text-foreground mb-5 self-start">
            Sleep Score
          </h2>
          {isLoading ? (
            <Skeleton
              className="w-44 h-44 rounded-full"
              data-ocid="dashboard.score.loading_state"
            />
          ) : (
            <SleepScoreRing score={score} />
          )}
          {lastDate && (
            <div className="mt-5 text-center">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-3.5 h-3.5" />
                <span>{lastDate}</span>
              </div>
              {latestSession && (
                <p className="text-xs text-muted-foreground mt-1">
                  Duration: {latestSession.durationMinutes} min
                </p>
              )}
            </div>
          )}
          {!isLoading && sessions.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">No data yet</p>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Risk cards */}
          <div>
            <div className="flex gap-3" data-ocid="dashboard.risk.panel">
              <RiskCard title="Sleep Apnea" score={risk.sleepApnea} />
              <RiskCard title="Insomnia" score={risk.insomnia} />
              <RiskCard title="RBD" score={risk.rbd} />
            </div>
            <div
              className="mt-3 p-3 rounded-xl flex items-start gap-2"
              style={{ background: "oklch(0.17 0.025 255)" }}
            >
              <AlertCircle
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: "oklch(0.72 0.17 60)" }}
              />
              <p className="text-xs" style={{ color: "oklch(0.55 0.04 245)" }}>
                <strong className="text-muted-foreground">
                  Medical Disclaimer:
                </strong>{" "}
                Risk assessments are for informational purposes only. Consult a
                healthcare professional for diagnosis.
              </p>
            </div>
          </div>

          {/* Audio Analysis */}
          <AudioAnalysisCard />
        </div>
      </div>

      {/* Trends chart */}
      <div className="mt-5">
        <TrendsChart sessions={sessions} />
      </div>

      {/* Active session */}
      <ActiveSessionMini />
    </motion.div>
  );
}
