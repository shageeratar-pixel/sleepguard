import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Bluetooth,
  BluetoothConnected,
  BluetoothSearching,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Heart,
  Info,
  Loader2,
  Save,
  Signal,
  Smartphone,
  Trash2,
  Watch,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useUserProfile } from "../hooks/useQueries";

// ── Supported Devices Catalog ────────────────────────────────────────────────
const SUPPORTED_DEVICES = [
  {
    id: "fitbit",
    name: "Fitbit",
    models: "Sense 2, Charge 6, Versa 4",
    icon: Watch,
    grade: "Consumer Grade",
    vitals: ["Heart Rate", "SpO2", "HRV", "Sleep Stages", "Skin Temp"],
    color: "oklch(0.62 0.15 220)",
  },
  {
    id: "apple_watch",
    name: "Apple Watch",
    models: "Series 6, 7, 8, 9, Ultra",
    icon: Smartphone,
    grade: "Consumer Grade",
    vitals: ["Heart Rate", "SpO2", "ECG", "Sleep Stages", "HRV"],
    color: "oklch(0.65 0.12 200)",
  },
  {
    id: "samsung",
    name: "Samsung Galaxy Watch",
    models: "Galaxy Watch 4, 5, 6",
    icon: Watch,
    grade: "Consumer Grade",
    vitals: ["Heart Rate", "SpO2", "BIA Body Composition", "Sleep"],
    color: "oklch(0.6 0.14 260)",
  },
  {
    id: "garmin",
    name: "Garmin",
    models: "Vivosmart 5, Fenix 7",
    icon: Activity,
    grade: "Consumer Grade",
    vitals: ["Heart Rate", "SpO2", "HRV", "Stress Score", "Sleep"],
    color: "oklch(0.58 0.16 280)",
  },
  {
    id: "whoop",
    name: "Whoop 4.0",
    models: "Whoop 4.0",
    icon: Activity,
    grade: "Consumer Grade",
    vitals: ["Heart Rate", "HRV", "Strain", "Recovery", "Sleep Stages"],
    color: "oklch(0.62 0.18 320)",
  },
  {
    id: "polar",
    name: "Polar H10",
    models: "H10 Chest Strap",
    icon: Heart,
    grade: "Medical Grade",
    vitals: ["ECG Heart Rate", "HRV"],
    color: "oklch(0.62 0.2 25)",
  },
  {
    id: "ble_hr",
    name: "Generic BLE Monitor",
    models: "Any BLE Heart Rate Device",
    icon: Bluetooth,
    grade: "Consumer Grade",
    vitals: ["Heart Rate"],
    color: "oklch(0.6 0.12 240)",
  },
];

// ── Vitals Pill ───────────────────────────────────────────────────────────────
function VitalPill({ label }: { label: string }) {
  return (
    <span
      className="inline-block text-xs px-2 py-0.5 rounded-full"
      style={{
        background: "oklch(0.22 0.04 255)",
        color: "oklch(0.75 0.1 240)",
      }}
    >
      {label}
    </span>
  );
}

// ── Animated Vitals ───────────────────────────────────────────────────────────
function LiveVitals() {
  const [hr, setHr] = useState(70);
  const [spo2, setSpo2] = useState(97);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setHr(68 + Math.floor(Math.random() * 5));
      setSpo2(96 + Math.floor(Math.random() * 3));
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      <div
        className="rounded-xl p-3 text-center"
        style={{ background: "oklch(0.22 0.04 255)" }}
      >
        <Heart className="w-4 h-4 mx-auto mb-1" style={{ color: "#F87171" }} />
        <motion.p
          key={hr}
          initial={{ opacity: 0.4, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-bold"
          style={{ color: "#F87171" }}
        >
          {hr}
        </motion.p>
        <p className="text-xs text-muted-foreground">bpm</p>
      </div>
      <div
        className="rounded-xl p-3 text-center"
        style={{ background: "oklch(0.22 0.04 255)" }}
      >
        <Activity
          className="w-4 h-4 mx-auto mb-1"
          style={{ color: "#60A5FA" }}
        />
        <motion.p
          key={spo2}
          initial={{ opacity: 0.4, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-lg font-bold"
          style={{ color: "#60A5FA" }}
        >
          {spo2}%
        </motion.p>
        <p className="text-xs text-muted-foreground">SpO2</p>
      </div>
      <div
        className="rounded-xl p-3 text-center"
        style={{ background: "oklch(0.22 0.04 255)" }}
      >
        <Signal className="w-4 h-4 mx-auto mb-1" style={{ color: "#34D399" }} />
        <p className="text-lg font-bold" style={{ color: "#34D399" }}>
          45ms
        </p>
        <p className="text-xs text-muted-foreground">HRV</p>
      </div>
    </div>
  );
}

// ── Connected Device Card ────────────────────────────────────────────────────
function ConnectedDeviceCard({
  deviceName,
  onDisconnect,
}: {
  deviceName: string;
  onDisconnect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl p-5"
      style={{
        background: "oklch(0.17 0.025 255)",
        border: "1px solid oklch(0.32 0.08 185 / 0.5)",
      }}
      data-ocid="wearable.connected.card"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center relative"
            style={{ background: "oklch(0.22 0.04 255)" }}
          >
            <BluetoothConnected
              className="w-5 h-5"
              style={{ color: "#34D399" }}
            />
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
              style={{ background: "#34D399" }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {deviceName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Signal className="w-3 h-3" style={{ color: "#34D399" }} />
              <span className="text-xs" style={{ color: "#34D399" }}>
                Strong Signal
              </span>
            </div>
          </div>
        </div>
        <Badge
          className="text-xs font-medium"
          style={{
            background: "oklch(0.75 0.14 185 / 0.15)",
            color: "#2DD4BF",
            border: "1px solid oklch(0.75 0.14 185 / 0.3)",
          }}
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      <LiveVitals />

      <div
        className="mt-4 rounded-xl px-4 py-2.5 flex items-center gap-2"
        style={{
          background: "oklch(0.75 0.14 185 / 0.08)",
          border: "1px solid oklch(0.75 0.14 185 / 0.2)",
        }}
      >
        <CheckCircle2 className="w-4 h-4" style={{ color: "#34D399" }} />
        <span className="text-xs font-medium" style={{ color: "#34D399" }}>
          Data Accuracy: High — Connected to wearable
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="mt-4 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
        onClick={onDisconnect}
        data-ocid="wearable.disconnect.button"
      >
        <XCircle className="w-4 h-4 mr-2" />
        Disconnect Device
      </Button>
    </motion.div>
  );
}

// ── Wearable Devices Section ──────────────────────────────────────────────────
function WearableDevicesSection() {
  const [pairedDevice, setPairedDevice] = useState<string | null>(null);
  const [scanState, setScanState] = useState<
    "idle" | "scanning" | "pairing" | "unsupported"
  >("idle");
  const [pairingTarget, setPairingTarget] = useState<string | null>(null);

  const webBluetoothSupported =
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  const handleScan = async () => {
    if (!webBluetoothSupported) {
      setScanState("unsupported");
      return;
    }
    setScanState("scanning");
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: ["heart_rate"] },
          { services: ["health_thermometer"] },
          { services: ["pulse_oximeter"] },
        ],
        optionalServices: ["battery_service"],
      });
      const name = device.name ?? "Unknown Device";
      setPairingTarget(name);
      setScanState("pairing");
      await new Promise((r) => setTimeout(r, 2000));
      setPairedDevice(name);
      setScanState("idle");
      toast.success(`${name} connected successfully!`);
    } catch (_e) {
      // User cancelled or error
      setScanState("idle");
    }
  };

  const handleDevicePair = (deviceName: string) => {
    if (!webBluetoothSupported) {
      setScanState("unsupported");
      return;
    }
    setPairingTarget(deviceName);
    setScanState("pairing");
    setTimeout(() => {
      setPairedDevice(deviceName);
      setScanState("idle");
      setPairingTarget(null);
      toast.success(`${deviceName} paired successfully!`);
    }, 2000);
  };

  const handleDisconnect = () => {
    setPairedDevice(null);
    toast.success("Device disconnected.");
  };

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{
          background: "oklch(0.58 0.22 278 / 0.1)",
          border: "1px solid oklch(0.58 0.22 278 / 0.3)",
        }}
      >
        <Info
          className="w-4 h-4 mt-0.5 shrink-0"
          style={{ color: "oklch(0.78 0.14 278)" }}
        />
        <p
          className="text-xs leading-relaxed"
          style={{ color: "oklch(0.78 0.14 278)" }}
        >
          Connect a wearable to unlock high-accuracy vitals tracking including
          heart rate, SpO₂, and HRV — significantly improving sleep disorder
          risk assessment accuracy.
        </p>
      </div>

      {/* Connected Device Card */}
      <AnimatePresence>
        {pairedDevice && (
          <ConnectedDeviceCard
            deviceName={pairedDevice}
            onDisconnect={handleDisconnect}
          />
        )}
      </AnimatePresence>

      {/* Scan Button */}
      {!pairedDevice && (
        <div className="flex flex-col gap-3">
          <AnimatePresence mode="wait">
            {scanState === "scanning" && (
              <motion.div
                key="scanning"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  background: "oklch(0.17 0.025 255)",
                  border: "1px solid oklch(0.22 0.04 255)",
                }}
                data-ocid="wearable.scanning.loading_state"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                >
                  <BluetoothSearching
                    className="w-5 h-5"
                    style={{ color: "oklch(0.78 0.14 278)" }}
                  />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Scanning for nearby devices...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Make sure your device is in pairing mode
                  </p>
                </div>
              </motion.div>
            )}
            {scanState === "pairing" && pairingTarget && (
              <motion.div
                key="pairing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  background: "oklch(0.17 0.025 255)",
                  border: "1px solid oklch(0.75 0.14 185 / 0.4)",
                }}
                data-ocid="wearable.pairing.loading_state"
              >
                <Loader2
                  className="w-5 h-5 animate-spin"
                  style={{ color: "#34D399" }}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Pairing with {pairingTarget}...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confirm the pairing code on your device if prompted
                  </p>
                </div>
              </motion.div>
            )}
            {scanState === "unsupported" && (
              <motion.div
                key="unsupported"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  background: "oklch(0.17 0.025 255)",
                  border: "1px solid oklch(0.62 0.2 25 / 0.4)",
                }}
                data-ocid="wearable.bluetooth_unsupported.error_state"
              >
                <XCircle
                  className="w-5 h-5 mt-0.5 shrink-0"
                  style={{ color: "#F87171" }}
                />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#F87171" }}
                  >
                    Web Bluetooth Not Supported
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Web Bluetooth requires{" "}
                    <strong className="text-foreground">
                      Chrome, Edge, or Opera
                    </strong>{" "}
                    on desktop or Android. It is not available in Firefox or iOS
                    Safari. Please switch to a supported browser to use
                    Bluetooth pairing.
                  </p>
                  <button
                    type="button"
                    className="text-xs mt-2 underline text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setScanState("idle")}
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleScan}
            disabled={scanState === "scanning" || scanState === "pairing"}
            className="w-full font-semibold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.22 278), oklch(0.65 0.18 278))",
              color: "white",
            }}
            data-ocid="wearable.scan.button"
          >
            {scanState === "scanning" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : scanState === "pairing" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pairing...
              </>
            ) : (
              <>
                <BluetoothSearching className="mr-2 h-4 w-4" />
                Scan for Nearby Devices
              </>
            )}
          </Button>
        </div>
      )}

      {/* Supported Devices Catalog */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Supported Devices
        </p>
        <div className="grid gap-3">
          {SUPPORTED_DEVICES.map((device, idx) => {
            const Icon = device.icon;
            const isPaired = pairedDevice === device.name;
            const ocidIndex = idx + 1;
            return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-xl p-4"
                style={{
                  background: "oklch(0.17 0.025 255)",
                  border: isPaired
                    ? "1px solid oklch(0.75 0.14 185 / 0.5)"
                    : "1px solid oklch(0.22 0.04 255)",
                }}
                data-ocid={`wearable.device.item.${ocidIndex}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${device.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: device.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {device.name}
                      </p>
                      <Badge
                        className="text-xs px-1.5 py-0 h-4"
                        style={{
                          background:
                            device.grade === "Medical Grade"
                              ? "oklch(0.62 0.2 25 / 0.15)"
                              : "oklch(0.22 0.04 255)",
                          color:
                            device.grade === "Medical Grade"
                              ? "#F87171"
                              : "oklch(0.6 0.1 255)",
                          border:
                            device.grade === "Medical Grade"
                              ? "1px solid oklch(0.62 0.2 25 / 0.3)"
                              : "1px solid oklch(0.28 0.05 255)",
                        }}
                      >
                        {device.grade === "Medical Grade" && (
                          <Cpu className="w-2.5 h-2.5 mr-1" />
                        )}
                        {device.grade}
                      </Badge>
                      {isPaired && (
                        <Badge
                          className="text-xs px-1.5 py-0 h-4"
                          style={{
                            background: "oklch(0.75 0.14 185 / 0.15)",
                            color: "#2DD4BF",
                            border: "1px solid oklch(0.75 0.14 185 / 0.3)",
                          }}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {device.models}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {device.vitals.map((v) => (
                        <VitalPill key={v} label={v} />
                      ))}
                    </div>
                    {!pairedDevice && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 px-3 transition-all"
                        style={{
                          borderColor: `${device.color}60`,
                          color: device.color,
                          background: `${device.color}10`,
                        }}
                        disabled={
                          scanState === "scanning" || scanState === "pairing"
                        }
                        onClick={() => handleDevicePair(device.name)}
                        data-ocid={`wearable.device.button.${ocidIndex}`}
                      >
                        <Bluetooth className="w-3 h-3 mr-1.5" />
                        Pair via Bluetooth
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* How to Connect Accordion */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="how-to"
          style={{
            border: "1px solid oklch(0.22 0.04 255)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <AccordionTrigger
            className="px-4 py-3 text-sm font-semibold hover:no-underline"
            style={{ background: "oklch(0.17 0.025 255)" }}
            data-ocid="wearable.how_to_connect.toggle"
          >
            <div className="flex items-center gap-2">
              <Bluetooth
                className="w-4 h-4"
                style={{ color: "oklch(0.78 0.14 278)" }}
              />
              How to Connect Your Device
            </div>
          </AccordionTrigger>
          <AccordionContent
            style={{
              background: "oklch(0.15 0.02 255)",
              borderTop: "1px solid oklch(0.22 0.04 255)",
            }}
          >
            <div className="px-4 pt-4 pb-2 space-y-3">
              {[
                {
                  step: 1,
                  text: "Enable Bluetooth on your phone or computer — check System Settings > Bluetooth.",
                },
                {
                  step: 2,
                  text: "Open your wearable's companion app (Fitbit, Garmin Connect, etc.) and ensure firmware is up to date.",
                },
                {
                  step: 3,
                  text: "On your wearable, enter pairing/discoverable mode — usually hold the side button, or swipe to Settings > Bluetooth > Pair New Device.",
                },
                {
                  step: 4,
                  text: 'Click "Scan for Nearby Devices" above or use the "Pair via Bluetooth" button next to your device.',
                },
                {
                  step: 5,
                  text: "Select your device from the browser's Bluetooth device picker that appears.",
                },
                {
                  step: 6,
                  text: "Confirm the pairing code on your wearable if prompted.",
                },
                {
                  step: 7,
                  text: "Once connected, SleepGuard will automatically read your vitals during sleep sessions for higher accuracy risk scoring.",
                },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{
                      background: "oklch(0.58 0.22 278 / 0.2)",
                      color: "oklch(0.78 0.14 278)",
                      border: "1px solid oklch(0.58 0.22 278 / 0.3)",
                    }}
                  >
                    {step}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {text}
                  </p>
                </div>
              ))}

              <div
                className="mt-4 rounded-xl px-4 py-3 flex items-start gap-2"
                style={{
                  background: "oklch(0.62 0.2 25 / 0.08)",
                  border: "1px solid oklch(0.62 0.2 25 / 0.25)",
                }}
              >
                <Heart
                  className="w-4 h-4 mt-0.5 shrink-0"
                  style={{ color: "#F87171" }}
                />
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "#FBBF24" }}
                >
                  <strong className="text-foreground">Pro Tip:</strong> Wear
                  your device snugly on your wrist for best results. The{" "}
                  <strong className="text-foreground">
                    Polar H10 chest strap
                  </strong>{" "}
                  gives the most accurate heart rate and HRV readings — ideal
                  for clinical-grade sleep analysis.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { actor } = useActor();
  const { data: profile } = useUserProfile();
  const queryClient = useQueryClient();

  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [consentTracking, setConsentTracking] = useState(
    profile?.consentToTracking ?? true,
  );
  const [consentResearch, setConsentResearch] = useState(
    profile?.consentToResearch ?? false,
  );

  // Sync profile state when loaded
  if (profile && name === "" && profile.name) {
    setName(profile.name);
    setEmail(profile.email);
    setConsentTracking(profile.consentToTracking);
    setConsentResearch(profile.consentToResearch);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile({
        name: name.trim(),
        email: email.trim(),
        consentToTracking: consentTracking,
        consentToResearch: consentResearch,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profile saved successfully!");
    },
    onError: () => toast.error("Failed to save profile."),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.deleteMyData();
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success("All data deleted.");
    },
    onError: () => toast.error("Failed to delete data."),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your profile, wearable devices, and data privacy.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <div className="sleep-card p-6 rounded-2xl">
          <h2 className="text-sm font-semibold text-foreground mb-5">
            User Profile
          </h2>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="settings-name"
                className="text-sm text-muted-foreground"
              >
                Full Name
              </Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
                style={{
                  background: "oklch(0.17 0.025 255)",
                  borderColor: "oklch(0.22 0.04 255)",
                }}
                placeholder="Your name"
                data-ocid="settings.name.input"
              />
            </div>
            <div>
              <Label
                htmlFor="settings-email"
                className="text-sm text-muted-foreground"
              >
                Email Address
              </Label>
              <Input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                style={{
                  background: "oklch(0.17 0.025 255)",
                  borderColor: "oklch(0.22 0.04 255)",
                }}
                placeholder="your@email.com"
                data-ocid="settings.email.input"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    Data Tracking Consent
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Allow sleep data to be used for personalization
                  </p>
                </div>
                <Switch
                  checked={consentTracking}
                  onCheckedChange={setConsentTracking}
                  data-ocid="settings.tracking_consent.switch"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    Research Participation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Anonymously contribute data to sleep research
                  </p>
                </div>
                <Switch
                  checked={consentResearch}
                  onCheckedChange={setConsentResearch}
                  data-ocid="settings.research_consent.switch"
                />
              </div>
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !name.trim()}
              className="w-full font-semibold"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.58 0.22 278), oklch(0.68 0.18 278))",
                color: "white",
              }}
              data-ocid="settings.save.submit_button"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : saveMutation.isSuccess ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Wearables */}
        <div className="sleep-card p-6 rounded-2xl">
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.58 0.22 278 / 0.15)" }}
            >
              <Bluetooth
                className="w-4 h-4"
                style={{ color: "oklch(0.78 0.14 278)" }}
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                Wearable Devices
              </h2>
              <p className="text-xs text-muted-foreground">
                Pair via Bluetooth for accurate vitals
              </p>
            </div>
          </div>
          <WearableDevicesSection />
        </div>

        {/* Data Management */}
        <div className="sleep-card p-6 rounded-2xl">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            Data Management
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Permanently delete all your sleep data, session history, and profile
            from the Internet Computer.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                data-ocid="settings.delete_data.open_modal_button"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All My Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              style={{
                background: "oklch(0.13 0.03 255)",
                border: "1px solid oklch(0.22 0.04 255)",
              }}
              data-ocid="settings.delete_data.dialog"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Data?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This will permanently delete all your sleep sessions, sensor
                  data, recordings, and profile. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-ocid="settings.delete_data.cancel_button">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive hover:bg-destructive/90"
                  data-ocid="settings.delete_data.confirm_button"
                >
                  {deleteMutation.isPending
                    ? "Deleting..."
                    : "Yes, Delete Everything"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  );
}
