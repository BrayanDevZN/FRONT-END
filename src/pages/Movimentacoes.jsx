import {
  ArrowRightLeft,
  Calendar,
  Download,
  Filter,
  Plus,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import AppLayout from "../components/AppLayout";

const transactions = [
  { date: "31/05/2025", desc: "Venda à vista #1234", category: "Vendas", account: "Conta Corrente • 1234", type: "entrada", value: 1250.0, status: "concluída" },
  { date: "31/05/2025", desc: "Pix recebido - Cliente João", category: "Vendas", account: "Banco Inter • 5678", type: "entrada", value: 890.0, status: "concluída" },
  { date: "30/05/2025", desc: "Pagamento de fornecedor", category: "Fornecedores", account: "Conta Corrente • 1234", type: "saida", value: -1450.0, status: "concluída" },
  { date: "30/05/2025", desc: "Transferência para poupança", category: "Transferências", account: "Banco Inter • 5678", type: "transferencia", value: -500.0, status: "concluída" },
  { date: "29/05/2025", desc: "Aluguel da loja", category: "Despesas Fixas", account: "Conta Corrente • 1234", type: "saida", value: -2200.0, status: "pendente" },
  { date: "28/05/2025", desc: "Internet e Telefonia", category: "Utilidades", account: "Conta Corrente • 1234", type: "saida", value: -189.9, status: "concluída" },
  { date: "28/05/2025", desc: "Transferência entre contas", category: "Transferências", account: "Poupança • 9012", type: "transferencia", value: 800.0, status: "concluída" },
  { date: "27/05/2025", desc: "Venda parcelada #5678", category: "Vendas", account: "Banco Inter • 5678", type: "entrada", value: 2450.0, status: "concluída" },
  { date: "27/05/2025", desc: "Material de escritório", category: "Despesas Gerais", account: "Conta Corrente • 1234", type: "saida", value: -95.4, status: "concluída" },
  { date: "26/05/2025", desc: "Combustível", category: "Transporte", account: "Conta Corrente • 1234", type: "saida", value: -120.0, status: "concluída" },
];

const movementsByType = [
  { name: "Entradas", value: 27845.6, color: "#10B981", percentage: 56.6 },
  { name: "Saídas", value: 16932.3, color: "#EF4444", percentage: 34.4 },
  { name: "Transferências", value: 4215.0, color: "#0066FF", percentage: 8.6 },
];

const summaryCards = [
  {
    label: "Entradas",
    value: "R$ 27.845,60",
    trend: "12,3% vs período anterior",
    tone: "success",
    icon: TrendingUp,
  },
  {
    label: "Saídas",
    value: "R$ 16.932,30",
    trend: "5,7% vs período anterior",
    tone: "danger",
    icon: TrendingDown,
  },
  {
    label: "Transferências",
    value: "R$ 4.215,00",
    trend: "3,1% vs período anterior",
    tone: "primary",
    icon: ArrowRightLeft,
  },
  {
    label: "Saldo líquido",
    value: "R$ 10.913,30",
    trend: "28,6% vs período anterior",
    tone: "purple",
    icon: TrendingUp,
  },
];

function formatCurrency(value) {
  return `R$ ${Math.abs(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function getCategoryClass(category) {
  const normalized = category.toLowerCase();
  if (normalized.includes("vendas")) return "success";
  if (normalized.includes("fornecedor")) return "danger";
  if (normalized.includes("transfer")) return "primary";
  if (normalized.includes("fixas") || normalized.includes("gerais")) return "warning";
  if (normalized.includes("utilidades")) return "yellow";
  return "purple";
}

function TypeIcon({ type }) {
  if (type === "entrada") {
    return (
      <span className="movement-type success">
        <TrendingUp size={15} /> Entrada
      </span>
    );
  }

  if (type === "saida") {
    return (
      <span className="movement-type danger">
        <TrendingDown size={15} /> Saída
      </span>
    );
  }

  return (
    <span className="movement-type primary">
      <ArrowRightLeft size={15} /> Transferência
    </span>
  );
}

export default function Movimentacoes() {
  const totalMovements = movementsByType.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <AppLayout>
      <main className="movements-page">
        <section className="movements-summary-grid">
          {summaryCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.label} className="movement-summary-card">
                <div className="movement-summary-top">
                  <div>
                    <span>{card.label}</span>
                    <h2>{card.value}</h2>
                  </div>

                  <div className={`movement-summary-icon ${card.tone}`}>
                    <Icon size={21} />
                  </div>
                </div>

                <p className={card.tone === "danger" ? "trend-danger" : "trend-success"}>
                  <TrendingUp size={14} />
                  {card.trend}
                </p>
              </article>
            );
          })}
        </section>

        <section className="movements-layout-grid">
          <article className="movements-table-card">
            <div className="movements-filters-grid">
              <label className="movements-date-filter">
                <Calendar size={16} />
                <span>01/05/2025 - 31/05/2025</span>
              </label>

              <select>
                <option>Todas</option>
                <option>Vendas</option>
                <option>Despesas Fixas</option>
              </select>

              <select>
                <option>Todas as contas</option>
                <option>Conta Corrente</option>
                <option>Poupança</option>
              </select>

              <select>
                <option>Todos os tipos</option>
                <option>Entrada</option>
                <option>Saída</option>
              </select>

              <select>
                <option>Todos os status</option>
                <option>Concluída</option>
                <option>Pendente</option>
              </select>
            </div>

            <div className="movements-toolbar">
              <div className="movements-toolbar-left">
                <button type="button" className="movement-soft-button">
                  <Filter size={16} /> Filtros avançados
                </button>
                <button type="button" className="movement-link-button">Limpar filtros</button>
              </div>

              <div className="movements-toolbar-right">
                <button type="button" className="movement-soft-button">
                  <Upload size={16} /> Importar
                </button>
                <button type="button" className="movement-soft-button">
                  <Download size={16} /> Exportar
                </button>
                <button type="button" className="movement-primary-button">
                  <Plus size={16} /> Nova movimentação
                </button>
              </div>
            </div>

            <div className="movements-table-header">
              <h3>Movimentações</h3>
              <span>128 registros encontrados</span>
            </div>

            <div className="movements-table-wrap">
              <table className="movements-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Conta</th>
                    <th>Tipo</th>
                    <th className="is-right">Valor</th>
                    <th>Status</th>
                    <th className="is-center">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={`${transaction.desc}-${index}`}>
                      <td>{transaction.date}</td>
                      <td className="movement-description">{transaction.desc}</td>
                      <td>
                        <span className={`category-pill ${getCategoryClass(transaction.category)}`}>
                          {transaction.category}
                        </span>
                      </td>
                      <td className="movement-account">{transaction.account}</td>
                      <td>
                        <TypeIcon type={transaction.type} />
                      </td>
                      <td className={`movement-value ${transaction.value >= 0 ? "positive" : "negative"}`}>
                        {transaction.value < 0 ? "-" : ""}{formatCurrency(transaction.value)}
                      </td>
                      <td>
                        <span className={`status-pill ${transaction.status === "concluída" ? "success" : "warning"}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="is-center">
                        <button type="button" className="movement-row-menu" aria-label="Abrir ações da movimentação">⋮</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="movements-pagination">
              <span>Mostrando 1 a 10 de 128 movimentações</span>

              <div className="movement-pages">
                <button type="button">‹</button>
                <button type="button" className="is-active">1</button>
                <button type="button">2</button>
                <button type="button">3</button>
                <span>...</span>
                <button type="button">13</button>
                <button type="button">›</button>
              </div>

              <select>
                <option>10 por página</option>
                <option>25 por página</option>
                <option>50 por página</option>
              </select>
            </div>
          </article>

          <aside className="movements-side-panel">
            <article className="movement-insight-card">
              <div className="movement-card-title-row">
                <h3>Movimentações por tipo</h3>
                <select>
                  <option>Este mês</option>
                  <option>Últimos 3 meses</option>
                </select>
              </div>

              <div className="movement-donut-wrap">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={movementsByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={88}
                    >
                      {movementsByType.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="movement-donut-center">
                  <span>Total</span>
                  <strong>{formatCurrency(totalMovements)}</strong>
                </div>
              </div>

              <div className="movement-legend-list">
                {movementsByType.map((type) => (
                  <div key={type.name} className="movement-legend-item">
                    <span className="legend-dot" style={{ backgroundColor: type.color }} />
                    <span>{type.name}</span>
                    <strong>{formatCurrency(type.value)}</strong>
                    <small>{type.percentage}%</small>
                  </div>
                ))}
              </div>

              <button type="button" className="movement-card-link">Ver relatório completo</button>
            </article>

            <article className="movement-insight-card">
              <h3>Insights de movimentações</h3>

              <div className="movement-alert-list">
                <div className="movement-alert success">
                  <div><TrendingUp size={17} /></div>
                  <span>
                    <strong>Suas entradas cresceram 12,3%</strong>
                    Ótimo! Você recebeu R$ 3.042,15 a mais que no período anterior.
                  </span>
                </div>

                <div className="movement-alert danger">
                  <div><TrendingDown size={17} /></div>
                  <span>
                    <strong>Atenção com despesas fixas</strong>
                    Despesas fixas representam 42% das suas saídas.
                  </span>
                </div>

                <div className="movement-alert primary">
                  <div><ArrowRightLeft size={17} /></div>
                  <span>
                    <strong>5 pagamentos pendentes</strong>
                    Total de R$ 1.820,00 em contas a pagar.
                  </span>
                </div>
              </div>

              <button type="button" className="movement-card-link">Ver mais insights</button>
            </article>
          </aside>
        </section>
      </main>
    </AppLayout>
  );
}
