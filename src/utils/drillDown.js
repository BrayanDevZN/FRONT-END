const QUARTER_NAMES = {
  1: "1o trimestre",
  2: "2o trimestre",
  3: "3o trimestre",
  4: "4o trimestre",
};

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const HIERARCHY_TEMPLATES = [
  {
    id: "location",
    aliases: [
      ["regiao", "regiao_geografica", "region"],
      ["estado", "uf", "state"],
      ["cidade", "city", "municipio"],
    ],
  },
  {
    id: "product",
    aliases: [
      ["categoria", "category", "categoria_produto", "product_category"],
      ["produto", "product", "item", "sku"],
    ],
  },
];

const DRILLABLE_CHART_TYPES = new Set([
  "bar",
  "horizontal_bar",
  "line",
  "area",
  "pie",
  "donut",
]);

export function normalizeDrillKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findKeyByAliases(keys, aliases) {
  const normalizedAliases = aliases.map(normalizeDrillKey);

  return (
    keys.find((key) => normalizedAliases.includes(normalizeDrillKey(key))) ||
    keys.find((key) => normalizedAliases.some((alias) => normalizeDrillKey(key).includes(alias))) ||
    null
  );
}

function toNumber(value) {
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;

  const parsed = Number(
    String(value ?? "")
      .trim()
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function findDateKey(rows, preferredKey) {
  const keys = Object.keys(rows?.[0] || {});
  const preferred = findKeyByAliases(keys, [preferredKey]);

  if (preferred) return preferred;

  return (
    keys.find((key) => {
      const normalized = normalizeDrillKey(key);
      return ["data", "date", "dia", "created_at", "updated_at", "timestamp", "periodo"].some((alias) =>
        normalized.includes(alias)
      );
    }) || null
  );
}

function withTimeHierarchy(rows, dateKey) {
  if (!dateKey) return rows;

  return rows.map((row) => {
    const date = parseDate(row[dateKey]);

    if (!date) return row;

    const year = date.getFullYear();
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    const day = String(date.getDate()).padStart(2, "0");
    const monthNumber = String(month + 1).padStart(2, "0");

    return {
      ...row,
      Ano: String(year),
      Trimestre: QUARTER_NAMES[quarter],
      Mes: `${monthNumber} - ${MONTH_NAMES[month]}`,
      Dia: `${year}-${monthNumber}-${day}`,
    };
  });
}

function normalizeHierarchyEntry(entry, rows) {
  if (!entry) return null;

  const keys = Object.keys(rows?.[0] || {});
  const rawColumn = typeof entry === "string" ? entry : entry.column;
  const label = typeof entry === "string" ? entry : entry.label || entry.column;
  const column = keys.find((key) => normalizeDrillKey(key) === normalizeDrillKey(rawColumn));

  if (!column) return null;

  return {
    column,
    label: label || column,
  };
}

function normalizeProvidedHierarchy(hierarchy, rows) {
  if (!Array.isArray(hierarchy)) return [];

  return hierarchy
    .map((entry) => normalizeHierarchyEntry(entry, rows))
    .filter(Boolean);
}

function inferTemplateHierarchy(rows, preferredFirstColumn) {
  const keys = Object.keys(rows?.[0] || {});

  for (const template of HIERARCHY_TEMPLATES) {
    const hierarchy = template.aliases
      .map((aliases) => findKeyByAliases(keys, aliases))
      .filter(Boolean)
      .map((column) => ({ column, label: column }));

    if (hierarchy.length >= 2) {
      const preferredIndex = hierarchy.findIndex(
        (entry) => normalizeDrillKey(entry.column) === normalizeDrillKey(preferredFirstColumn)
      );

      if (preferredIndex > 0) {
        return hierarchy.slice(preferredIndex);
      }

      return hierarchy;
    }
  }

  return [];
}

function inferTimeHierarchy(rows, preferredDateKey) {
  const dateKey = findDateKey(rows, preferredDateKey);

  if (!dateKey) {
    return { rows, hierarchy: [] };
  }

  const nextRows = withTimeHierarchy(rows, dateKey);

  return {
    rows: nextRows,
    hierarchy: [
      { column: "Ano", label: "Ano" },
      { column: "Trimestre", label: "Trimestre" },
      { column: "Mes", label: "Mes" },
      { column: "Dia", label: "Dia" },
    ],
  };
}

export function getDrillConfig(currentChart, rawData, xKey) {
  const chartType = currentChart?.chart_type || currentChart?.type || "bar";

  if (!DRILLABLE_CHART_TYPES.has(chartType)) {
    return { enabled: false, rows: [], hierarchy: [] };
  }

  const config = currentChart?.chart_config || currentChart?.config || {};
  const drillDown = config.drill_down || currentChart?.drill_down || {};
  const rows = Array.isArray(drillDown.rows) ? drillDown.rows : rawData;
  const providedHierarchy = drillDown.hierarchy || config.drill_down_hierarchy || currentChart?.drill_down_hierarchy;
  const normalizedProvided = normalizeProvidedHierarchy(providedHierarchy, rows);

  if (normalizedProvided.length >= 2) {
    return {
      enabled: true,
      rows,
      hierarchy: normalizedProvided,
    };
  }

  const time = inferTimeHierarchy(rows, drillDown.time_column || config.time_column || xKey);

  if (
    time.hierarchy.length >= 2 &&
    time.rows.some((row) => row.Ano && row.Trimestre)
  ) {
    return {
      enabled: true,
      rows: time.rows,
      hierarchy: time.hierarchy,
    };
  }

  const hierarchy = inferTemplateHierarchy(rows, xKey);

  return {
    enabled: hierarchy.length >= 2,
    rows,
    hierarchy,
  };
}

export function aggregateDrillRows({
  rows,
  hierarchy,
  path,
  yKey,
  sourceYKey,
  aggregation,
  operation,
  limit = 20,
  sort = "desc",
}) {
  if (!Array.isArray(rows) || !Array.isArray(hierarchy) || !hierarchy.length) {
    return [];
  }

  const currentLevel = Math.min(path.length, hierarchy.length - 1);
  const currentColumn = hierarchy[currentLevel]?.column;

  if (!currentColumn) return [];

  const filteredRows = rows.filter((row) =>
    path.every((entry) => String(row?.[entry.column] ?? "") === String(entry.value ?? ""))
  );

  const groups = new Map();

  filteredRows.forEach((row) => {
    const rawLabel = row?.[currentColumn];
    const label = rawLabel === null || rawLabel === undefined || rawLabel === "" ? "Sem valor" : String(rawLabel);
    const current = groups.get(label) || { total: 0, count: 0, values: [] };

    current.count += 1;

    if (operation === "count" || aggregation === "count" || !sourceYKey) {
      current.total += 1;
    } else {
      const value = toNumber(row?.[sourceYKey]);
      current.total += value;
      current.values.push(value);
    }

    groups.set(label, current);
  });

  const finalAggregation = Array.isArray(aggregation) ? aggregation[0] : aggregation;

  let data = Array.from(groups.entries()).map(([label, group]) => {
    let value = group.total;

    if (finalAggregation === "mean" && group.values.length) {
      value = group.total / group.values.length;
    } else if (finalAggregation === "max" && group.values.length) {
      value = Math.max(...group.values);
    } else if (finalAggregation === "min" && group.values.length) {
      value = Math.min(...group.values);
    } else if (finalAggregation === "median" && group.values.length) {
      const sorted = [...group.values].sort((a, b) => a - b);
      value = sorted[Math.floor(sorted.length / 2)];
    }

    return {
      [currentColumn]: label,
      [yKey || "Quantidade"]: value,
    };
  });

  if (sort === "asc" || sort === "desc") {
    data = data.sort((a, b) => {
      const left = toNumber(a[yKey || "Quantidade"]);
      const right = toNumber(b[yKey || "Quantidade"]);
      return sort === "asc" ? left - right : right - left;
    });
  }

  return data.slice(0, Math.max(1, Math.min(Number(limit) || 20, 100)));
}

export function canDrillDeeper(hierarchy, path) {
  return Array.isArray(hierarchy) && path.length < hierarchy.length - 1;
}
