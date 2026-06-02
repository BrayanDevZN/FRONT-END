const AI_URL = "https://web-production-40ead.up.railway.app";
const ACCOUNTS_URL = "https://web-production-81b91.up.railway.app";

async function parseResponse(response, fallbackMessage) {
  const text = await response.text().catch(() => "");
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

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
    } else if (text) {
      message = text;
    }

    console.log("ERRO COMPLETO DA API:", {
      status: response.status,
      statusText: response.statusText,
      body: data || text,
    });

    throw new Error(message);
  }

  return data || {};
}

async function safeFetch(url, options, fallbackMessage) {
  try {
    console.log("CHAMANDO API:", url);

    const response = await fetch(url, options);

    return await parseResponse(response, fallbackMessage);
  } catch (error) {
    console.error("ERRO NO FETCH:", {
      url,
      error,
    });

    if (
      error?.message === "Failed to fetch" ||
      error instanceof TypeError
    ) {
      throw new Error(
        "Não foi possível conectar com a API. Verifique se a API está online, se a URL está correta e se o CORS está liberado."
      );
    }

    throw error;
  }
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

export async function generateDashboard({
  token,
  title,
  prompt,
  data_source_id,
}) {
  const formData = new FormData();

  formData.append("token", token);
  formData.append("title", title);
  formData.append("prompt", prompt || "");
  formData.append("data_source_id", String(data_source_id));

  const data = await safeFetch(
    `${AI_URL}/dashboard/analyze`,
    {
      method: "POST",
      body: formData,
    },
    "Erro ao gerar dashboard."
  );

  return normalizeChartsPayload(data);
}

export async function refreshDashboard({
  token,
  dashboard,
}) {
  if (!dashboard?.id) {
    throw new Error("Dashboard inválido.");
  }

  if (!dashboard?.data_source_id) {
    throw new Error("Este dashboard não está ligado a uma fonte de dados.");
  }

  const formData = new FormData();

  formData.append("token", token);
  formData.append("title", dashboard.title || "Dashboard");
  formData.append("prompt", dashboard.prompt || "");
  formData.append("data_source_id", String(dashboard.data_source_id));
  formData.append("dashboard_id", String(dashboard.id));

  const analyzedData = normalizeChartsPayload(
    await safeFetch(
      `${AI_URL}/dashboard/analyze`,
      {
        method: "POST",
        body: formData,
      },
      "Erro ao atualizar análise do dashboard."
    )
  );

  const savedData = await safeFetch(
    `${ACCOUNTS_URL}/dashboard/refresh/finish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        dashboard_id: Number(dashboard.id),
        ai_suggestion:
          analyzedData.ai_suggestion ||
          analyzedData.dashboard?.ai_suggestion ||
          analyzedData.answer ||
          "",
        charts:
          analyzedData.charts ||
          analyzedData.dashboard?.charts ||
          [],
      }),
    },
    "Erro ao salvar atualização do dashboard."
  );

  return normalizeChartsPayload(savedData);
}

export async function refreshDashboards({
  token,
  dashboards,
}) {
  const results = [];

  for (const dashboard of dashboards || []) {
    const result = await refreshDashboard({
      token,
      dashboard,
    });

    results.push(result);
  }

  return results;
}

export async function getDashboards(token) {
  return safeFetch(
    `${ACCOUNTS_URL}/dashboards`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    },
    "Erro ao buscar dashboards."
  );
}

export async function getDashboard(token, dashboard_id) {
  const data = await safeFetch(
    `${ACCOUNTS_URL}/dashboard`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        dashboard_id: Number(dashboard_id),
      }),
    },
    "Erro ao abrir dashboard."
  );

  return normalizeChartsPayload(data);
}

export async function deleteDashboard(token, dashboard_id) {
  return safeFetch(
    `${ACCOUNTS_URL}/dashboard`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        dashboard_id: Number(dashboard_id),
      }),
    },
    "Erro ao deletar dashboard."
  );
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
  pie_colors,
  show_legend,
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
    pie_colors: Array.isArray(pie_colors) ? pie_colors : [],
    show_legend: show_legend ?? true,
  };

  if (chart_id) {
    body.chart_id = Number(chart_id);
  }

  return safeFetch(
    `${ACCOUNTS_URL}/dashboard/chart/settings`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    "Erro ao salvar configurações do gráfico."
  );
}