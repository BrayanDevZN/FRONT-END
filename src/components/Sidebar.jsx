import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRightLeft,
  BarChart3,
  FileText,
  ChevronLeft,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Plus,
  Rocket,
  Settings,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import {
  createConversation,
  getConversations,
  deleteConversation,
} from "../api/accountsApi";

import {
  generateDashboard,
  getDashboards,
  deleteDashboard,
} from "../api/dashboardApi";

import { getToken, removeToken } from "../utils/storage";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatTitle, setChatTitle] = useState("");

  const [showNewDashboardModal, setShowNewDashboardModal] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState("");
  const [dashboardPrompt, setDashboardPrompt] = useState("");
  const [dashboardFile, setDashboardFile] = useState(null);

  const [modalError, setModalError] = useState("");

  const [openChatMenuId, setOpenChatMenuId] = useState(null);
  const [openDashboardMenuId, setOpenDashboardMenuId] = useState(null);

  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const [showDeleteDashboardModal, setShowDeleteDashboardModal] = useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState(null);

  const activeArea = useMemo(() => {
    if (location.pathname.startsWith("/chat")) return "ia";
    if (location.pathname.startsWith("/movimentacoes")) return "movimentacoes";
    if (location.pathname.startsWith("/relatorios")) return "relatorios";
    if (location.pathname.startsWith("/settings")) return "settings";
    return "inicio";
  }, [location.pathname]);

  function getConversationId(conversation) {
    return conversation.conversation_id || conversation.id;
  }

  function goToChat(id, title) {
    navigate(`/chat/${id}`, { state: { title } });
  }

  function goToDashboard(id) {
    navigate(`/dashboards?dashboard_id=${id}`);
  }

  async function loadConversations() {
    try {
      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await getConversations(token);
      const data = Array.isArray(response) ? response : response?.conversations || [];

      setConversations(data);
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
      setConversations([]);
    }
  }

  async function loadDashboards() {
    try {
      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await getDashboards(token);
      setDashboards(response?.dashboards || []);
    } catch (err) {
      console.error("Erro ao carregar dashboards:", err);
      setDashboards([]);
    }
  }

  function openNewChatModal() {
    setChatTitle("");
    setModalError("");
    setShowNewChatModal(true);
  }

  function closeNewChatModal() {
    if (loading) return;

    setChatTitle("");
    setModalError("");
    setShowNewChatModal(false);
  }

  function openNewDashboardModal() {
    setDashboardTitle("");
    setDashboardPrompt("");
    setDashboardFile(null);
    setModalError("");
    setShowNewDashboardModal(true);
  }

  function closeNewDashboardModal() {
    if (loading) return;

    setDashboardTitle("");
    setDashboardPrompt("");
    setDashboardFile(null);
    setModalError("");
    setShowNewDashboardModal(false);
  }

  async function handleCreateChat(event) {
    event.preventDefault();

    const title = chatTitle.trim();

    if (!title) {
      setModalError("Digite um nome para o chat.");
      return;
    }

    try {
      setLoading(true);
      setModalError("");

      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await createConversation(token, title);
      const conversationId = response?.conversation_id || response?.id || response?.data?.conversation_id;

      if (!conversationId) {
        throw new Error("A API não retornou o ID da conversa.");
      }

      const newConversation = {
        conversation_id: conversationId,
        title,
        total_messages: 0,
      };

      setConversations((prev) => [newConversation, ...prev]);
      setChatTitle("");
      setShowNewChatModal(false);
      goToChat(conversationId, title);
    } catch (err) {
      console.error("Erro ao criar conversa:", err);
      setModalError(err.message || "Erro ao criar conversa.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDashboard(event) {
    event.preventDefault();

    const title = dashboardTitle.trim();
    const prompt = dashboardPrompt.trim();

    if (!title) {
      setModalError("Digite um nome para o dashboard.");
      return;
    }

    if (!prompt) {
      setModalError("Digite o prompt da análise.");
      return;
    }

    if (!dashboardFile) {
      setModalError("Selecione um arquivo CSV, XLSX ou JSON.");
      return;
    }

    try {
      setLoading(true);
      setModalError("");

      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await generateDashboard({
        token,
        title,
        prompt,
        file: dashboardFile,
      });

      const createdDashboard = response?.dashboard;

      await loadDashboards();

      setDashboardTitle("");
      setDashboardPrompt("");
      setDashboardFile(null);
      setShowNewDashboardModal(false);

      if (createdDashboard?.id) {
        goToDashboard(createdDashboard.id);
      } else {
        navigate("/dashboards");
      }
    } catch (err) {
      console.error("Erro ao criar dashboard:", err);
      setModalError(err.message || "Erro ao criar dashboard.");
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteChat(event, id) {
    event.stopPropagation();
    setConversationToDelete(id);
    setShowDeleteChatModal(true);
    setOpenChatMenuId(null);
  }

  async function confirmDeleteChat() {
    try {
      const token = getToken();
      await deleteConversation(token, conversationToDelete);

      setConversations((prev) =>
        prev.filter((conversation) => Number(getConversationId(conversation)) !== Number(conversationToDelete))
      );

      if (window.location.pathname === `/chat/${conversationToDelete}`) {
        navigate("/dashboards");
      }

      setConversationToDelete(null);
      setShowDeleteChatModal(false);
    } catch (err) {
      console.error("Erro ao deletar conversa:", err);
      alert(err.message || "Erro ao deletar conversa.");
    }
  }

  function cancelDeleteChat() {
    setConversationToDelete(null);
    setShowDeleteChatModal(false);
  }

  function handleDeleteDashboard(event, id) {
    event.stopPropagation();
    setDashboardToDelete(id);
    setShowDeleteDashboardModal(true);
    setOpenDashboardMenuId(null);
  }

  async function confirmDeleteDashboard() {
    try {
      const token = getToken();
      await deleteDashboard(token, dashboardToDelete);

      setDashboards((prev) =>
        prev.filter((dashboard) => Number(dashboard.id) !== Number(dashboardToDelete))
      );

      setDashboardToDelete(null);
      setShowDeleteDashboardModal(false);

      if (window.location.pathname.startsWith("/dashboards")) {
        navigate("/dashboards");
      }
    } catch (err) {
      console.error("Erro ao deletar dashboard:", err);
      alert(err.message || "Erro ao deletar dashboard.");
    }
  }

  function cancelDeleteDashboard() {
    setDashboardToDelete(null);
    setShowDeleteDashboardModal(false);
  }

  function handleLogout() {
    removeToken();
    navigate("/");
  }

  useEffect(() => {
    loadConversations();
    loadDashboards();
  }, []);

  return (
    <>
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <button
              type="button"
              className="sidebar-logo-button"
              onClick={() => navigate("/dashboards")}
              aria-label="Ir para o início"
            >
              {collapsed ? (
                <div className="sidebar-mark">D</div>
              ) : (
                <img src="/datapilot-logo-light.svg" alt="DataPilot AI" />
              )}
            </button>
          </div>

          <nav className="sidebar-main-nav" aria-label="Navegação principal">
            <button
              type="button"
              className={`sidebar-nav-item ${activeArea === "inicio" ? "is-active" : ""}`}
              onClick={() => navigate("/dashboards")}
              title="Início"
            >
              <Home size={20} />
              {!collapsed && <span>Início</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeArea === "ia" ? "is-active" : ""}`}
              onClick={() => {
                const firstConversation = conversations[0];
                if (firstConversation) {
                  goToChat(getConversationId(firstConversation), firstConversation.title || "IA Financeira");
                } else {
                  openNewChatModal();
                }
              }}
              title="IA Financeira"
            >
              <Sparkles size={20} />
              {!collapsed && <span>IA Financeira</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeArea === "movimentacoes" ? "is-active" : ""}`}
              onClick={() => navigate("/movimentacoes")}
              title="Movimentações"
            >
              <ArrowRightLeft size={20} />
              {!collapsed && <span>Movimentações</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${activeArea === "relatorios" ? "is-active" : ""}`}
              onClick={() => navigate("/relatorios")}
              title="Relatórios"
            >
              <FileText size={20} />
              {!collapsed && <span>Relatórios</span>}
            </button>

          </nav>


          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>{collapsed ? "Dash" : "Dashboards"}</span>
              {!collapsed && (
                <button type="button" onClick={openNewDashboardModal} disabled={loading}>
                  <Plus size={15} />
                </button>
              )}
            </div>

            <div className="sidebar-list">
              {dashboards.length === 0 ? (
                !collapsed && <p className="sidebar-empty">Nenhum dashboard ainda.</p>
              ) : (
                dashboards.map((dashboard) => (
                  <div key={dashboard.id} className="sidebar-row">
                    <button
                      className="sidebar-row-main"
                      onClick={() => goToDashboard(dashboard.id)}
                      title={dashboard.title}
                    >
                      <BarChart3 size={16} />
                      {!collapsed && <span>{dashboard.title}</span>}
                    </button>

                    {!collapsed && (
                      <button
                        type="button"
                        className="sidebar-menu-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenDashboardMenuId(openDashboardMenuId === dashboard.id ? null : dashboard.id);
                        }}
                      >
                        ⋯
                      </button>
                    )}

                    {openDashboardMenuId === dashboard.id && (
                      <div className="sidebar-popover-menu">
                        <button type="button" onClick={(event) => handleDeleteDashboard(event, dashboard.id)}>
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>{collapsed ? "IA" : "Chats da IA"}</span>
              {!collapsed && (
                <button type="button" onClick={openNewChatModal} disabled={loading}>
                  <Plus size={15} />
                </button>
              )}
            </div>

            <div className="sidebar-list">
              {conversations.length === 0 ? (
                !collapsed && <p className="sidebar-empty">Nenhuma conversa ainda.</p>
              ) : (
                conversations.map((conversation) => {
                  const id = getConversationId(conversation);
                  const title = conversation.title || `Conversa #${id}`;

                  return (
                    <div key={id} className="sidebar-row">
                      <button
                        className="sidebar-row-main"
                        onClick={() => goToChat(id, title)}
                        title={title}
                      >
                        <MessageSquareText size={16} />
                        {!collapsed && <span>{title}</span>}
                      </button>

                      {!collapsed && (
                        <button
                          type="button"
                          className="sidebar-menu-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenChatMenuId(openChatMenuId === id ? null : id);
                          }}
                        >
                          ⋯
                        </button>
                      )}

                      {openChatMenuId === id && (
                        <div className="sidebar-popover-menu">
                          <button type="button" onClick={(event) => handleDeleteChat(event, id)}>
                            <Trash2 size={14} />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-create-card sidebar-create-card-footer">
              <div className="create-card-icon">
                <Rocket size={18} />
              </div>
              <p>Transforme planilhas em gráficos e respostas com IA.</p>
              <button type="button" onClick={openNewDashboardModal} disabled={loading}>
                <UploadCloud size={16} />
                Enviar arquivo
              </button>
            </div>
          )}

          <button
            type="button"
            className={`sidebar-nav-item sidebar-footer-nav-item ${activeArea === "settings" ? "is-active" : ""}`}
            onClick={() => navigate("/settings")}
            title="Configurações"
          >
            <Settings size={20} />
            {!collapsed && <span>Configurações</span>}
          </button>

          <button type="button" className="sidebar-nav-item sidebar-footer-nav-item" onClick={handleLogout} title="Sair">
            <LogOut size={20} />
            {!collapsed && <span>Sair</span>}
          </button>

          <button
            type="button"
            className="sidebar-collapse-button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="Recolher menu"
          >
            <ChevronLeft size={20} className={collapsed ? "rotate" : ""} />
          </button>
        </div>
      </aside>

      {showNewChatModal && (
        <div className="modal-overlay">
          <form className="modal-card" onSubmit={handleCreateChat}>
            <div className="modal-icon"><Sparkles size={22} /></div>
            <h2>Novo chat</h2>
            <p>Escolha um nome para encontrar essa conversa depois.</p>

            <input
              value={chatTitle}
              onChange={(event) => setChatTitle(event.target.value)}
              placeholder="Ex: Análise de vendas"
              autoFocus
            />

            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={closeNewChatModal} disabled={loading}>
                Cancelar
              </button>

              <button type="submit" className="modal-confirm" disabled={loading}>
                {loading ? "Criando..." : "Criar chat"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showNewDashboardModal && (
        <div className="modal-overlay">
          <form className="modal-card modal-card-wide" onSubmit={handleCreateDashboard}>
            <div className="modal-icon"><LayoutDashboard size={22} /></div>
            <h2>Novo dashboard</h2>
            <p>Envie uma planilha e descreva qual análise a IA deve gerar.</p>

            <label className="settings-label">
              Nome do dashboard
              <input
                value={dashboardTitle}
                onChange={(event) => setDashboardTitle(event.target.value)}
                placeholder="Ex: Vendas"
                autoFocus
              />
            </label>

            <label className="settings-label">
              Prompt da análise
              <textarea
                value={dashboardPrompt}
                onChange={(event) => setDashboardPrompt(event.target.value)}
                placeholder="Ex: Analise os produtos mais vendidos"
              />
            </label>

            <label className="settings-label">
              Arquivo
              <label className="custom-file-upload">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.json"
                  onChange={(event) => setDashboardFile(event.target.files[0])}
                />
                <UploadCloud size={18} />
                <span>{dashboardFile ? dashboardFile.name : "Selecionar arquivo"}</span>
              </label>
            </label>

            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={closeNewDashboardModal} disabled={loading}>
                Cancelar
              </button>

              <button type="submit" className="modal-confirm" disabled={loading}>
                {loading ? "Gerando..." : "Gerar dashboard"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteChatModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon modal-icon-danger"><Trash2 size={22} /></div>
            <h2>Excluir conversa</h2>
            <p>Tem certeza que deseja excluir esta conversa?</p>

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={cancelDeleteChat}>
                Cancelar
              </button>

              <button type="button" className="delete-confirm-button" onClick={confirmDeleteChat}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDashboardModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon modal-icon-danger"><Trash2 size={22} /></div>
            <h2>Excluir dashboard</h2>
            <p>Tem certeza que deseja excluir este dashboard?</p>

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={cancelDeleteDashboard}>
                Cancelar
              </button>

              <button type="button" className="delete-confirm-button" onClick={confirmDeleteDashboard}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
