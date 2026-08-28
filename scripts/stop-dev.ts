import { stopManagedProcesses } from "./dev-processes";

const stopped = await stopManagedProcesses();
console.log(stopped ? "Stopped all managed development services." : "No managed development services are running.");
