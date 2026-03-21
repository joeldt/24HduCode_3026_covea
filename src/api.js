import { BASE_URL, TOKEN } from "./config.js";

export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "codinggame-id": TOKEN
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export async function apiPost(path, body = {}, extraHeaders = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
      ...(TOKEN ? { "codinggame-id": TOKEN } : {})
    },
    body: JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}