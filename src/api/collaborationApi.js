const ACCOUNTS_URL = "https://web-production-81b91.up.railway.app";

async function request(path, { method = "POST", body } = {}) {
  const response = await fetch(`${ACCOUNTS_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Erro ao processar colaboração.");
  }

  return data;
}

export function getCollaborationOverview(token) {
  return request("/collaborations", { body: { token } });
}

export function searchUsers(token, query) {
  return request("/users/search", { body: { token, query } });
}

export function getDashboardCollaborators(token, dashboard_id) {
  return request("/dashboard/collaborations", { body: { token, dashboard_id: Number(dashboard_id) } });
}

export function shareDashboard({ token, dashboard_id, username, permission }) {
  return request("/dashboard/collaboration/share", {
    body: { token, dashboard_id: Number(dashboard_id), username, permission },
  });
}

export function updateCollaboration({ token, collaboration_id, permission }) {
  return request("/dashboard/collaboration", {
    method: "PATCH",
    body: { token, collaboration_id: Number(collaboration_id), permission },
  });
}

export function deleteCollaboration(token, collaboration_id) {
  return request("/dashboard/collaboration", {
    method: "DELETE",
    body: { token, collaboration_id: Number(collaboration_id) },
  });
}
