import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type SleepRecordingId = string;
export type Time = bigint;
export interface SensorData {
    hr: number;
    movement: number;
    hrv: number;
    spo2: number;
    timestamp: bigint;
}
export interface RiskAssessment {
    rbd: number;
    insomnia: number;
    sleepApnea: number;
}
export type SleepSessionId = bigint;
export interface SleepSession {
    id: SleepSessionId;
    sleepScore: number;
    user: Principal;
    durationMinutes: number;
    notes: string;
    startTimestamp: Time;
    sensorReadings: Array<SensorData>;
    riskAssessment?: RiskAssessment;
}
export interface UserProfile {
    name: string;
    consentToResearch: boolean;
    email: string;
    consentToTracking: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addRiskAssessment(sessionId: SleepSessionId, assessment: RiskAssessment): Promise<void>;
    addSensorReading(sessionId: SleepSessionId, reading: SensorData): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMyData(): Promise<void>;
    finishSession(id: bigint, finalData: SleepSession): Promise<SleepSessionId>;
    getCallerSession(sessionId: SleepSessionId): Promise<SleepSession | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyRecordings(ids: Array<SleepRecordingId>): Promise<Array<ExternalBlob>>;
    getMySessions(): Promise<Array<SleepSession>>;
    getRecording(id: SleepRecordingId): Promise<ExternalBlob | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    startSession(session: SleepSession): Promise<SleepSessionId>;
    uploadRecording(id: SleepRecordingId, recording: ExternalBlob): Promise<void>;
}
