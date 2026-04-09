import type { RiskAssessment, SensorData } from "../backend.d";

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function computeRiskScores(
  sensorReadings: SensorData[],
  sessionDurationMin: number,
  snoringEvents: number,
): RiskAssessment {
  if (sensorReadings.length === 0) {
    return { sleepApnea: 0, insomnia: 0, rbd: 0 };
  }

  const avgSpO2 = average(sensorReadings.map((r) => r.spo2));
  const avgHRV = average(sensorReadings.map((r) => r.hrv));
  const avgMovement = average(sensorReadings.map((r) => r.movement));
  const avgHR = average(sensorReadings.map((r) => r.hr));

  // Sleep Apnea
  const snoringScore = Math.min(snoringEvents * 8, 40);
  const spo2Score = Math.max(0, (95 - avgSpO2) * 6);
  const hrvScore = Math.max(0, (60 - avgHRV) * 0.5);
  const sleepApnea = Math.min(100, snoringScore + spo2Score + hrvScore);

  // Insomnia
  const durationScore = Math.max(0, (420 - sessionDurationMin) * 0.1);
  const movementScore = avgMovement * 5;
  const insomnia = Math.min(
    100,
    durationScore + movementScore + (100 - avgHRV) * 0.2,
  );

  // RBD
  const rbd = Math.min(100, avgMovement * 8 + Math.abs(avgHR - 65) * 0.5);

  return {
    sleepApnea: Math.round(sleepApnea),
    insomnia: Math.round(insomnia),
    rbd: Math.round(rbd),
  };
}

export function computeSleepScore(
  durationMin: number,
  risk: RiskAssessment,
  avgSpO2: number,
): number {
  const durationScore = Math.min(40, (durationMin / 480) * 40);
  const riskPenalty = ((risk.sleepApnea + risk.insomnia + risk.rbd) / 3) * 0.3;
  const spo2Bonus = Math.max(0, (avgSpO2 - 95) * 2);
  return Math.max(
    0,
    Math.min(100, Math.round(70 + durationScore - riskPenalty + spo2Bonus)),
  );
}

export function getRiskLevel(score: number): {
  label: string;
  color: string;
  dotColor: string;
} {
  if (score < 30)
    return { label: "Low Risk", color: "text-teal-400", dotColor: "#2DD4BF" };
  if (score < 60)
    return {
      label: "Medium Risk",
      color: "text-amber-500",
      dotColor: "#F59E0B",
    };
  return { label: "High Risk", color: "text-red-500", dotColor: "#EF4444" };
}

export function getSleepQualityLabel(score: number): string {
  if (score >= 85) return "Excellent Sleep";
  if (score >= 70) return "Good Sleep Quality";
  if (score >= 55) return "Fair Sleep";
  if (score >= 40) return "Poor Sleep";
  return "Very Poor Sleep";
}

export function generateSimulatedSensorData(_intervalSeconds = 30): SensorData {
  const now = BigInt(Date.now()) * BigInt(1_000_000); // nanoseconds
  const t = Date.now() / 1000;
  return {
    hr: Math.round(58 + 10 * Math.sin(t / 60) + (Math.random() - 0.5) * 6),
    hrv: Math.round(45 + 20 * Math.cos(t / 90) + (Math.random() - 0.5) * 10),
    spo2: Math.round(96 + 2 * Math.sin(t / 120) + (Math.random() - 0.5) * 1),
    movement: Math.max(
      0,
      Math.round(
        2 + 2 * Math.abs(Math.sin(t / 45)) + (Math.random() - 0.5) * 2,
      ),
    ),
    timestamp: now,
  };
}
