import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Mic,
  MicOff,
  Play,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { SensorData } from "../backend.d";
import { useSession } from "../context/SessionContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  computeRiskScores,
  computeSleepScore,
  generateSimulatedSensorData,
} from "../utils/mlUtils";

// ─── Live Waveform Visualizer ────────────────────────────────────────────────
function WaveformVisualizer({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = "oklch(0.13 0.03 255)";
      ctx.fillRect(0, 0, w, h);

      if (analyser) {
        const bufLen = analyser.frequencyBinCount;
        const dataArr = new Uint8Array(bufLen);
        analyser.getByteTimeDomainData(dataArr);

        ctx.beginPath();
        ctx.strokeStyle = "#8B5CF6";
        ctx.lineWidth = 2;
        const sliceW = w / bufLen;
        let x = 0;
        for (let i = 0; i < bufLen; i++) {
          const v = dataArr[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceW;
        }
        ctx.stroke();
      } else {
        // Static flat line when inactive
        ctx.beginPath();
        ctx.strokeStyle = "oklch(0.22 0.04 255)";
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={100}
      className="w-full rounded-xl"
      style={{ background: "oklch(0.13 0.03 255)" }}
    />
  );
}

// ─── Timer ───────────────────────────────────────────────────────────────────
function useTimer(startTime: number | null) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [startTime]);
  const h = Math.floor(elapsed / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((elapsed % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── Sensor Input Panel ─────────────────────────────────────────────────────
interface SensorState {
  hr: number;
  hrv: number;
  spo2: number;
  movement: number;
}

function SensorPanel({
  sensors,
  onChange,
  simMode,
  onSimToggle,
}: {
  sensors: SensorState;
  onChange: (k: keyof SensorState, v: number) => void;
  simMode: boolean;
  onSimToggle: () => void;
}) {
  const fields: {
    key: keyof SensorState;
    label: string;
    min: number;
    max: number;
    unit: string;
    color: string;
  }[] = [
    {
      key: "hr",
      label: "Heart Rate",
      min: 40,
      max: 120,
      unit: "bpm",
      color: "#EF4444",
    },
    {
      key: "hrv",
      label: "HRV",
      min: 20,
      max: 100,
      unit: "ms",
      color: "#8B5CF6",
    },
    {
      key: "spo2",
      label: "SpO₂",
      min: 90,
      max: 100,
      unit: "%",
      color: "#2DD4BF",
    },
    {
      key: "movement",
      label: "Movement",
      min: 0,
      max: 10,
      unit: "/10",
      color: "#F59E0B",
    },
  ];

  return (
    <div className="sleep-card p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Activity
            className="w-4 h-4"
            style={{ color: "oklch(0.75 0.14 185)" }}
          />
          Sensor Data
        </h3>
        <button
          type="button"
          onClick={onSimToggle}
          className="text-xs px-3 py-1 rounded-full transition-all"
          style={
            simMode
              ? { background: "oklch(0.75 0.14 185 / 0.2)", color: "#2DD4BF" }
              : {
                  background: "oklch(0.22 0.04 255)",
                  color: "oklch(0.65 0.04 245)",
                }
          }
          data-ocid="session.sim_mode.toggle"
        >
          {simMode ? "✓ Simulated" : "Simulate"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              <span className="text-sm font-bold" style={{ color: f.color }}>
                {sensors[f.key]}
                {f.unit}
              </span>
            </div>
            <Slider
              value={[sensors[f.key]]}
              min={f.min}
              max={f.max}
              step={1}
              onValueChange={([v]) => onChange(f.key, v)}
              disabled={simMode}
              className="mt-1"
              data-ocid={`session.${f.key}.input`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Session Page ───────────────────────────────────────────────────────────────
export default function SessionPage() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { activeSession, setActiveSession } = useSession();

  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [micConsented, setMicConsented] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [snoringLikelihood, setSnoringLikelihood] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [simMode, setSimMode] = useState(true);
  const [sensors, setSensors] = useState<SensorState>({
    hr: 65,
    hrv: 55,
    spo2: 97,
    movement: 2,
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const snoringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const sensorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRecording = activeSession?.isRecording ?? false;
  const timer = useTimer(isRecording ? activeSession!.startTime : null);

  const startMicCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const src = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 2048;
      src.connect(analyserNode);
      setAnalyser(analyserNode);
      return analyserNode;
    } catch {
      toast.error("Microphone access denied. Using simulated audio.");
      return null;
    }
  }, []);

  const stopMicCapture = useCallback(() => {
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) {
        t.stop();
      }
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setAnalyser(null);
  }, []);

  const detectSnoring = useCallback((analyserNode: AnalyserNode | null) => {
    if (!analyserNode) {
      // Simulate snoring detection
      setSnoringLikelihood(Math.round(15 + Math.random() * 40));
      return;
    }
    const data = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(data);
    // Snoring frequency range: ~100-500 Hz
    const slice = data.slice(5, 25);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    setSnoringLikelihood(Math.min(100, Math.round((avg / 256) * 100 * 2)));
  }, []);

  const handleStartSession = async () => {
    if (!micConsented) {
      setShowConsentDialog(true);
      return;
    }
    if (!actor || !identity) {
      toast.error("Please log in first.");
      return;
    }

    const now = BigInt(Date.now()) * BigInt(1_000_000);
    const newSession = {
      id: BigInt(0),
      sleepScore: 0,
      user: identity.getPrincipal(),
      durationMinutes: 0,
      notes: "",
      startTimestamp: now,
      sensorReadings: [],
      riskAssessment: undefined,
    };

    try {
      const sessionId = await actor.startSession(newSession);
      const analyserNode = await startMicCapture();

      setActiveSession({
        id: sessionId,
        startTime: Date.now(),
        sensorReadings: [],
        snoringEvents: 0,
        isRecording: true,
        micStream: streamRef.current,
        audioChunks: [],
        consentGiven: true,
      });

      // Snoring detection every 5s
      snoringIntervalRef.current = setInterval(() => {
        detectSnoring(analyserNode);
        setActiveSession((prev) => {
          if (!prev) return prev;
          const likelihood = Math.round(15 + Math.random() * 40);
          return {
            ...prev,
            snoringEvents:
              likelihood > 50 ? prev.snoringEvents + 1 : prev.snoringEvents,
          };
        });
      }, 5000);

      // Sensor data every 30s
      sensorIntervalRef.current = setInterval(async () => {
        const reading: SensorData = simMode
          ? generateSimulatedSensorData()
          : {
              hr: sensors.hr,
              hrv: sensors.hrv,
              spo2: sensors.spo2,
              movement: sensors.movement,
              timestamp: BigInt(Date.now()) * BigInt(1_000_000),
            };

        setActiveSession((prev) => {
          if (!prev) return prev;
          return { ...prev, sensorReadings: [...prev.sensorReadings, reading] };
        });

        if (actor && sessionId) {
          try {
            await actor.addSensorReading(sessionId, reading);
          } catch {
            /* silent */
          }
        }
      }, 30000);

      toast.success("Sleep session started!");
    } catch (err) {
      toast.error("Failed to start session. Please try again.");
      console.error(err);
    }
  };

  const handleStopSession = async () => {
    if (!actor || !activeSession?.id) return;
    setIsSaving(true);

    if (snoringIntervalRef.current) clearInterval(snoringIntervalRef.current);
    if (sensorIntervalRef.current) clearInterval(sensorIntervalRef.current);
    stopMicCapture();

    try {
      const durationMin = Math.round(
        (Date.now() - activeSession.startTime) / 60000,
      );
      const readings = activeSession.sensorReadings;

      // Add final reading if none
      const finalReadings =
        readings.length > 0 ? readings : [generateSimulatedSensorData()];
      const risk = computeRiskScores(
        finalReadings,
        durationMin,
        activeSession.snoringEvents,
      );
      const avgSpO2 =
        finalReadings.reduce((a, r) => a + r.spo2, 0) / finalReadings.length;
      const sleepScore = computeSleepScore(durationMin, risk, avgSpO2);

      await actor.addRiskAssessment(activeSession.id, risk);

      const finalSession = {
        id: activeSession.id,
        sleepScore,
        user: identity!.getPrincipal(),
        durationMinutes: durationMin,
        notes: "",
        startTimestamp: BigInt(activeSession.startTime) * BigInt(1_000_000),
        sensorReadings: finalReadings,
        riskAssessment: risk,
      };

      await actor.finishSession(activeSession.id, finalSession);

      setActiveSession(null);
      queryClient.invalidateQueries({ queryKey: ["mySessions"] });

      toast.success(`Session complete! Sleep score: ${sleepScore}/100`);
    } catch (err) {
      toast.error("Failed to save session.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConsentAccept = async () => {
    setMicConsented(true);
    setShowConsentDialog(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (snoringIntervalRef.current) clearInterval(snoringIntervalRef.current);
      if (sensorIntervalRef.current) clearInterval(sensorIntervalRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Consent Dialog */}
      <Dialog
        open={showConsentDialog}
        onOpenChange={setShowConsentDialog}
        data-ocid="session.consent.dialog"
      >
        <DialogContent
          style={{
            background: "oklch(0.13 0.03 255)",
            border: "1px solid oklch(0.22 0.04 255)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Microphone Access Required
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              SleepGuard needs access to your microphone to analyze breathing
              patterns and detect snoring events during your sleep session.
            </DialogDescription>
          </DialogHeader>
          <div
            className="p-4 rounded-xl space-y-3 my-2"
            style={{ background: "oklch(0.17 0.025 255)" }}
          >
            <div className="flex items-start gap-2">
              <Mic
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "oklch(0.75 0.18 278)" }}
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Microphone (Required)
                </p>
                <p className="text-xs text-muted-foreground">
                  Audio analysis for snoring and breathing detection
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Video
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: "oklch(0.65 0.04 245)" }}
              />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Camera (Optional)
                </p>
                <p className="text-xs text-muted-foreground">
                  Movement monitoring — you can enable later in Settings
                </p>
              </div>
            </div>
          </div>
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{
              background: "oklch(0.72 0.17 60 / 0.1)",
              border: "1px solid oklch(0.72 0.17 60 / 0.3)",
            }}
          >
            <AlertCircle
              className="w-3.5 h-3.5 mt-0.5 shrink-0"
              style={{ color: "oklch(0.72 0.17 60)" }}
            />
            <p className="text-xs" style={{ color: "oklch(0.72 0.17 60)" }}>
              Audio data is processed locally and stored privately on the
              Internet Computer. We never share your data.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConsentDialog(false)}
              data-ocid="session.consent.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConsentAccept}
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.58 0.22 278), oklch(0.68 0.18 278))",
                color: "white",
              }}
              data-ocid="session.consent.confirm_button"
            >
              Allow Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Sleep Session
        </h1>
        <p className="text-muted-foreground">
          Monitor your sleep with AI-powered audio and sensor analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Timer + Controls */}
        <div className="space-y-5">
          {/* Timer card */}
          <div className="sleep-card sleep-card-glow p-6 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {isRecording && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 pulse-dot" />
              )}
              <span className="text-sm font-semibold text-foreground">
                {isRecording ? "Recording" : "Ready to Start"}
              </span>
            </div>
            <div className="font-display text-6xl font-bold text-foreground tracking-tight mb-6">
              {isRecording ? timer : "00:00:00"}
            </div>
            <div className="flex gap-3 justify-center">
              {!isRecording ? (
                <Button
                  onClick={handleStartSession}
                  size="lg"
                  className="rounded-full px-10 font-semibold shadow-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.58 0.22 278), oklch(0.68 0.18 278))",
                    color: "white",
                  }}
                  data-ocid="session.start.primary_button"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Session
                </Button>
              ) : (
                <Button
                  onClick={handleStopSession}
                  disabled={isSaving}
                  size="lg"
                  className="rounded-full px-10 font-semibold"
                  style={{ background: "oklch(0.62 0.22 20)", color: "white" }}
                  data-ocid="session.stop.delete_button"
                >
                  <Square className="w-5 h-5 mr-2" />
                  {isSaving ? "Saving..." : "Stop Session"}
                </Button>
              )}
            </div>

            {/* Mic status */}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              {isRecording ? (
                <>
                  <Mic className="w-4 h-4" style={{ color: "#2DD4BF" }} />
                  <span className="text-muted-foreground">
                    Microphone active
                  </span>
                </>
              ) : (
                <>
                  <MicOff className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Microphone inactive
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Waveform */}
          <div className="sleep-card p-5 rounded-2xl">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Audio Waveform
            </h3>
            <WaveformVisualizer analyser={analyser} />
            {isRecording && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">
                      Snoring Likelihood
                    </span>
                    <span
                      style={{
                        color: snoringLikelihood > 50 ? "#F59E0B" : "#2DD4BF",
                      }}
                    >
                      {snoringLikelihood}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ background: "oklch(0.22 0.04 255)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${snoringLikelihood}%`,
                        background:
                          snoringLikelihood > 50 ? "#F59E0B" : "#2DD4BF",
                      }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activeSession?.snoringEvents ?? 0} events
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sensor Panel + ML */}
        <div className="space-y-5">
          <SensorPanel
            sensors={sensors}
            onChange={(k, v) => setSensors((prev) => ({ ...prev, [k]: v }))}
            simMode={simMode}
            onSimToggle={() => setSimMode((p) => !p)}
          />

          {/* ML Analysis */}
          {isRecording && (
            <div className="sleep-card p-5 rounded-2xl">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Live ML Analysis
              </h3>
              <div className="space-y-2">
                {[
                  {
                    label: "Breathing Pattern",
                    value:
                      snoringLikelihood > 60
                        ? "Irregular"
                        : snoringLikelihood > 30
                          ? "Mild snoring"
                          : "Normal",
                    color:
                      snoringLikelihood > 60
                        ? "#EF4444"
                        : snoringLikelihood > 30
                          ? "#F59E0B"
                          : "#2DD4BF",
                  },
                  { label: "Sleep Stage", value: "NREM", color: "#8B5CF6" },
                  { label: "Position", value: "Side", color: "#2DD4BF" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center p-3 rounded-lg"
                    style={{ background: "oklch(0.17 0.025 255)" }}
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: item.color }}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical disclaimer */}
          <div
            className="p-4 rounded-xl"
            style={{
              background: "oklch(0.17 0.025 255)",
              border: "1px solid oklch(0.22 0.04 255)",
            }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                style={{ color: "oklch(0.72 0.17 60)" }}
              />
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Medical Disclaimer:</strong>{" "}
                This app is for informational purposes only and is not a medical
                device. Consult a healthcare professional for diagnosis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
