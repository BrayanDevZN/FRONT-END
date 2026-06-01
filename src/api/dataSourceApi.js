const ACCOUNTS_URL = "https://web-production-81b91.up.railway.app";

async function parseResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      data?.error ||
      fallbackMessage;

    throw new Error(message);
  }

  return data;
}

export async function createDataSource({ token, name, file }) {
  const formData = new FormData();

  formData.append("token", token);
  formData.append("name", name);
  formData.append("file", file);

  const response = await fetch(`${ACCOUNTS_URL}/data-source/create`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response, "Erro ao criar fonte de dados.");
}

export async function getDataSources(token) {
  const response = await fetch(`${ACCOUNTS_URL}/data-sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  return parseResponse(response, "Erro ao buscar fontes de dados.");
}

export async function getDataSource(token, data_source_id) {
  const response = await fetch(`${ACCOUNTS_URL}/data-source`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
      data_source_id: Number(data_source_id),
    }),
  });

  return parseResponse(response, "Erro ao abrir fonte de dados.");
}

export async function getLinkedDashboards(
  token,
  data_source_id
) {
  const response = await fetch(
    `${ACCOUNTS_URL}/data-source/linked-dashboards`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        data_source_id: Number(data_source_id),
      }),
    }
  );

  return parseResponse(
    response,
    "Erro ao buscar dashboards vinculados."
  );
}

export async function updateDataSource({
  token,
  data_source_id,
  file,
  refreshDashboards = false,
}) {
  const formData = new FormData();

  formData.append("token", token);
  formData.append(
    "data_source_id",
    Number(data_source_id)
  );

  formData.append(
    "refresh_dashboards",
    refreshDashboards
  );

  formData.append("file", file);

  const response = await fetch(
    `${ACCOUNTS_URL}/data-source/update`,
    {
      method: "PATCH",
      body: formData,
    }
  );

  return parseResponse(
    response,
    "Erro ao atualizar fonte de dados."
  );
}

export async function renameDataSource({
  token,
  data_source_id,
  name,
}) {
  const response = await fetch(
    `${ACCOUNTS_URL}/data-source/rename`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        data_source_id: Number(data_source_id),
        name,
      }),
    }
  );

  return parseResponse(
    response,
    "Erro ao renomear fonte de dados."
  );
}

export async function deleteDataSource(
  token,
  data_source_id
) {
  const response = await fetch(
    `${ACCOUNTS_URL}/data-source`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        data_source_id: Number(data_source_id),
      }),
    }
  );

  return parseResponse(
    response,
    "Erro ao deletar fonte de dados."
  );
}