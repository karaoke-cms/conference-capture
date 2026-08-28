import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export interface DevProcessState {
  managerPid: number;
  servicePids: number[];
}

export const defaultDevStateFile = resolve(process.cwd(), ".data/dev-processes.json");

export function parseDevProcessState(value: unknown): DevProcessState | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<DevProcessState>;
  if (!isProcessId(candidate.managerPid) || !Array.isArray(candidate.servicePids)) return null;
  if (!candidate.servicePids.every(isProcessId)) return null;
  return { managerPid: candidate.managerPid, servicePids: candidate.servicePids };
}

export async function writeDevProcessState(stateFile: string, state: DevProcessState): Promise<void> {
  const parsed = parseDevProcessState(state);
  if (!parsed) throw new Error("Refusing to write invalid development process state");
  await mkdir(dirname(stateFile), { recursive: true });
  const temporaryFile = `${stateFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(parsed)}\n`, { mode: 0o600 });
  await rename(temporaryFile, stateFile);
}

export async function stopManagedProcesses(options: {
  stateFile?: string;
  excludePid?: number;
  signal?: (pid: number, signal: NodeJS.Signals) => void;
} = {}): Promise<boolean> {
  const stateFile = options.stateFile ?? defaultDevStateFile;
  const signal = options.signal ?? process.kill;
  const state = await readState(stateFile);
  await rm(stateFile, { force: true });
  if (!state) return false;

  for (const pid of state.servicePids) safelySignal(signal, -pid);
  if (state.managerPid !== options.excludePid) safelySignal(signal, state.managerPid);
  return true;
}

async function readState(stateFile: string): Promise<DevProcessState | null> {
  try {
    return parseDevProcessState(JSON.parse(await readFile(stateFile, "utf8")));
  } catch (error) {
    if (isMissingFile(error) || error instanceof SyntaxError) return null;
    throw error;
  }
}

function safelySignal(signal: (pid: number, signal: NodeJS.Signals) => void, pid: number): void {
  try {
    signal(pid, "SIGTERM");
  } catch (error) {
    if (!isMissingProcess(error)) throw error;
  }
}

function isProcessId(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isMissingProcess(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ESRCH";
}
