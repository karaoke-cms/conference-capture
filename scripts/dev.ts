import { defaultDevStateFile, stopManagedProcesses, writeDevProcessState } from "./dev-processes";

const services = [
  { name: "api", command: ["bun", "--watch", "apps/api/src/index.ts"] },
  { name: "worker", command: ["bun", "--watch", "apps/worker/src/index.ts"] },
  { name: "web", command: ["bun", "run", "--filter", "@conference/web", "dev"] },
] as const;

await stopManagedProcesses();

const children: Bun.Subprocess[] = [];
let shuttingDown = false;
let finish: ((exitCode: number) => void) | undefined;
const completed = new Promise<number>((resolve) => { finish = resolve; });

async function shutdown(exitCode: number): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  await stopManagedProcesses({ excludePid: process.pid });
  finish?.(exitCode);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => { void shutdown(0); });
}

try {
  for (const service of services) {
    const child = Bun.spawn([...service.command], {
      cwd: process.cwd(),
      detached: true,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
      onExit(_process, exitCode, signalCode) {
        if (shuttingDown) return;
        console.error(`[dev] ${service.name} exited (${signalCode ?? exitCode ?? "unknown"}); stopping all services.`);
        void shutdown(exitCode || 1);
      },
    });
    children.push(child);
    console.log(`[dev] started ${service.name} (pid ${child.pid})`);
  }

  await writeDevProcessState(defaultDevStateFile, {
    managerPid: process.pid,
    servicePids: children.map((child) => child.pid),
  });
} catch (error) {
  for (const child of children) {
    try { process.kill(-child.pid, "SIGTERM"); } catch { /* Process already exited. */ }
  }
  throw error;
}

console.log("[dev] API, worker, and web are running. Press Ctrl+C to stop all services.");
process.exitCode = await completed;
