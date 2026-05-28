import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Sparkles, Plus, BarChart3 } from "lucide-react";

import Sidebar from "./Sidebar";

const PAGE_TITLES = {
  dashboards: "Início",
  chat: "IA Financeira",
  settings: "Configurações",
  movimentacoes: "Movimentações",
  relatorios: "Relatórios",
};

function getPageInfo(pathname) {
  if (pathname.startsWith("/chat")) {
    return {
      key: "chat",
      title: PAGE_TITLES.chat,
      subtitle: "Converse com a IA e transforme dados em decisões.",
    };
  }

  if (pathname.startsWith("/settings")) {
    return {
      key: "settings",
      title: PAGE_TITLES.settings,
      subtitle: "Gerencie seu perfil e preferências de acesso.",
    };
  }

  if (pathname.startsWith("/movimentacoes")) {
    return {
      key: "movimentacoes",
      title: PAGE_TITLES.movimentacoes,
      subtitle: "Acompanhe entradas, saídas, transferências e o saldo líquido.",
    };
  }

  if (pathname.startsWith("/relatorios")) {
    return {
      key: "relatorios",
      title: PAGE_TITLES.relatorios,
      subtitle: "Gere relatórios consolidados usando os dashboards já existentes.",
    };
  }

  return {
    key: "dashboards",
    title: PAGE_TITLES.dashboards,
    subtitle: "Resumo dos dashboards, análises e arquivos processados.",
  };
}

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const page = getPageInfo(location.pathname);

  return (
    <main className="app-layout">
      <Sidebar />

      <section className="app-shell">
        <header className="topbar">
          <div className="topbar-title">
            <span className="topbar-eyebrow">DataPilot AI</span>
            <h1>{page.title}</h1>
            <p>{page.subtitle}</p>
          </div>

          <div className="topbar-actions">
            <label className="topbar-search" aria-label="Pesquisar">
              <Search size={18} />
              <input placeholder="Pesquisar..." />
            </label>

            <button
              type="button"
              className="topbar-icon-button"
              aria-label="Notificações"
            >
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

            <button
              type="button"
              className="topbar-cta"
              onClick={() => navigate(page.key === "chat" ? "/dashboards" : "/dashboards")}
            >
              {page.key === "chat" ? <BarChart3 size={18} /> : <Sparkles size={18} />}
              <span>{page.key === "chat" ? "Ver dashboards" : "Nova análise"}</span>
              <Plus size={16} />
            </button>
          </div>
        </header>

        <section className="app-content">{children}</section>
      </section>
    </main>
  );
}
