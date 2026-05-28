import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { Save, FileDown } from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import AppLayout from "../components/AppLayout";
import Button from "../components/Button";

import {
  generateDashboard,
  getDashboard,
  getDashboards,
  deleteDashboard,
  saveChartSettings,
} from "../api/dashboardApi";

import { getToken } from "../utils/storage";

export default function Dashboards() {
  const [searchParams] = useSearchParams();

  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);

  const [chartColor, setChartColor] = useState("#4f46e5");
  const [chartBackground, setChartBackground] = useState("#f8fafc");
  const [xAxisTextColor, setXAxisTextColor] = useState("#0f172a");
  const [yAxisTextColor, setYAxisTextColor] = useState("#0f172a");
  const [gridColor, setGridColor] = useState("#cbd5e1");
  const [gridStyle, setGridStyle] = useState("3 3");
  const [barStyle, setBarStyle] = useState("rounded");

  const [editedChartData, setEditedChartData] = useState([]);

  const [showDeleteDashboardModal, setShowDeleteDashboardModal] =
    useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");

  const chart = selectedDashboard?.charts?.[0];

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

  function applyChartSettings(settings = {}) {
    setChartColor(settings.chart_color || "#4f46e5");
    setChartBackground(settings.chart_background || "#f8fafc");
    setXAxisTextColor(settings.x_axis_text_color || "#0f172a");
    setYAxisTextColor(settings.y_axis_text_color || "#0f172a");
    setGridColor(settings.grid_color || "#cbd5e1");
    setGridStyle(settings.grid_style || "3 3");
    setBarStyle(settings.bar_style || "rounded");
  }

  async function handleSaveChartSettings() {
    if (!selectedDashboard?.id) {
      setError("Nenhum dashboard selecionado.");
      toast.error("Nenhum dashboard selecionado.");
      return;
    }

    try {
      setSavingSettings(true);
      setError("");

      const token = getToken();

      await saveChartSettings({
        token,
        dashboard_id: selectedDashboard.id,
        chart_color: chartColor,
        chart_background: chartBackground,
        x_axis_text_color: xAxisTextColor,
        y_axis_text_color: yAxisTextColor,
        grid_color: gridColor,
        grid_style: gridStyle,
        bar_style: barStyle,
      });

      toast.success("Configurações salvas com sucesso.");
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
        ai_suggestion:
          response.ai_suggestion || response.dashboard?.ai_suggestion || "",
      };

      setSelectedDashboard(dashboard);
      setShowCreate(false);
      setTitle("");
      setPrompt("");
      setFile(null);

      await loadDashboards();
    } catch (err) {
      setError(err.message || "Erro ao gerar dashboard.");
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
        prev.filter(
          (dashboard) => Number(dashboard.id) !== Number(dashboardToDelete)
        )
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

    if (Array.isArray(currentChart.chart_data?.data)) {
      return currentChart.chart_data.data;
    }

    if (Array.isArray(currentChart.chart_data)) {
      return currentChart.chart_data;
    }

    if (Array.isArray(currentChart.data)) {
      return currentChart.data;
    }

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

  function getChartKeys(data, currentChart) {
    const firstItem = data?.[0] || {};
    const keys = Object.keys(firstItem);

    const configX =
      currentChart?.chart_config?.x ||
      currentChart?.config?.x ||
      currentChart?.x ||
      currentChart?.xKey;

    const configY =
      currentChart?.chart_config?.y ||
      currentChart?.config?.y ||
      currentChart?.y ||
      currentChart?.yKey;

    const realXKey = findRealKey(data, configX) || keys[0];

    const realYKey =
      findRealKey(data, configY) ||
      keys.find(
        (key) => key !== realXKey && !Number.isNaN(Number(firstItem[key]))
      ) ||
      keys.find((key) => key !== realXKey);

    return {
      xKey: realXKey,
      yKey: realYKey,
    };
  }

  function formatChartData(data, yKey) {
    if (!yKey) return data;

    return data.map((item) => {
      const value = item[yKey];

      return {
        ...item,
        [yKey]:
          typeof value === "number"
            ? value
            : Number(String(value).replace(",", ".")) || 0,
      };
    });
  }

  const rawChartData = getRawChartData(chart);
  const { xKey, yKey } = getChartKeys(rawChartData, chart);
  const chartData = editedChartData;

  useEffect(() => {
    loadDashboards();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedDashboard) return;

    applyChartSettings(selectedDashboard.chart_settings || {});
  }, [selectedDashboard]);

  useEffect(() => {
    if (!chart) {
      setEditedChartData([]);
      return;
    }

    const rawData = getRawChartData(chart);
    const keys = getChartKeys(rawData, chart);

    setEditedChartData(formatChartData(rawData, keys.yKey));
  }, [selectedDashboard]);

  function handleChangeChartValue(index, value) {
    setEditedChartData((prev) =>
      prev.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              [yKey]: Number(value) || 0,
            }
          : item
      )
    );
  }

  function getBarRadius() {
    if (barStyle === "square") return [0, 0, 0, 0];
    if (barStyle === "soft") return [4, 4, 0, 0];
    return [10, 10, 0, 0];
  }

  function getBarSize() {
    if (barStyle === "thin") return 42;
    if (barStyle === "thick") return 100;
    return 76;
  }

  function renderCustomXAxisTick(props) {
    const { x, y, payload } = props;

    return (
      <text
        x={x}
        y={y + 12}
        fill={xAxisTextColor}
        fontSize={12}
        fontWeight={700}
        textAnchor="end"
        transform={`rotate(-30, ${x}, ${y})`}
      >
        {payload.value}
      </text>
    );
  }

  function renderCustomYAxisTick(props) {
    const { x, y, payload } = props;

    return (
      <text
        x={x - 8}
        y={y + 4}
        fill={yAxisTextColor}
        fontSize={12}
        fontWeight={700}
        textAnchor="end"
      >
        {payload.value}
      </text>
    );
  }

  function renderXAxis() {
    return (
      <XAxis
        dataKey={xKey}
        interval={0}
        height={115}
        tick={renderCustomXAxisTick}
        axisLine={{ stroke: "#94a3b8" }}
        tickLine={{ stroke: "#94a3b8" }}
      />
    );
  }

  function renderYAxis(withDataKey = false) {
    return (
      <YAxis
        dataKey={withDataKey ? yKey : undefined}
        tick={renderCustomYAxisTick}
        axisLine={{ stroke: "#94a3b8" }}
        tickLine={{ stroke: "#94a3b8" }}
      />
    );
  }

  function renderGrid() {
    return <CartesianGrid strokeDasharray={gridStyle} stroke={gridColor} />;
  }

  function renderChart() {
    if (!chart || chartData.length === 0 || !xKey || !yKey) {
      return <p>Sem dados para exibir.</p>;
    }

    const chartWidth = Math.max(chartData.length * 190, 1500);
    const chartType = chart.chart_type || chart.type || "bar";

    const chartWrapperStyle = {
      width: chartType === "pie" ? 1300 : chartWidth,
      height: 680,
      backgroundColor: chartBackground,
      borderRadius: 20,
      padding: 24,
    };

    if (chartType === "line") {
      return (
        <div className="chart-scroll">
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 24, right: 55, left: 34, bottom: 96 }}
              >
                {renderGrid()}
                {renderXAxis()}
                {renderYAxis()}
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={yKey}
                  stroke={chartColor}
                  strokeWidth={4}
                  dot={{ r: 5, fill: chartColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    if (chartType === "pie") {
      return (
        <div className="chart-scroll">
          <div style={chartWrapperStyle}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={chartData}
                  dataKey={yKey}
                  nameKey={xKey}
                  outerRadius={220}
                  label
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={chartColor} />
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
              <ScatterChart
                margin={{ top: 24, right: 55, left: 34, bottom: 96 }}
              >
                {renderGrid()}
                {renderXAxis()}
                {renderYAxis(true)}
                <Tooltip />
                <Scatter data={chartData} fill={chartColor} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }

    return (
      <div className="chart-scroll">
        <div style={chartWrapperStyle}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 24, right: 55, left: 34, bottom: 96 }}
              barCategoryGap="20%"
            >
              {renderGrid()}
              {renderXAxis()}
              {renderYAxis()}
              <Tooltip />
              <Bar
                dataKey={yKey}
                fill={chartColor}
                radius={getBarRadius()}
                barSize={getBarSize()}
                minPointSize={4}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
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

                <Button onClick={() => setShowCreate(true)}>
                  Criar Dashboard
                </Button>
              </div>
            ) : (
              <div className="dashboard-view">
                <div className="dashboard-view-header">
                  <div>
                    <h2>{selectedDashboard.title}</h2>
                  </div>

                  <div className="dashboard-actions">
                    <button
                      type="button"
                      className="dashboard-action-button save-chart-button"
                      onClick={handleSaveChartSettings}
                      disabled={savingSettings}
                    >
                      <Save size={18} />
                      <span>{savingSettings ? "Salvando..." : "Salvar"}</span>
                    </button>

                    <button
                      type="button"
                      className="dashboard-action-button export-chart-button"
                      onClick={handleExportPdf}
                      disabled={exportingPdf}
                    >
                      <FileDown size={18} />
                      <span>
                        {exportingPdf ? "Exportando..." : "Exportar"}
                      </span>
                    </button>
                  </div>
                </div>

                <div id="dashboard-export-area">
                  {chart ? (
                    <div className="dashboard-chart-card dashboard-chart-card-large">
                      <div className="dashboard-chart-top">
                        <h3>{chart.title || "Gráfico gerado"}</h3>

                        <div className="chart-custom-actions">
                          <label className="chart-color-button">
                            <span>Gráfico</span>
                            <span
                              className="chart-color-preview"
                              style={{ backgroundColor: chartColor }}
                            />
                            <input
                              type="color"
                              value={chartColor}
                              onChange={(event) =>
                                setChartColor(event.target.value)
                              }
                            />
                          </label>

                          <label className="chart-color-button">
                            <span>Fundo</span>
                            <span
                              className="chart-color-preview"
                              style={{ backgroundColor: chartBackground }}
                            />
                            <input
                              type="color"
                              value={chartBackground}
                              onChange={(event) =>
                                setChartBackground(event.target.value)
                              }
                            />
                          </label>

                          <label className="chart-color-button">
                            <span>Texto X</span>
                            <span
                              className="chart-color-preview"
                              style={{ backgroundColor: xAxisTextColor }}
                            />
                            <input
                              type="color"
                              value={xAxisTextColor}
                              onChange={(event) =>
                                setXAxisTextColor(event.target.value)
                              }
                            />
                          </label>

                          <label className="chart-color-button">
                            <span>Texto Y</span>
                            <span
                              className="chart-color-preview"
                              style={{ backgroundColor: yAxisTextColor }}
                            />
                            <input
                              type="color"
                              value={yAxisTextColor}
                              onChange={(event) =>
                                setYAxisTextColor(event.target.value)
                              }
                            />
                          </label>

                          <label className="chart-color-button">
                            <span>Traços</span>
                            <span
                              className="chart-color-preview"
                              style={{ backgroundColor: gridColor }}
                            />
                            <input
                              type="color"
                              value={gridColor}
                              onChange={(event) =>
                                setGridColor(event.target.value)
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div className="chart-style-panel">
                        <label>
                          Tipo dos traços
                          <select
                            value={gridStyle}
                            onChange={(event) =>
                              setGridStyle(event.target.value)
                            }
                          >
                            <option value="3 3">Pontilhado</option>
                            <option value="8 4">Tracejado</option>
                            <option value="1 0">Linha sólida</option>
                            <option value="1 8">Espaçado</option>
                          </select>
                        </label>

                        <label>
                          Estilo das barras
                          <select
                            value={barStyle}
                            onChange={(event) =>
                              setBarStyle(event.target.value)
                            }
                          >
                            <option value="rounded">Arredondada</option>
                            <option value="soft">Levemente arredondada</option>
                            <option value="square">Quadrada</option>
                            <option value="thin">Fina</option>
                            <option value="thick">Grossa</option>
                          </select>
                        </label>
                      </div>

                      <div className="dashboard-chart-real">
                        {renderChart()}
                      </div>

                    </div>
                  ) : (
                    <p>Nenhum gráfico encontrado.</p>
                  )}

                  <div className="dashboard-analysis-card">
                    <h3>Análise da IA</h3>
                    <ReactMarkdown>
                      {selectedDashboard.ai_suggestion ||
                        "Sem análise disponível."}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>

          {showCreate && (
            <div className="modal-overlay">
              <form className="delete-modal-card" onSubmit={handleGenerate}>
                <h2>Criar Dashboard</h2>

                <label className="settings-label">
                  Nome do dashboard
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ex: Vendas"
                  />
                </label>

                <label className="settings-label">
                  Prompt da análise
                  <textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Ex: Analise os produtos mais vendidos"
                  />
                </label>

                <label className="settings-label">
                  Arquivo
                  <label className="custom-file-upload">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={(event) => setFile(event.target.files[0])}
                    />

                    <span>{file ? file.name : "Selecionar arquivo"}</span>
                  </label>
                </label>

                <div className="delete-modal-actions">
                  <button
                    type="button"
                    className="modal-cancel"
                    onClick={() => setShowCreate(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="modal-confirm"
                    disabled={loading}
                  >
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
                  <button
                    type="button"
                    className="modal-cancel"
                    onClick={cancelDeleteDashboard}
                    disabled={loadingDelete}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="delete-confirm-button"
                    onClick={confirmDeleteDashboard}
                    disabled={loadingDelete}
                  >
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