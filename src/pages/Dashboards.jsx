import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { Save, FileDown, RefreshCcw } from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppLayout from "../components/AppLayout";
import Button from "../components/Button";

import {
  generateDashboard,
  getDashboard,
  getDashboards,
  deleteDashboard,
  saveChartSettings,
  refreshDashboard,
} from "../api/dashboardApi";

import { getToken } from "../utils/storage";

const DEFAULT_PIE_COLORS = [
  "#4f46e5",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#64748b",
  "#0ea5e9",
];

const DEFAULT_CHART_SETTINGS = {
  chartColor: "#4f46e5",
  chartBackground: "#f8fafc",
  xAxisTextColor: "#0f172a",
  yAxisTextColor: "#0f172a",
  gridColor: "#cbd5e1",
  gridStyle: "3 3",
  barStyle: "rounded",
  pieColors: DEFAULT_PIE_COLORS,
  showLegend: true,
};

export default function Dashboards() {
  const [searchParams] = useSearchParams();

  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);

  const [chartSettings, setChartSettings] = useState({});

  const [showDeleteDashboardModal, setShowDeleteDashboardModal] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [refreshingDashboard, setRefreshingDashboard] = useState(false);
  const [error, setError] = useState("");

  const charts = selectedDashboard?.charts || [];

  async function loadDashboards() {
    setLoadingList(true);
    setError("");

    try {
      const token = getToken();
      const response = await getDashboards(token);
      const dashboardList = response?.dashboards || [];

      setDashboards(dashboardList);

      const dashboardIdFromUrl = searchParams.get("dashboard_id");

      if (dashboardIdFromUrl) {
        await openDashboard(dashboardIdFromUrl);
        return;
      }

      if (!selectedDashboard && dashboardList.length > 0) {
        await openDashboard(dashboardList[0].id);
      }
    } catch (err) {
      setError(err.message || "Erro ao buscar dashboards.");
    } finally {
      setLoadingList(false);
    }
  }

  async function openDashboard(dashboardId) {
    setError("");

    try {
      const token = getToken();
      const response = await getDashboard(token, dashboardId);
      setSelectedDashboard(response?.dashboard || null);
    } catch (err) {
      setError(err.message || "Erro ao abrir dashboard.");
    }
  }

  async function refreshDashboardList() {
    const token = getToken();
    const response = await getDashboards(token);
    const dashboardList = response?.dashboards || [];

    setDashboards(dashboardList);

    return dashboardList;
  }

  function findDashboardByTitle(dashboardList, wantedTitle) {
    const normalizedWantedTitle = String(wantedTitle || "")
      .trim()
      .toLowerCase();

    return dashboardList.find(
      (dashboard) =>
        dashboard.title?.trim().toLowerCase() === normalizedWantedTitle
    );
  }

  async function verifyDashboardCreatedByTitle(wantedTitle) {
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const dashboardList = await refreshDashboardList();
    const createdDashboard = findDashboardByTitle(dashboardList, wantedTitle);

    if (createdDashboard?.id) {
      await openDashboard(createdDashboard.id);
      return createdDashboard;
    }

    return null;
  }

  async function verifyDashboardRefreshed(dashboardId) {
    await new Promise((resolve) => setTimeout(resolve, 4000));

    await refreshDashboardList();
    await openDashboard(dashboardId);
  }

  function getChartId(chart, index) {
    return String(chart?.id || chart?.chart_id || `chart_${index}`);
  }

  function normalizePieColors(value) {
    if (Array.isArray(value)) {
      return value.length ? value : DEFAULT_PIE_COLORS;
    }

    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed) && parsed.length) {
          return parsed;
        }
      } catch {
        const colors = value
          .split(",")
          .map((color) => color.trim())
          .filter(Boolean);

        if (colors.length) {
          return colors;
        }
      }
    }

    return DEFAULT_PIE_COLORS;
  }

  function normalizeSettings(settings = {}) {
    return {
      chartColor: settings.chart_color || settings.chartColor || DEFAULT_CHART_SETTINGS.chartColor,
      chartBackground: settings.chart_background || settings.chartBackground || DEFAULT_CHART_SETTINGS.chartBackground,
      xAxisTextColor: settings.x_axis_text_color || settings.xAxisTextColor || DEFAULT_CHART_SETTINGS.xAxisTextColor,
      yAxisTextColor: settings.y_axis_text_color || settings.yAxisTextColor || DEFAULT_CHART_SETTINGS.yAxisTextColor,
      gridColor: settings.grid_color || settings.gridColor || DEFAULT_CHART_SETTINGS.gridColor,
      gridStyle: settings.grid_style || settings.gridStyle || DEFAULT_CHART_SETTINGS.gridStyle,
      barStyle: settings.bar_style || settings.barStyle || DEFAULT_CHART_SETTINGS.barStyle,
      pieColors: normalizePieColors(settings.pie_colors || settings.pieColors),
      showLegend: settings.show_legend ?? settings.showLegend ?? DEFAULT_CHART_SETTINGS.showLegend,
    };
  }

  function getPieColor(settings, index) {
    const colors = normalizePieColors(settings.pieColors);
    return colors[index % colors.length] || DEFAULT_PIE_COLORS[index % DEFAULT_PIE_COLORS.length];
  }

  function updatePieSliceColor(chartId, index, value) {
    setChartSettings((prev) => {
      const currentSettings = {
        ...DEFAULT_CHART_SETTINGS,
        ...(prev[chartId] || {}),
      };

      const nextColors = [...normalizePieColors(currentSettings.pieColors)];
      nextColors[index] = value;

      return {
        ...prev,
        [chartId]: {
          ...currentSettings,
          pieColors: nextColors,
        },
      };
    });
  }

  function updateChartSetting(chartId, key, value) {
    setChartSettings((prev) => ({
      ...prev,
      [chartId]: {
        ...DEFAULT_CHART_SETTINGS,
        ...(prev[chartId] || {}),
        [key]: value,
      },
    }));
  }

  async function handleSaveChartSettings() {
    if (!selectedDashboard?.id) {
      setError("Nenhum dashboard selecionado.");
      toast.error("Nenhum dashboard selecionado.");
      return;
    }

    if (!charts.length) {
      setError("Nenhum gráfico encontrado.");
      toast.error("Nenhum gráfico encontrado.");
      return;
    }

    try {
      setSavingSettings(true);
      setError("");

      const token = getToken();

      await Promise.all(
        charts.map((chart, index) => {
          const chartId = getChartId(chart, index);
          const settings = chartSettings[chartId] || DEFAULT_CHART_SETTINGS;
          const realChartId = chart?.id || chart?.chart_id;

          return saveChartSettings({
            token,
            dashboard_id: selectedDashboard.id,
            chart_id: realChartId,
            chart_color: settings.chartColor,
            chart_background: settings.chartBackground,
            x_axis_text_color: settings.xAxisTextColor,
            y_axis_text_color: settings.yAxisTextColor,
            grid_color: settings.gridColor,
            grid_style: settings.gridStyle,
            bar_style: settings.barStyle,
            pie_colors: normalizePieColors(settings.pieColors),
            show_legend: settings.showLegend,
          });
        })
      );

      toast.success("Configurações de todos os gráficos salvas.");
    } catch (err) {
      const message = err.message || "Erro ao salvar configurações.";
      setError(message);
      toast.error(message);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleExportPdf() {
    try {
      setExportingPdf(true);
      setError("");

      const element = document.getElementById("dashboard-export-area");

      if (!element) {
        setError("Área de exportação não encontrada.");
        toast.error("Área de exportação não encontrada.");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${selectedDashboard?.title || "dashboard"}.pdf`);

      toast.success("PDF exportado com sucesso.");
    } catch (err) {
      setError("Erro ao exportar PDF.");
      toast.error("Erro ao exportar PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  async function handleRefreshDashboard() {
    if (!selectedDashboard?.id) {
      setError("Nenhum dashboard selecionado.");
      toast.error("Nenhum dashboard selecionado.");
      return;
    }

    if (!selectedDashboard?.data_source_id) {
      setError("Este dashboard não está ligado a uma fonte de dados.");
      toast.error("Este dashboard não está ligado a uma fonte de dados.");
      return;
    }

    try {
      setRefreshingDashboard(true);
      setError("");

      const token = getToken();

      const response = await refreshDashboard({
        token,
        dashboard: selectedDashboard,
      });

      const refreshedDashboard =
        response?.dashboard ||
        response;

      if (refreshedDashboard?.id) {
        await openDashboard(refreshedDashboard.id);
      } else {
        await openDashboard(selectedDashboard.id);
      }

      await loadDashboards();

      toast.success("Dashboard atualizado com sucesso.");
    } catch (err) {
      console.error("Erro ao atualizar dashboard:", err);

      const dashboardId = selectedDashboard.id;

      setError("A atualização está demorando. Verificando se o dashboard foi atualizado...");
      toast.loading("Verificando atualização do dashboard...", {
        id: "refresh-dashboard-check",
      });

      try {
        await verifyDashboardRefreshed(dashboardId);

        setError("");
        toast.success("Dashboard atualizado com sucesso.", {
          id: "refresh-dashboard-check",
        });

        return;
      } catch (refreshError) {
        console.error("Erro ao verificar atualização do dashboard:", refreshError);
      }

      toast.error(
        "A atualização pode ter sido concluída. Atualize a página ou abra o dashboard novamente.",
        { id: "refresh-dashboard-check" }
      );

      setError(
        "A atualização pode ter sido concluída. Atualize a página ou abra o dashboard novamente."
      );
    } finally {
      setRefreshingDashboard(false);
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();

    if (!title.trim()) return setError("Digite o nome do dashboard.");
    if (!prompt.trim()) return setError("Digite o prompt da análise.");
    if (!file) return setError("Anexe um arquivo CSV, XLSX ou JSON.");

    setLoading(true);
    setError("");

    try {
      const token = getToken();

      const response = await generateDashboard({
        token,
        title: title.trim(),
        prompt: prompt.trim(),
        file,
      });

      const dashboard = {
        ...response.dashboard,
        title: title.trim(),
        charts: response.charts || response.dashboard?.charts || [],
        ai_suggestion: response.ai_suggestion || response.dashboard?.ai_suggestion || "",
      };

      setSelectedDashboard(dashboard);
      setShowCreate(false);
      setTitle("");
      setPrompt("");
      setFile(null);

      await loadDashboards();
    } catch (err) {
      console.error("Erro ao gerar dashboard:", err);

      setError("A análise está demorando. Verificando se o dashboard foi criado...");

      try {
        const createdDashboard = await verifyDashboardCreatedByTitle(title.trim());

        if (createdDashboard?.id) {
          setShowCreate(false);
          setTitle("");
          setPrompt("");
          setFile(null);
          setError("");

          toast.success("Dashboard criado com sucesso.");
          return;
        }
      } catch (refreshError) {
        console.error("Erro ao verificar dashboard criado:", refreshError);
      }

      setError(
        "A análise pode ter sido concluída. Atualize a página ou confira a lista de dashboards."
      );
    } finally {
      setLoading(false);
    }
  }

  function cancelDeleteDashboard() {
    if (loadingDelete) return;

    setDashboardToDelete(null);
    setShowDeleteDashboardModal(false);
  }

  async function confirmDeleteDashboard() {
    setLoadingDelete(true);
    setError("");

    try {
      const token = getToken();

      await deleteDashboard(token, dashboardToDelete);

      setDashboards((prev) =>
        prev.filter((dashboard) => Number(dashboard.id) !== Number(dashboardToDelete))
      );

      if (Number(selectedDashboard?.id) === Number(dashboardToDelete)) {
        setSelectedDashboard(null);
      }

      setDashboardToDelete(null);
      setShowDeleteDashboardModal(false);

      toast.success("Dashboard excluído com sucesso.");
    } catch (err) {
      const message = err.message || "Erro ao deletar dashboard.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingDelete(false);
    }
  }

  function getRawChartData(currentChart) {
    if (!currentChart) return [];
    if (Array.isArray(currentChart.chart_data?.data)) return currentChart.chart_data.data;
    if (Array.isArray(currentChart.chart_data)) return currentChart.chart_data;
    if (Array.isArray(currentChart.data)) return currentChart.data;
    return [];
  }

  function normalizeKey(key) {
    if (!key) return "";

    return String(key)
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");
  }

  function findRealKey(data, wantedKey) {
    const firstItem = data?.[0] || {};
    const keys = Object.keys(firstItem);

    if (!wantedKey || keys.length === 0) return null;

    const exactKey = keys.find((key) => key === wantedKey);
    if (exactKey) return exactKey;

    const normalizedWanted = normalizeKey(wantedKey);

    return (
      keys.find((key) => normalizeKey(key) === normalizedWanted) ||
      keys.find((key) => normalizeKey(key).includes(normalizedWanted)) ||
      null
    );
  }

  function isNumericLike(value) {
    if (value === null || value === undefined || value === "") return false;
    if (typeof value === "number") return !Number.isNaN(value);

    const normalized = String(value)
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");

    return normalized !== "" && !Number.isNaN(Number(normalized));
  }

  function isMostlyNumeric(data, key) {
    if (!key) return false;

    const sample = data
      .slice(0, 12)
      .map((item) => item?.[key])
      .filter((value) => value !== null && value !== undefined && value !== "");

    if (sample.length === 0) return false;

    const numericCount = sample.filter(isNumericLike).length;

    return numericCount / sample.length >= 0.7;
  }

  function findCategoryKey(data, preferredKey, numericKey = null) {
    const firstItem = data?.[0] || {};
    const keys = Object.keys(firstItem);

    const realPreferredKey = findRealKey(data, preferredKey);

    if (realPreferredKey && realPreferredKey !== numericKey) {
      return realPreferredKey;
    }

    return (
      keys.find((key) => key !== numericKey && !isMostlyNumeric(data, key)) ||
      keys.find((key) => key !== numericKey) ||
      realPreferredKey ||
      keys[0] ||
      null
    );
  }

  function findNumericKey(data, preferredKey, categoryKey = null, allowFallback = true) {
    const firstItem = data?.[0] || {};
    const keys = Object.keys(firstItem);

    const realPreferredKey = findRealKey(data, preferredKey);

    if (
      realPreferredKey &&
      realPreferredKey !== categoryKey &&
      isMostlyNumeric(data, realPreferredKey)
    ) {
      return realPreferredKey;
    }

    if (!allowFallback) {
      return null;
    }

    return (
      keys.find((key) => key !== categoryKey && isMostlyNumeric(data, key)) ||
      keys.find((key) => key !== categoryKey) ||
      realPreferredKey ||
      null
    );
  }

  function getMetricConfig(currentChart) {
    const metric = currentChart?.metric;
    const firstMetric = Array.isArray(metric) ? metric[0] : metric;

    return (
      currentChart?.chart_config?.y ||
      currentChart?.config?.y ||
      currentChart?.y ||
      currentChart?.yKey ||
      firstMetric
    );
  }

  function getXAxisConfig(currentChart) {
    return (
      currentChart?.chart_config?.x ||
      currentChart?.config?.x ||
      currentChart?.x ||
      currentChart?.xKey ||
      currentChart?.time_column ||
      currentChart?.group_by?.[0]
    );
  }

  function looksLikeDateKey(key) {
    const normalized = normalizeKey(key);

    return (
      normalized.includes("data") ||
      normalized.includes("date") ||
      normalized.includes("dia") ||
      normalized.includes("mes") ||
      normalized.includes("ano") ||
      normalized.includes("periodo")
    );
  }

  function titleMentionsMetric(title, metricKey) {
    if (!title || !metricKey) return false;

    const normalizedTitle = normalizeKey(title);
    const normalizedMetric = normalizeKey(metricKey);

    if (normalizedTitle.includes(normalizedMetric)) return true;

    const aliases = {
      cliques: ["clique", "cliques", "click", "clicks"],
      impressoes: ["impressao", "impressoes", "impression", "impressions"],
      conversoes: ["conversao", "conversoes", "conversion", "conversions"],
      receita: ["receita", "faturamento", "revenue"],
      investimento: ["investimento", "gasto", "custo", "spend", "cost"],
      vendas: ["venda", "vendas", "sales"],
      quantidade: ["quantidade", "qtd", "volume"],
    };

    return Object.values(aliases).some((group) => {
      const metricMatchesGroup = group.some((alias) => normalizedMetric.includes(alias));
      const titleMatchesGroup = group.some((alias) => normalizedTitle.includes(alias));
      return metricMatchesGroup && titleMatchesGroup;
    });
  }

  function getChartKeys(data, currentChart) {
    const firstItem = data?.[0] || {};
    const keys = Object.keys(firstItem);

    if (keys.length === 0) {
      return { xKey: null, yKey: null };
    }

    const chartType = currentChart?.chart_type || currentChart?.type || "bar";
    const operation = currentChart?.operation;

    const configX = getXAxisConfig(currentChart);
    const configY = getMetricConfig(currentChart);

    if (chartType === "table" || operation === "table") {
      return {
        xKey: keys[0] || null,
        yKey: keys[1] || keys[0] || null,
      };
    }

    if (chartType === "scatter" || operation === "scatter") {
      const numericKeys = keys.filter((key) => isMostlyNumeric(data, key));

      let xKey = findRealKey(data, configX);
      let yKey = findRealKey(data, configY);

      if (!xKey || !isMostlyNumeric(data, xKey)) {
        xKey = numericKeys[0] || null;
      }

      if (!yKey || yKey === xKey || !isMostlyNumeric(data, yKey)) {
        yKey = numericKeys.find((key) => key !== xKey) || null;
      }

      return { xKey, yKey };
    }

    if (operation === "count" || configY === "count") {
      const yKey =
        findRealKey(data, "count") ||
        findRealKey(data, "quantidade") ||
        findRealKey(data, "total") ||
        findRealKey(data, "qtd") ||
        keys.find((key) => normalizeKey(key) === "count") ||
        keys.find((key) => normalizeKey(key) === "quantidade") ||
        keys.find((key) => normalizeKey(key) === "total") ||
        keys.find((key) => normalizeKey(key) === "qtd") ||
        keys.find((key) => normalizeKey(key).includes("quantidade")) ||
        keys.find((key) => normalizeKey(key).includes("total")) ||
        keys.find((key) => isMostlyNumeric(data, key)) ||
        null;

      const xKey = findCategoryKey(data, configX, yKey);

      return { xKey, yKey };
    }

    let yKey = findNumericKey(data, configY, null, true);
    let xKey = findCategoryKey(data, configX, yKey);

    if (chartType === "horizontal_bar") {
      const explicitY = findNumericKey(data, configY, null, false);

      if (explicitY) {
        yKey = explicitY;
      }

      xKey = findCategoryKey(data, configX, yKey);
    }

    const title = currentChart?.title || "";

    if (
      yKey &&
      title &&
      !titleMentionsMetric(title, yKey) &&
      keys.some((key) => isMostlyNumeric(data, key) && titleMentionsMetric(title, key))
    ) {
      const titleMetricKey = keys.find(
        (key) => isMostlyNumeric(data, key) && titleMentionsMetric(title, key)
      );

      if (titleMetricKey) {
        yKey = titleMetricKey;
      }
    }

    if (xKey && yKey && xKey === yKey) {
      xKey =
        keys.find((key) => key !== yKey && !isMostlyNumeric(data, key)) ||
        keys.find((key) => key !== yKey) ||
        null;
    }

    if (!xKey && operation === "time_groupby") {
      xKey = keys.find(looksLikeDateKey) || findCategoryKey(data, configX, yKey);
    }

    return { xKey, yKey };
  }

  function parseNumericValue(value) {
    if (typeof value === "number") return value;

    const normalized = String(value ?? "")
      .trim()
      .replace(/\./g, "")
      .replace(",", ".");

    const parsed = Number(normalized);

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function formatChartData(data, yKey) {
    if (!yKey) return data;

    return data.map((item) => ({
      ...item,
      [yKey]: parseNumericValue(item[yKey]),
    }));
  }

  function formatTooltipValue(value) {
    if (typeof value === "number") {
      return value.toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      });
    }

    return String(value ?? "");
  }

  function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="custom-chart-tooltip">
        <strong>{label}</strong>

        {payload.map((item, index) => (
          <p key={`${item.name}-${index}`}>
            {item.name}: {formatTooltipValue(item.value)}
          </p>
        ))}
      </div>
    );
  }

  useEffect(() => {
    loadDashboards();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedDashboard) {
      setChartSettings({});
      return;
    }

    const dashboardDefaults = normalizeSettings(selectedDashboard.chart_settings || {});
    const nextSettings = {};

    (selectedDashboard.charts || []).forEach((currentChart, index) => {
      const chartId = getChartId(currentChart, index);

      nextSettings[chartId] = normalizeSettings({
        ...dashboardDefaults,
        ...(currentChart.chart_settings || {}),
      });
    });

    setChartSettings(nextSettings);
  }, [selectedDashboard]);

  function getBarRadius(barStyle) {
    if (barStyle === "square") return [0, 0, 0, 0];
    if (barStyle === "soft") return [4, 4, 0, 0];
    return [10, 10, 0, 0];
  }

  function getBarSize(barStyle) {
    if (barStyle === "thin") return 42;
    if (barStyle === "thick") return 100;
    return 76;
  }

  function renderCustomXAxisTick(props, settings) {
    const { x, y, payload } = props;

    return (
      <text
        x={x}
        y={y + 12}
        fill={settings.xAxisTextColor}
        fontSize={12}
        fontWeight={700}
        textAnchor="end"
        transform={`rotate(-30, ${x}, ${y})`}
      >
        {payload.value}
      </text>
    );
  }

  function renderCustomYAxisTick(props, settings) {
    const { x, y, payload } = props;

    return (
      <text
        x={x - 8}
        y={y + 4}
        fill={settings.yAxisTextColor}
        fontSize={12}
        fontWeight={700}
        textAnchor="end"
      >
        {payload.value}
      </text>
    );
  }

  function renderXAxis(xKey, settings) {
    return (
      <XAxis
        dataKey={xKey}
        interval={0}
        height={115}
        tick={(props) => renderCustomXAxisTick(props, settings)}
        axisLine={{ stroke: "#94a3b8" }}
        tickLine={{ stroke: "#94a3b8" }}
      />
    );
  }

  function renderYAxis(yKey, settings, withDataKey = false) {
    return (
      <YAxis
        dataKey={withDataKey ? yKey : undefined}
        tick={(props) => renderCustomYAxisTick(props, settings)}
        axisLine={{ stroke: "#94a3b8" }}
        tickLine={{ stroke: "#94a3b8" }}
      />
    );
  }

  function renderGrid(settings) {
    return <CartesianGrid strokeDasharray={settings.gridStyle} stroke={settings.gridColor} />;
  }

  function renderChart(currentChart, settings) {
    const rawChartData = getRawChartData(currentChart);
    const chartType = currentChart?.chart_type || currentChart?.type || "bar";
    const operation = currentChart?.operation;

    const { xKey, yKey } = getChartKeys(rawChartData, currentChart);
    const chartData = formatChartData(rawChartData, yKey);

    if (!currentChart || chartData.length === 0) {
      return <p>Sem dados para exibir.</p>;
    }

    if (chartType !== "table" && (!xKey || !yKey)) {
      console.log("Gráfico com configuração incompleta:", {
        currentChart,
        rawChartData,
        xKey,
        yKey,
      });

      return <p>Configuração do gráfico incompleta.</p>;
    }

    const chartWidth =
      chartType === "pie" || chartType === "donut"
        ? 1100
        : chartType === "horizontal_bar"
          ? 1200
          : Math.max(chartData.length * 140, 1200);

    const chartHeight =
      chartType === "horizontal_bar"
        ? Math.max(chartData.length * 58, 560)
        : 620;

    const chartWrapperStyle = {
      width: chartWidth,
      height: chartHeight,
      backgroundColor: settings.chartBackground,
      borderRadius: 20,
      padding: 24,
    };

    if (chartType === "kpi" || operation === "kpi") {
      const value = chartData?.[0]?.[yKey];

      return (
        <div className="chart-scroll">
          <div style={chartWrapperStyle} className="dashboard-kpi-card">
            <span>{currentChart.title || yKey}</span>
            <strong>{formatTooltipValue(value)}</strong>
          </div>
        </div>
      );
    }

    if (chartType === "line") {
      return (
        <div className="chart-scroll">
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 24, right: 55, left: 34, bottom: 96 }}>
                {renderGrid(settings)}
                {renderXAxis(xKey, settings)}
                {renderYAxis(yKey, settings)}
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey={yKey}
                  name={yKey}
                  stroke={settings.chartColor}
                  strokeWidth={4}
                  dot={{ r: 5, fill: settings.chartColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (chartType === "area") {
      return (
        <div className="chart-scroll">
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 24, right: 55, left: 34, bottom: 96 }}>
                {renderGrid(settings)}
                {renderXAxis(xKey, settings)}
                {renderYAxis(yKey, settings)}
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={yKey}
                  name={yKey}
                  stroke={settings.chartColor}
                  fill={settings.chartColor}
                  fillOpacity={0.24}
                  strokeWidth={4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (chartType === "pie" || chartType === "donut") {
      return (
        <div className="chart-scroll">
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />

                {settings.showLegend && (
                  <Legend
                    verticalAlign="bottom"
                    height={70}
                    wrapperStyle={{
                      color: settings.xAxisTextColor,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  />
                )}

                <Pie
                  data={chartData}
                  dataKey={yKey}
                  nameKey={xKey}
                  innerRadius={chartType === "donut" ? 100 : 0}
                  outerRadius={220}
                  label
                >
                  {chartData.map((_, index) => (
                    <Cell key={`slice-${index}`} fill={getPieColor(settings, index)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (chartType === "scatter") {
      return (
        <div className="chart-scroll">
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 24, right: 55, left: 34, bottom: 96 }}>
                {renderGrid(settings)}
                {renderXAxis(xKey, settings)}
                {renderYAxis(yKey, settings, true)}
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={chartData} fill={settings.chartColor} name={yKey} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (chartType === "horizontal_bar") {
      return (
        <div className="chart-scroll">
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 24, right: 55, left: 160, bottom: 40 }}
              >
                {renderGrid(settings)}

                <XAxis
                  type="number"
                  tick={{
                    fill: settings.xAxisTextColor,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: "#94a3b8" }}
                  tickLine={{ stroke: "#94a3b8" }}
                />

                <YAxis
                  dataKey={xKey}
                  type="category"
                  width={165}
                  tick={{
                    fill: settings.yAxisTextColor,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  axisLine={{ stroke: "#94a3b8" }}
                  tickLine={{ stroke: "#94a3b8" }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Bar
                  dataKey={yKey}
                  name={yKey}
                  fill={settings.chartColor}
                  radius={[0, 10, 10, 0]}
                  barSize={Math.min(getBarSize(settings.barStyle), 46)}
                  minPointSize={4}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (chartType === "table") {
      return (
        <div className="chart-scroll">
          <div className="dashboard-table-chart">
            <table>
              <thead>
                <tr>
                  {Object.keys(chartData[0] || {}).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, index) => (
                  <tr key={index}>
                    {Object.keys(chartData[0] || {}).map((key) => (
                      <td key={key}>{String(row[key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="chart-scroll">
        <div style={chartWrapperStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 24, right: 55, left: 34, bottom: 96 }} barCategoryGap="20%">
              {renderGrid(settings)}
              {renderXAxis(xKey, settings)}
              {renderYAxis(yKey, settings)}
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey={yKey}
                name={yKey}
                fill={settings.chartColor}
                radius={getBarRadius(settings.barStyle)}
                barSize={getBarSize(settings.barStyle)}
                minPointSize={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  function renderChartControls(currentChart, index) {
    const chartId = getChartId(currentChart, index);
    const settings = chartSettings[chartId] || DEFAULT_CHART_SETTINGS;
    const chartType = currentChart?.chart_type || currentChart?.type || "bar";
    const rawChartData = getRawChartData(currentChart);
    const { xKey } = getChartKeys(rawChartData, currentChart);
    const chartData = rawChartData || [];
    const isPieLike = chartType === "pie" || chartType === "donut";
    const isBarLike = chartType === "bar" || chartType === "horizontal_bar";
    const isCartesian = ["bar", "horizontal_bar", "line", "area", "scatter"].includes(chartType);

    return (
      <>
        <div className="dashboard-chart-top">
          <h3>{currentChart.title || `Gráfico ${index + 1}`}</h3>

          <div className="chart-custom-actions">
            {!isPieLike && (
              <label className="chart-color-button">
                <span>Gráfico</span>
                <span className="chart-color-preview" style={{ backgroundColor: settings.chartColor }} />
                <input type="color" defaultValue={settings.chartColor} onBlur={(event) => updateChartSetting(chartId, "chartColor", event.target.value)} />
              </label>
            )}

            <label className="chart-color-button">
              <span>Fundo</span>
              <span className="chart-color-preview" style={{ backgroundColor: settings.chartBackground }} />
              <input type="color" defaultValue={settings.chartBackground} onBlur={(event) => updateChartSetting(chartId, "chartBackground", event.target.value)} />
            </label>

            {isCartesian && (
              <>
                <label className="chart-color-button">
                  <span>Texto X</span>
                  <span className="chart-color-preview" style={{ backgroundColor: settings.xAxisTextColor }} />
                  <input type="color" defaultValue={settings.xAxisTextColor} onBlur={(event) => updateChartSetting(chartId, "xAxisTextColor", event.target.value)} />
                </label>

                <label className="chart-color-button">
                  <span>Texto Y</span>
                  <span className="chart-color-preview" style={{ backgroundColor: settings.yAxisTextColor }} />
                  <input type="color" defaultValue={settings.yAxisTextColor} onBlur={(event) => updateChartSetting(chartId, "yAxisTextColor", event.target.value)} />
                </label>

                <label className="chart-color-button">
                  <span>Traços</span>
                  <span className="chart-color-preview" style={{ backgroundColor: settings.gridColor }} />
                  <input type="color" defaultValue={settings.gridColor} onBlur={(event) => updateChartSetting(chartId, "gridColor", event.target.value)} />
                </label>
              </>
            )}
          </div>
        </div>

        {isCartesian && (
          <div className="chart-style-panel">
            <label>
              Tipo dos traços
              <select value={settings.gridStyle} onChange={(event) => updateChartSetting(chartId, "gridStyle", event.target.value)}>
                <option value="3 3">Pontilhado</option>
                <option value="8 4">Tracejado</option>
                <option value="1 0">Linha sólida</option>
                <option value="1 8">Espaçado</option>
              </select>
            </label>

            {isBarLike && (
              <label>
                Estilo das barras
                <select value={settings.barStyle} onChange={(event) => updateChartSetting(chartId, "barStyle", event.target.value)}>
                  <option value="rounded">Arredondada</option>
                  <option value="soft">Levemente arredondada</option>
                  <option value="square">Quadrada</option>
                  <option value="thin">Fina</option>
                  <option value="thick">Grossa</option>
                </select>
              </label>
            )}
          </div>
        )}

        {isPieLike && (
          <div className="chart-style-panel chart-pie-settings-panel">
            <label className="chart-toggle-label">
              Legenda
              <select
                value={settings.showLegend ? "true" : "false"}
                onChange={(event) => updateChartSetting(chartId, "showLegend", event.target.value === "true")}
              >
                <option value="true">Mostrar</option>
                <option value="false">Ocultar</option>
              </select>
            </label>

            <div className="chart-slice-colors">
              <span>Cores das partes</span>

              <div className="chart-slice-color-grid">
                {chartData.map((row, sliceIndex) => {
                  const label = xKey ? String(row?.[xKey] ?? `Parte ${sliceIndex + 1}`) : `Parte ${sliceIndex + 1}`;

                  return (
                    <label className="chart-slice-color-item" key={`${chartId}-slice-${sliceIndex}`} title={label}>
                      <span>{label}</span>
                      <input
                        type="color"
                        value={getPieColor(settings, sliceIndex)}
                        onChange={(event) => updatePieSliceColor(chartId, sliceIndex, event.target.value)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <AppLayout>
      <main className="dashboards-page dashboards-page-full">
        <section className="dashboard-content dashboard-content-full">
          <div className="dashboard-scroll-area">
            {error && <p className="error-message">{error}</p>}

            {!selectedDashboard ? (
              <div className="dashboard-empty">
                <h2>Nenhum dashboard aberto</h2>

                {loadingList ? (
                  <p>Carregando dashboards...</p>
                ) : dashboards.length === 0 ? (
                  <p>Crie seu primeiro dashboard para visualizar uma análise.</p>
                ) : (
                  <p>Selecione um dashboard pela sidebar para visualizar.</p>
                )}

                <Button onClick={() => setShowCreate(true)}>Criar Dashboard</Button>
              </div>
            ) : (
              <div className="dashboard-view">
                <div className="dashboard-view-header">
                  <div>
                    <h2 className="dashboard-title-hidden">{selectedDashboard.title}</h2>
                  </div>

                  <div className="dashboard-actions">
                    <button
                      type="button"
                      className="dashboard-action-button save-chart-button"
                      onClick={handleSaveChartSettings}
                      disabled={savingSettings || refreshingDashboard}
                    >
                      <Save size={18} />
                      <span>{savingSettings ? "Salvando..." : "Salvar"}</span>
                    </button>

                    <button
                      type="button"
                      className="dashboard-action-button refresh-chart-button"
                      onClick={handleRefreshDashboard}
                      disabled={refreshingDashboard || savingSettings || exportingPdf || !selectedDashboard?.data_source_id}
                      title={
                        selectedDashboard?.data_source_id
                          ? "Atualizar dashboard usando a fonte de dados atual"
                          : "Este dashboard não está ligado a uma fonte de dados"
                      }
                    >
                      <RefreshCcw size={18} />
                      <span>{refreshingDashboard ? "Atualizando..." : "Atualizar"}</span>
                    </button>

                    <button
                      type="button"
                      className="dashboard-action-button export-chart-button"
                      onClick={handleExportPdf}
                      disabled={exportingPdf || refreshingDashboard}
                    >
                      <FileDown size={18} />
                      <span>{exportingPdf ? "Exportando..." : "Exportar"}</span>
                    </button>
                  </div>
                </div>

                {charts.length > 0 ? (
                  <>
                    <div id="dashboard-export-area" className="dashboard-chart-list">
                      {charts.map((currentChart, index) => {
                        const chartId = getChartId(currentChart, index);
                        const settings = chartSettings[chartId] || DEFAULT_CHART_SETTINGS;

                        return (
                          <div key={chartId} className="dashboard-chart-card dashboard-chart-card-large">
                            {renderChartControls(currentChart, index)}

                            <div className="dashboard-chart-real">
                              {renderChart(currentChart, settings)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="dashboard-analysis-card">
                      <h3>Análise da IA</h3>
                      <ReactMarkdown>
                        {selectedDashboard.ai_suggestion || "Sem análise disponível."}
                      </ReactMarkdown>
                    </div>
                  </>
                ) : (
                  <p>Nenhum gráfico encontrado.</p>
                )}
              </div>
            )}
          </div>

          {showCreate && (
            <div className="modal-overlay">
              <form className="delete-modal-card" onSubmit={handleGenerate}>
                <h2>Criar Dashboard</h2>

                <label className="settings-label">
                  Nome do dashboard
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex: Vendas" />
                </label>

                <label className="settings-label">
                  Prompt da análise
                  <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ex: Analise os produtos mais vendidos" />
                </label>

                <label className="settings-label">
                  Arquivo
                  <label className="custom-file-upload">
                    <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={(event) => setFile(event.target.files[0])} />
                    <span>{file ? file.name : "Selecionar arquivo"}</span>
                  </label>
                </label>

                <div className="delete-modal-actions">
                  <button type="button" className="modal-cancel" onClick={() => setShowCreate(false)} disabled={loading}>
                    Cancelar
                  </button>

                  <button type="submit" className="modal-confirm" disabled={loading}>
                    {loading ? "Gerando..." : "Gerar Dashboard"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showDeleteDashboardModal && (
            <div className="modal-overlay">
              <div className="delete-modal-card">
                <h2>Excluir dashboard</h2>
                <p>Tem certeza que deseja excluir este dashboard?</p>

                <div className="delete-modal-actions">
                  <button type="button" className="modal-cancel" onClick={cancelDeleteDashboard} disabled={loadingDelete}>
                    Cancelar
                  </button>

                  <button type="button" className="delete-confirm-button" onClick={confirmDeleteDashboard} disabled={loadingDelete}>
                    {loadingDelete ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
}
