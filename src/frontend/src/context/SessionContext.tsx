import type React from "react";
import {
  type ReactNode,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import type { SensorData } from "../backend.d";

interface ActiveSession {
  id: bigint | null;
  startTime: number;
  sensorReadings: SensorData[];
  snoringEvents: number;
  isRecording: boolean;
  micStream: MediaStream | null;
  audioChunks: Blob[];
  consentGiven: boolean;
}

interface SessionContextType {
  activeSession: ActiveSession | null;
  setActiveSession: React.Dispatch<React.SetStateAction<ActiveSession | null>>;
  sessionTimerRef: React.MutableRefObject<ReturnType<
    typeof setInterval
  > | null>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  return (
    <SessionContext.Provider
      value={{ activeSession, setActiveSession, sessionTimerRef }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
