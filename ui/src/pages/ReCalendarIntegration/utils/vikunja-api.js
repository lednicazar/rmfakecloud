import { decryptToken } from "./encrypt";

function getProxyUrl() {
  if (typeof window === "undefined") return "";
  return "http://" + window.location.hostname + ":8899";
}

async function vikunjaFetch(url, token, options = {}) {
  const targetUrl = url.replace(/\/$/, "") + (options.path || "");
  const proxyUrl = getProxyUrl();
  const useProxy = proxyUrl && window.location.protocol === "http:";

  if (useProxy) {
    const resp = await fetch(proxyUrl, {
      method: options.method || "GET",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
        "x-target-url": targetUrl,
      },
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error("HTTP " + resp.status + ": " + text);
    }
    return resp.json();
  }

  const resp = await fetch(targetUrl, {
    method: options.method || "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("HTTP " + resp.status + ": " + text);
  }
  return resp.json();
}

export async function testConnection(url, encryptedToken) {
  const token = await decryptToken(encryptedToken);
  if (!token || !url) throw new Error("URL and token are required");
  await vikunjaFetch(url, token, { path: "/api/v1/projects" });
  return { success: true };
}

export async function fetchProjects(url, encryptedToken) {
  const token = await decryptToken(encryptedToken);
  if (!token || !url) return [];
  return vikunjaFetch(url, token, { path: "/api/v1/projects" });
}

export async function fetchProjectTasks(url, encryptedToken, projectId, maxResults) {
  maxResults = maxResults || 10;
  const token = await decryptToken(encryptedToken);
  if (!token || !url || !projectId) return [];
  return vikunjaFetch(url, token, {
    path: "/api/v1/projects/" + projectId + "/tasks?limit=" + maxResults,
  });
}

export async function fetchAllTasks(url, encryptedToken, projectId) {
  const token = await decryptToken(encryptedToken);
  if (!token || !url || !projectId) return [];
  var allTasks = [];
  var page = 0;
  while (true) {
    var tasks = await vikunjaFetch(url, token, {
      path: "/api/v1/projects/" + projectId + "/tasks?page=" + page + "&limit=50",
    });
    if (!tasks.length) break;
    allTasks = allTasks.concat(tasks);
    if (tasks.length < 50) break;
    page++;
  }
  return allTasks;
}
