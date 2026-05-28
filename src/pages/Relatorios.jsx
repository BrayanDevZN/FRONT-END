import { useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  LineChart as LineChartIcon,
  Plus,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import AppLayout from "../components/AppLayout";
import { getDashboard, getDashboards } from "../api/dashboardApi";
import { getToken } from "../utils/storage";

const FALLBACK_DATA = [
  { categoria: "Receitas", valor: 46800 },
  { categoria: "Despesas", valor: 15932.3 },
  { categoria: "Lucro", valor: 30867.7 },
  { categoria: "Marketing", valor: 4250 },
  { categoria: "Serviços", valor: 1130 },
];

const REPORT_TEMPLATES = [
  {
    key: "dre",
    title: "DRE",
    description: "Demonstração do resultado com totais, médias e margem.",
    tone: "success",
    icon: BarChart3,
  },
  {
    key: "fluxo",
    title: "Fluxo de caixa",
    description: "Entradas, saídas e saldo líquido do período selecionado.",
    tone: "primary",
    icon: RefreshCw,
  },
  {
    key: "categoria",
    title: "Despesas por categoria",
    description: "Agrupamento visual das principais categorias do dashboard.",
    tone: "purple",
    icon: Target,
  },
  {
    key: "cliente",
    title: "Receitas por cliente",
    description: "Relatório sintético baseado nos campos carregados no gráfico.",
    tone: "warning",
    icon: TrendingUp,
  },
  {
    key: "comparativo",
    title: "Comparativo mensal",
    description: "Comparação visual dos valores presentes no dashboard atual.",
    tone: "info",
    icon: LineChartIcon,
  },
];

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

  const realXKey = findRealKey(data, configX) || keys[0] || "categoria";

  const realYKey =
    findRealKey(data, configY) ||
    keys.find(
      (key) => key !== realXKey && !Number.isNaN(Number(firstItem[key]))
    ) ||
    keys.find((key) => key !== realXKey) ||
    "valor";

  return {
    xKey: realXKey,
    yKey: realYKey,
  };
}

function toNumber(value) {
  if (typeof value === "number") return value;

  const normalized = String(value ?? "")
    .replace(/\s/g, "")
    .replace(/R\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  return Number(normalized) || 0;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function downloadFile({ content, filename, type }) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Relatorios() {
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState("");
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [reports, setReports] = useState([]);
  const [period, setPeriod] = useState("01/05/2025 - 31/05/2025");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [formatFilter, setFormatFilter] = useState("PDF");
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [error, setError] = useState("");

  const chart = selectedDashboard?.charts?.[0];
  const rawChartData = useMemo(() => getRawChartData(chart), [chart]);
  const hasRealData = rawChartData.length > 0;
  const baseData = hasRealData ? rawChartData : FALLBACK_DATA;
  const { xKey, yKey } = useMemo(
    () => getChartKeys(baseData, chart),
    [baseData, chart]
  );

  const chartData = useMemo(
    () =>
      baseData.map((item) => ({
        ...item,
        [yKey]: toNumber(item[yKey]),
      })),
    [baseData, yKey]
  );

  const numericValues = useMemo(
    () => chartData.map((item) => toNumber(item[yKey])),
    [chartData, yKey]
  );

  const total = numericValues.reduce((sum, value) => sum + value, 0);
  const average = numericValues.length ? total / numericValues.length : 0;
  const maxValue = numericValues.length ? Math.max(...numericValues) : 0;
  const minValue = numericValues.length ? Math.min(...numericValues) : 0;

  const topItem = useMemo(() => {
    if (!chartData.length) return null;

    return chartData.reduce((best, item) =>
      toNumber(item[yKey]) > toNumber(best[yKey]) ? item : best
    );
  }, [chartData, yKey]);

  const tableRows = reports.length
    ? reports
    : dashboards.map((dashboard, index) => ({
        id: `dashboard-${dashboard.id}`,
        dashboardId: dashboard.id,
        name: dashboard.title || `Dashboard ${index + 1}`,
        period,
        generated: "Disponível no sistema",
        format: "PDF",
        status: "Pronto",
      }));

  async function loadDashboards() {
    setLoading(true);
    setError("");

    try {
      const token = getToken();
      const response = await getDashboards(token);
      const dashboardList = response?.dashboards || [];

      setDashboards(dashboardList);

      const firstId = dashboardList[0]?.id;

      if (firstId) {
        setSelectedDashboardId(String(firstId));
        await openDashboard(firstId);
      }
    } catch (err) {
      const message = err.message || "Erro ao carregar relatórios.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function openDashboard(dashboardId) {
    if (!dashboardId) {
      setSelectedDashboard(null);
      return;
    }

    setError("");

    try {
      const token = getToken();
      const response = await getDashboard(token, dashboardId);
      setSelectedDashboard(response?.dashboard || null);
    } catch (err) {
      const message = err.message || "Erro ao abrir dashboard para relatório.";
      setError(message);
      toast.error(message);
    }
  }

  useEffect(() => {
    loadDashboards();
  }, []);

  async function handleDashboardChange(event) {
    const dashboardId = event.target.value;
    setSelectedDashboardId(dashboardId);
    await openDashboard(dashboardId);
  }

  function handleGenerateReport(templateTitle = "Relatório personalizado") {
    const generatedReport = {
      id: Date.now(),
      dashboardId: selectedDashboard?.id || selectedDashboardId,
      name: `${templateTitle} - ${selectedDashboard?.title || "Dados atuais"}`,
      period,
      generated: formatDateTime(),
      format: formatFilter,
      status: "Concluído",
    };

    setReports((currentReports) => [generatedReport, ...currentReports]);
    toast.success("Relatório gerado com os dados atuais.");
  }

  function exportCsv(reportName = selectedDashboard?.title || "relatorio") {
    const rows = chartData.length ? chartData : [];

    if (!rows.length) {
      toast.error("Não há dados para exportar.");
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(";"),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(";")
      ),
    ];

    downloadFile({
      content: `\ufeff${csvLines.join("\n")}`,
      filename: `${reportName}`.replace(/\s+/g, "_").toLowerCase() + ".csv",
      type: "text/csv;charset=utf-8;",
    });

    toast.success("CSV exportado com sucesso.");
  }

  async function exportPdf(reportName = selectedDashboard?.title || "relatorio") {
    try {
      setExportingPdf(true);
      setError("");

      const element = document.getElementById("reports-export-area");

      if (!element) {
        toast.error("Área de relatório não encontrada.");
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
      pdf.save(`${reportName}`.replace(/\s+/g, "_").toLowerCase() + ".pdf");
      toast.success("PDF exportado com sucesso.");
    } catch (err) {
      setError("Erro ao exportar PDF.");
      toast.error("Erro ao exportar PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  function handleReportAction(report, action) {
    if (report.dashboardId && String(report.dashboardId) !== String(selectedDashboardId)) {
      setSelectedDashboardId(String(report.dashboardId));
      openDashboard(report.dashboardId);
    }

    if (action === "csv") {
      exportCsv(report.name);
      return;
    }

    if (action === "pdf") {
      exportPdf(report.name);
      return;
    }

    toast.success("Relatório aberto na visualização acima.");
  }

  const hasDashboards = dashboards.length > 0;

  return (
    <AppLayout>
      <main className="reports-page">
        {error && <p className="error-message">{error}</p>}

        <section className="reports-filter-card">
          <div className="reports-filter-grid">
            <label className="reports-field">
              <span>Período</span>
              <input
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                placeholder="01/05/2025 - 31/05/2025"
              />
            </label>

            <label className="reports-field">
              <span>Dashboard base</span>
              <select
                value={selectedDashboardId}
                onChange={handleDashboardChange}
                disabled={!hasDashboards || loading}
              >
                {!hasDashboards && <option>Nenhum dashboard encontrado</option>}
                {dashboards.map((dashboard) => (
                  <option key={dashboard.id} value={dashboard.id}>
                    {dashboard.title || `Dashboard ${dashboard.id}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="reports-field">
              <span>Categoria</span>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option>Todas</option>
                <option>Receitas</option>
                <option>Despesas</option>
                <option>Clientes</option>
                <option>Produtos</option>
              </select>
            </label>

            <label className="reports-field">
              <span>Formato</span>
              <select
                value={formatFilter}
                onChange={(event) => setFormatFilter(event.target.value)}
              >
                <option>PDF</option>
                <option>CSV</option>
              </select>
            </label>
          </div>

          <div className="reports-filter-actions">
            <button type="button" className="reports-soft-button">
              <Filter size={16} />
              Filtrar
            </button>

            <button
              type="button"
              className="reports-link-button"
              onClick={() => {
                setPeriod("01/05/2025 - 31/05/2025");
                setCategoryFilter("Todas");
                setFormatFilter("PDF");
              }}
            >
              Limpar filtros
            </button>

            <button
              type="button"
              className="reports-primary-button"
              onClick={() => handleGenerateReport()}
              disabled={loading}
            >
              <Plus size={16} />
              Gerar relatório
            </button>
          </div>
        </section>

        <div id="reports-export-area" className="reports-export-area">
          <section className="reports-summary-grid">
            <article className="reports-summary-card">
              <div className="reports-summary-icon primary">
                <Database size={20} />
              </div>
              <span>Dashboard atual</span>
              <strong>{selectedDashboard?.title || "Sem dashboard"}</strong>
              <p>{hasRealData ? "Dados reais do site" : "Exemplo visual até carregar dados"}</p>
            </article>

            <article className="reports-summary-card">
              <div className="reports-summary-icon success">
                <BarChart3 size={20} />
              </div>
              <span>Total analisado</span>
              <strong>{formatCurrency(total)}</strong>
              <p>{chartData.length} registros considerados</p>
            </article>

            <article className="reports-summary-card">
              <div className="reports-summary-icon warning">
                <CalendarDays size={20} />
              </div>
              <span>Média por item</span>
              <strong>{formatCurrency(average)}</strong>
              <p>Período: {period}</p>
            </article>

            <article className="reports-summary-card">
              <div className="reports-summary-icon purple">
                <TrendingUp size={20} />
              </div>
              <span>Maior valor</span>
              <strong>{formatCurrency(maxValue)}</strong>
              <p>{topItem ? String(topItem[xKey]) : "Sem item"}</p>
            </article>
          </section>

          <section className="reports-template-grid">
            {REPORT_TEMPLATES.map((template) => {
              const Icon = template.icon;

              return (
                <article key={template.key} className="reports-template-card">
                  <div className={`reports-template-icon ${template.tone}`}>
                    <Icon size={22} />
                  </div>
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                  <button
                    type="button"
                    onClick={() => handleGenerateReport(template.title)}
                  >
                    Gerar
                  </button>
                </article>
              );
            })}
          </section>

          <section className="reports-main-grid">
            <div className="reports-charts-column">
              <article className="reports-card reports-card-large">
                <div className="reports-card-header">
                  <div>
                    <h3>Visão geral do relatório</h3>
                    <p>Gráfico gerado com os dados do dashboard selecionado.</p>
                  </div>

                  <select>
                    <option>{categoryFilter}</option>
                    <option>Receitas</option>
                    <option>Despesas</option>
                  </select>
                </div>

                <ResponsiveContainer width="100%" height={285}>
                  <LineChart data={chartData} margin={{ top: 8, right: 22, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={yKey}
                      name="Valor"
                      stroke="#0066ff"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#0066ff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </article>

              <div className="reports-two-charts">
                <article className="reports-card">
                  <div className="reports-card-header compact">
                    <div>
                      <h3>Comparativo por item</h3>
                      <p>Valores brutos do gráfico atual.</p>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={chartData} margin={{ top: 8, right: 18, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey={xKey} tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey={yKey} fill="#0066ff" radius={[8, 8, 0, 0]} name="Valor" />
                    </BarChart>
                  </ResponsiveContainer>
                </article>

                <article className="reports-card">
                  <div className="reports-card-header compact">
                    <div>
                      <h3>Participação</h3>
                      <p>Distribuição proporcional dos valores.</p>
                    </div>
                  </div>

                  <div className="reports-pie-wrap">
                    <ResponsiveContainer width="100%" height={230}>
                      <RechartsPieChart>
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Pie
                          data={chartData.slice(0, 6)}
                          dataKey={yKey}
                          nameKey={xKey}
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={2}
                        >
                          {chartData.slice(0, 6).map((_, index) => (
                            <Cell
                              key={index}
                              fill={["#0066ff", "#00c2a8", "#7c3aed", "#f97316", "#10b981", "#64748b"][index % 6]}
                            />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>

                    <div className="reports-pie-total">
                      <span>Total</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
                  </div>
                </article>
              </div>

              <article className="reports-card reports-table-card">
                <div className="reports-card-header">
                  <div>
                    <h3>Relatórios gerados</h3>
                    <p>Lista baseada nos dashboards e relatórios criados nesta tela.</p>
                  </div>

                  <div className="reports-card-actions">
                    <button type="button" onClick={() => exportPdf()} disabled={exportingPdf}>
                      <FileText size={15} />
                      {exportingPdf ? "Exportando..." : "Exportar PDF"}
                    </button>
                    <button type="button" onClick={() => exportCsv()}>
                      <Download size={15} />
                      Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Período</th>
                        <th>Gerado em</th>
                        <th>Formato</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="reports-empty-row">
                            Nenhum dashboard encontrado para gerar relatório.
                          </td>
                        </tr>
                      ) : (
                        tableRows.map((report) => (
                          <tr key={report.id}>
                            <td>
                              <span className="reports-report-name">
                                <FileText size={16} />
                                {report.name}
                              </span>
                            </td>
                            <td>{report.period}</td>
                            <td>{report.generated}</td>
                            <td>
                              <span className={`reports-format-pill ${String(report.format).toLowerCase()}`}>
                                {report.format}
                              </span>
                            </td>
                            <td>
                              <span className="reports-status-pill">{report.status}</span>
                            </td>
                            <td>
                              <div className="reports-row-actions">
                                <button
                                  type="button"
                                  title="Baixar PDF"
                                  onClick={() => handleReportAction(report, "pdf")}
                                >
                                  <Download size={15} />
                                </button>
                                <button
                                  type="button"
                                  title="Ver relatório"
                                  onClick={() => handleReportAction(report, "view")}
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  type="button"
                                  title="Exportar CSV"
                                  onClick={() => handleReportAction(report, "csv")}
                                >
                                  ⋯
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <aside className="reports-side-column">
              <article className="reports-card reports-ai-card">
                <div className="reports-card-header compact">
                  <div>
                    <h3>Insights da IA</h3>
                    <p>Resumo calculado a partir do dashboard atual.</p>
                  </div>
                </div>

                <div className="reports-insight-list">
                  <div className="reports-insight success">
                    <div><TrendingUp size={18} /></div>
                    <span>
                      <strong>Total consolidado</strong>
                      O relatório atual soma {formatCurrency(total)} em {chartData.length} registros.
                    </span>
                  </div>

                  <div className="reports-insight warning">
                    <div><AlertTriangle size={18} /></div>
                    <span>
                      <strong>Amplitude dos dados</strong>
                      A variação vai de {formatCurrency(minValue)} até {formatCurrency(maxValue)}.
                    </span>
                  </div>

                  <div className="reports-insight primary">
                    <div><Target size={18} /></div>
                    <span>
                      <strong>Item principal</strong>
                      {topItem ? `${topItem[xKey]} concentra o maior valor do relatório.` : "Selecione um dashboard para ver o destaque."}
                    </span>
                  </div>
                </div>
              </article>

              <article className="reports-card reports-legend-card">
                <h3>Legenda</h3>

                <div className="reports-legend-list">
                  {chartData.slice(0, 8).map((item, index) => {
                    const value = toNumber(item[yKey]);
                    const percentage = total ? (value / total) * 100 : 0;

                    return (
                      <div key={`${item[xKey]}-${index}`} className="reports-legend-item">
                        <span>
                          <i style={{ backgroundColor: ["#0066ff", "#00c2a8", "#7c3aed", "#f97316", "#10b981", "#64748b"][index % 6] }} />
                          {String(item[xKey])}
                        </span>
                        <strong>{percentage.toFixed(1).replace(".", ",")}%</strong>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="reports-card reports-source-card">
                <h3>Fonte do relatório</h3>
                <p>
                  Esta tela usa os dashboards já existentes no site. Quando você troca o dashboard base,
                  os cards, gráficos, legenda e exportações são recalculados automaticamente.
                </p>
                <button type="button" onClick={loadDashboards} disabled={loading}>
                  <RefreshCw size={15} />
                  {loading ? "Atualizando..." : "Atualizar dados"}
                </button>
              </article>
            </aside>
          </section>
        </div>
      </main>
    </AppLayout>
  );
}
