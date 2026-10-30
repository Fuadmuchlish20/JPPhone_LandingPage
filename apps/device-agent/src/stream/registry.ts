/** One active stream session per device. Opening a new one replaces the old. */
export interface ActiveSession {
  deviceId: string;
  userId: string;
  startedAt: number;
  close(code: number, reason: string): void;
}

const sessions = new Map<string, ActiveSession>();

export function getSession(deviceId: string): ActiveSession | undefined {
  return sessions.get(deviceId);
}

export function setSession(s: ActiveSession): void {
  sessions.set(s.deviceId, s);
}

export function clearSession(deviceId: string, s: ActiveSession): void {
  if (sessions.get(deviceId) === s) sessions.delete(deviceId);
}

export function closeSession(deviceId: string, code: number, reason: string): void {
  sessions.get(deviceId)?.close(code, reason);
  sessions.delete(deviceId);
}

export function activeSessionCount(): number {
  return sessions.size;
}

export function activeDeviceIds(): string[] {
  return [...sessions.keys()];
}
