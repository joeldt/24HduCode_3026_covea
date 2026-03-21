import { BASE_URL, TOKEN } from "./config.js";

async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await res.json();
  }

  return await res.text();
}

function buildHeaders(extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    ...(TOKEN ? { "codinggame-id": TOKEN } : {}),
    ...extraHeaders
  };
}

export async function apiGet(path, extraHeaders = {}) {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: buildHeaders(extraHeaders)
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export async function apiPost(path, body = {}, extraHeaders = {}) {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "POST",
    headers: buildHeaders(extraHeaders),
    body: JSON.stringify(body)
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export async function apiPut(path, body = {}, extraHeaders = {}) {
  const url = `${BASE_URL}${path}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: buildHeaders(extraHeaders),
    body: JSON.stringify(body)
  });

  const data = await parseResponse(res);

  if (!res.ok) {
    throw new Error(`PUT ${path} failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}