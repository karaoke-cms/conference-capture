# Development Process Manager Design

## Goal

Provide one attached development command that starts or restarts the API, worker, and web application, plus one command that stops all managed development services.

## Commands

- `bun run dev` stops any processes recorded by an earlier managed run, starts all three services, streams their output to the current terminal, and remains attached.
- Ctrl+C stops all three services before the command exits.
- `bun run stop` can be run from another terminal and stops all three services recorded by the active managed run.

## Architecture

A Bun script owns the service processes. Each service starts in its own process group so stopping the group also stops watch-mode descendants. The manager writes a small JSON state file under `.data` containing its own PID and the child process-group IDs. State is written atomically after startup and removed during shutdown.

The stop script reads the state file, sends a graceful termination signal to each recorded process group and the manager, tolerates processes that have already exited, and removes stale state. Starting a new manager invokes the same stop behavior before launching replacements.

Only processes explicitly recorded in the state file are targeted. Malformed state is treated as stale and removed rather than interpreted broadly.

## Failure handling

If a service cannot start, the manager stops the other services and exits non-zero. If one service exits unexpectedly, the manager reports the failure, stops the remaining services, and exits non-zero. Normal Ctrl+C or an explicit `bun run stop` produces a clean exit.

## Testing

Unit tests cover state parsing, stale/malformed state, process targeting, and cleanup using injected process-control functions. An integration-oriented test verifies that the package commands point to the manager and stop scripts. The complete existing test and type-check suites remain green.
