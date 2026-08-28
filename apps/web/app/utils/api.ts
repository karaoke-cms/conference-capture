export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const config = useRuntimeConfig();
  const response = await fetch(`${config.public.apiBase}${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined;
    throw new Error(payload?.error?.message ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}
