const AI_URL = "https://web-production-40ead.up.railway.app";
const ACCOUNTS_URL = "https://web-production-81b91.up.railway.app";

async function parseResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = fallbackMessage;

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((err) => err.msg || JSON.stringify(err))
        .join(", ");
    } else if (data?.detail) {
      message = JSON.stringify(data.detail);
    } else if (data?.message) {
      message = data.message;
    } else if (data?.error) {
      message = data.error;
    }

    throw new Error(message);
  }

  return data;
}

function normalizeChartsPayload(data) {
  if (!data) return data;

  const charts =
    data.charts ||
    data.dashboard?.charts ||
    (data.chart ? [data.chart] : []);

  return {
    ...data,
    charts,
    dashboard: data.dashboard
      ? {
          ...data.dashboard,
          charts,
        }
      : data.dashboard,
  };
}

export async function generateDashboard({ token, title, prompt, file }) {
  const formData = new FormData();

  formData.append("token", token);
  formData.append("title", title);
  formData.append("prompt", prompt);
  formData.append("file", file);

  const response = await fetch(`${AI_URL}/dashboard/analyze`, {
    method: "POST",
    body: formData,
  });

  const data = await parseResponse(response, "Erro ao gerar dashboard.");

  return normalizeChartsPayload(data);
}

export async function getDashboards(token) {
  const response = await fetch(`${ACCOUNTS_URL}/dashboards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  return parseResponse(response, "Erro ao buscar dashboards.");
}

export async function getDashboard(token, dashboard_id) {
  const response = await fetch(`${ACCOUNTS_URL}/dashboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      dashboard_id: Number(dashboard_id),
    }),
  });

  const data = await parseResponse(response, "Erro ao abrir dashboard.");

  return normalizeChartsPayload(data);
}

export async function deleteDashboard(token, dashboard_id) {
  const response = await fetch(`${ACCOUNTS_URL}/dashboard`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      dashboard_id: Number(dashboard_id),
    }),
  });

  return parseResponse(response, "Erro ao deletar dashboard.");
}

export async function saveChartSettings({
  token,
  dashboard_id,
  chart_id,
  chart_color,
  chart_background,
  x_axis_text_color,
  y_axis_text_color,
  grid_color,
  grid_style,
  bar_style,
}) {
  const body = {
    token,
    dashboard_id: Number(dashboard_id),
    chart_color,
    chart_background,
    x_axis_text_color,
    y_axis_text_color,
    grid_color,
    grid_style,
    bar_style,
  };

  if (chart_id) {
    body.chart_id = Number(chart_id);
  }

  const response = await fetch(`${ACCOUNTS_URL}/dashboard/chart/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse(response, "Erro ao salvar configurações do gráfico.");
}