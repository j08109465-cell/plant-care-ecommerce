export async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "The request could not be completed.");
  }

  return response.status === 204 ? null : response.json();
}

export const sendJson = (method, body) => ({
  method,
  body: JSON.stringify(body),
});
