const api = process.env.API_BASE_URL ?? "http://localhost:8787";
const secret = process.env.CRON_SECRET ?? "change-me-too";
const response = await fetch(`${api}/api/scheduler/tick`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });
if (!response.ok) throw new Error(`Scheduler tick failed with ${response.status}`);
console.log(JSON.stringify(await response.json(), null, 2));
