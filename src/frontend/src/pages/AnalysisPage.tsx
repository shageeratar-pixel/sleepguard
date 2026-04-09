import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SleepSession } from "../backend.d";
import { useMySessions } from "../hooks/useQueries";
import { getRiskLevel } from "../utils/mlUtils";

function SessionDetailPanel({
  session,
  onClose,
}: { session: SleepSession; onClose: () => void }) {
  const risk = session.riskAssessment ?? { sleepApnea: 0, insomnia: 0, rbd: 0 };

  const sensorChartData = session.sensorReadings.map((r, i) => ({
    t: i,
    hr: r.hr,
    spo2: r.spo2,
    hrv: r.hrv,
    movement: r.movement,
  }));

  return (
    <div className="sleep-card p-6 rounded-2xl">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-semibold text-foreground">
          Session Detail
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          data-ocid="analysis.detail.close_button"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          {
            label: "Sleep Score",
            value: session.sleepScore,
            suffix: "/100",
            color: "#8B5CF6",
          },
          {
            label: "Duration",
            value: session.durationMinutes,
            suffix: " min",
            color: "#2DD4BF",
          },
          {
            label: "Sleep Apnea",
            value: risk.sleepApnea,
            suffix: "%",
            color: getRiskLevel(risk.sleepApnea).dotColor,
          },
          {
            label: "Insomnia Risk",
            value: risk.insomnia,
            suffix: "%",
            color: getRiskLevel(risk.insomnia).dotColor,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="p-3 rounded-xl"
            style={{ background: "oklch(0.17 0.025 255)" }}
          >
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="font-bold text-lg mt-0.5" style={{ color: m.color }}>
              {m.value}
              {m.suffix}
            </p>
          </div>
        ))}
      </div>

      {sensorChartData.length > 0 && (
        <>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Sensor Readings
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={sensorChartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.22 0.04 255)"
              />
              <XAxis
                dataKey="t"
                tick={{ fill: "oklch(0.65 0.04 245)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.65 0.04 245)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.13 0.03 255)",
                  border: "1px solid oklch(0.22 0.04 255)",
                  borderRadius: "8px",
                  fontSize: 11,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "oklch(0.65 0.04 245)" }}
              />
              <Line
                type="monotone"
                dataKey="hr"
                stroke="#EF4444"
                strokeWidth={1.5}
                dot={false}
                name="HR"
              />
              <Line
                type="monotone"
                dataKey="spo2"
                stroke="#2DD4BF"
                strokeWidth={1.5}
                dot={false}
                name="SpO2"
              />
              <Line
                type="monotone"
                dataKey="hrv"
                stroke="#8B5CF6"
                strokeWidth={1.5}
                dot={false}
                name="HRV"
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  const { data: sessions = [], isLoading } = useMySessions();
  const [selectedSession, setSelectedSession] = useState<SleepSession | null>(
    null,
  );

  const sorted = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => Number(b.startTimestamp) - Number(a.startTimestamp),
      ),
    [sessions],
  );

  const scoreChartData = useMemo(
    () =>
      sorted
        .slice(0, 14)
        .reverse()
        .map((s, _i) => ({
          label: new Date(
            Number(s.startTimestamp) / 1_000_000,
          ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          score: s.sleepScore,
          duration: s.durationMinutes,
        })),
    [sorted],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Sleep Analysis
        </h1>
        <p className="text-muted-foreground">
          Review all past sleep sessions and health trends.
        </p>
      </div>

      {/* Score bar chart */}
      {sessions.length > 0 && (
        <div className="sleep-card p-5 rounded-2xl mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Sleep Scores Over Time
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={scoreChartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.22 0.04 255)"
              />
              <XAxis
                dataKey="label"
                tick={{ fill: "oklch(0.65 0.04 245)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "oklch(0.65 0.04 245)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.13 0.03 255)",
                  border: "1px solid oklch(0.22 0.04 255)",
                  borderRadius: "8px",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="score"
                fill="#8B5CF6"
                radius={[4, 4, 0, 0]}
                name="Sleep Score"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session selected detail */}
      {selectedSession && (
        <div className="mb-5">
          <SessionDetailPanel
            session={selectedSession}
            onClose={() => setSelectedSession(null)}
          />
        </div>
      )}

      {/* Sessions list */}
      <div className="sleep-card rounded-2xl overflow-hidden">
        <div
          className="p-5 border-b"
          style={{ borderColor: "oklch(0.18 0.03 255)" }}
        >
          <h2 className="text-sm font-semibold text-foreground">
            All Sessions
          </h2>
        </div>
        {isLoading && (
          <div
            className="p-5 space-y-3"
            data-ocid="analysis.sessions.loading_state"
          >
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        )}
        {!isLoading && sessions.length === 0 && (
          <div
            className="p-10 text-center"
            data-ocid="analysis.sessions.empty_state"
          >
            <p className="text-muted-foreground">
              No sleep sessions recorded yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a session to see your history here.
            </p>
          </div>
        )}
        {!isLoading &&
          sorted.map((session, idx) => {
            const risk = session.riskAssessment ?? {
              sleepApnea: 0,
              insomnia: 0,
              rbd: 0,
            };
            const date = new Date(Number(session.startTimestamp) / 1_000_000);
            const isSelected = selectedSession?.id === session.id;
            return (
              <button
                type="button"
                key={session.id.toString()}
                className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer transition-all hover:bg-white/5 text-left"
                style={
                  isSelected ? { background: "oklch(0.58 0.22 278 / 0.1)" } : {}
                }
                onClick={() => setSelectedSession(isSelected ? null : session)}
                data-ocid={`analysis.sessions.item.${idx + 1}`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.58 0.22 278 / 0.15)" }}
                >
                  <span
                    className="font-bold text-sm"
                    style={{ color: "oklch(0.75 0.18 278)" }}
                  >
                    {session.sleepScore}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.durationMinutes} min ·{" "}
                    {session.sensorReadings.length} readings
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  {[
                    { label: "Apnea", v: risk.sleepApnea },
                    { label: "Insomnia", v: risk.insomnia },
                    { label: "RBD", v: risk.rbd },
                  ].map((r) => (
                    <div key={r.label} className="text-right">
                      <p className="text-xs text-muted-foreground">{r.label}</p>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: getRiskLevel(r.v).dotColor }}
                      >
                        {r.v}%
                      </p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
      </div>
    </motion.div>
  );
}
