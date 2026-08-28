import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseDevProcessState, stopManagedProcesses, writeDevProcessState } from "../scripts/dev-processes";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("development process state", () => {
  test("accepts only positive integer process identifiers", () => {
    expect(parseDevProcessState({ managerPid: 10, servicePids: [11, 12, 13] })).toEqual({
      managerPid: 10,
      servicePids: [11, 12, 13],
    });
    expect(parseDevProcessState({ managerPid: 0, servicePids: [11] })).toBeNull();
    expect(parseDevProcessState({ managerPid: 10, servicePids: [-1] })).toBeNull();
    expect(parseDevProcessState({ managerPid: 10, servicePids: "11" })).toBeNull();
  });

  test("writes state atomically as valid JSON", async () => {
    const directory = await temporaryDirectory();
    const stateFile = join(directory, "dev-processes.json");

    await writeDevProcessState(stateFile, { managerPid: 20, servicePids: [21, 22, 23] });

    expect(JSON.parse(await readFile(stateFile, "utf8"))).toEqual({ managerPid: 20, servicePids: [21, 22, 23] });
  });

  test("stops recorded process groups and manager, then removes state", async () => {
    const directory = await temporaryDirectory();
    const stateFile = join(directory, "dev-processes.json");
    await writeFile(stateFile, JSON.stringify({ managerPid: 30, servicePids: [31, 32] }));
    const signals: Array<[number, NodeJS.Signals]> = [];

    const stopped = await stopManagedProcesses({
      stateFile,
      signal: (pid, signal) => signals.push([pid, signal]),
    });

    expect(stopped).toBe(true);
    expect(signals).toEqual([[-31, "SIGTERM"], [-32, "SIGTERM"], [30, "SIGTERM"]]);
    expect(await Bun.file(stateFile).exists()).toBe(false);
  });

  test("removes malformed state without signalling any process", async () => {
    const directory = await temporaryDirectory();
    const stateFile = join(directory, "dev-processes.json");
    await writeFile(stateFile, JSON.stringify({ managerPid: 30, servicePids: [-1] }));
    const signals: number[] = [];

    const stopped = await stopManagedProcesses({ stateFile, signal: (pid) => signals.push(pid) });

    expect(stopped).toBe(false);
    expect(signals).toEqual([]);
    expect(await Bun.file(stateFile).exists()).toBe(false);
  });

  test("ignores missing processes and does not signal the excluded manager", async () => {
    const directory = await temporaryDirectory();
    const stateFile = join(directory, "dev-processes.json");
    await writeFile(stateFile, JSON.stringify({ managerPid: 40, servicePids: [41] }));

    await expect(stopManagedProcesses({
      stateFile,
      excludePid: 40,
      signal: () => { throw Object.assign(new Error("gone"), { code: "ESRCH" }); },
    })).resolves.toBe(true);
  });
});

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "conference-dev-processes-"));
  directories.push(directory);
  return directory;
}
