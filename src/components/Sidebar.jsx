import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronLeft,
  CircleHelp,
  Database,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Plus,
  Settings,
  Sparkles,
  Trash2,
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

import { getDataSources } from "../api/dataSourceApi";
import { getToken, removeToken } from "../utils/storage";

export default function SidebarWithDataSources() {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [dashboardSources, setDashboardSources] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatTitle, setChatTitle] = useState("");

  const [showNewDashboardModal, setShowNewDashboardModal] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState("");
  const [dashboardPrompt, setDashboardPrompt] = useState("");
  const [selectedDataSourceId, setSelectedDataSourceId] = useState("");

  const [modalError, setModalError] = useState("");

  const [openChatMenuId, setOpenChatMenuId] = useState(null);
  const [openDashboardMenuId, setOpenDashboardMenuId] = useState(null);

  const [popoverPosition, setPopoverPosition] = useState({
    top: 0,
    left: 0,
  });

  const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  const [showDeleteDashboardModal, setShowDeleteDashboardModal] =
    useState(false);
  const [dashboardToDelete, setDashboardToDelete] = useState(null);

  const activeArea = useMemo(() => {
    if (location.pathname.startsWith("/home")) return "inicio";
    if (location.pathname.startsWith("/dashboards")) return "dashboards";
    if (location.pathname.startsWith("/chat")) return "ia";
    if (location.pathname.startsWith("/data-sources")) return "data-sources";
    if (location.pathname.startsWith("/help")) return "help";
    if (location.pathname.startsWith("/settings")) return "settings";
    return "inicio";
  }, [location.pathname]);

  function getConversationId(conversation) {
    return conversation.conversation_id || conversation.id;
  }

  function closeSidebarMenus() {
    setOpenChatMenuId(null);
    setOpenDashboardMenuId(null);
  }

  function goToChat(id, title) {
    closeSidebarMenus();
    navigate(`/chat/${id}`, { state: { title } });
  }

  function goToHome() {
    closeSidebarMenus();
    navigate("/home");
  }

  function goToDashboard(id) {
    closeSidebarMenus();
    navigate(`/dashboards?dashboard_id=${id}`);
  }

  function goToDataSources() {
    setShowNewDashboardModal(false);
    setModalError("");
    navigate("/data-sources");
  }

  async function loadConversations() {
    try {
      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await getConversations(token);
      const data = Array.isArray(response)
        ? response
        : response?.conversations || [];

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

  async function loadDashboardSources() {
    try {
      const token = getToken();

      if (!token) {
        navigate("/");
        return;
      }

      const response = await getDataSources(token);
      const sources = response?.data_sources || [];

      setDashboardSources(sources);

      if (sources.length > 0) {
        setSelectedDataSourceId(String(sources[0].id));
      }
    } catch (err) {
      console.error("Erro ao carregar fontes de dados:", err);
      setDashboardSources([]);
      setSelectedDataSourceId("");
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
    setSelectedDataSourceId("");
    setModalError("");
    setShowNewDashboardModal(true);
    loadDashboardSources();
  }

  function closeNewDashboardModal() {
    if (loading) return;

    setDashboardTitle("");
    setDashboardPrompt("");
    setSelectedDataSourceId("");
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
      const conversationId =
        response?.conversation_id ||
        response?.id ||
        response?.data?.conversation_id;

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

    if (!selectedDataSourceId) {
      setModalError("Selecione uma fonte de dados.");
      return;
    }

    if (!prompt) {
      setModalError("Digite o prompt da análise.");
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
        data_source_id: Number(selectedDataSourceId),
      });

      const createdDashboard = response?.dashboard;

      await loadDashboards();

      setDashboardTitle("");
      setDashboardPrompt("");
      setSelectedDataSourceId("");
      setShowNewDashboardModal(false);

      if (createdDashboard?.id) {
        goToDashboard(createdDashboard.id);
      } else {
        navigate("/dashboards");
      }
    } catch (err) {
      console.error("Erro ao criar dashboard:", err);

      setModalError(
        "A análise está demorando. Verificando se o dashboard foi criado..."
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 4000));

        const token = getToken();

        if (token) {
          const response = await getDashboards(token);
          const updatedDashboards = response?.dashboards || [];

          setDashboards(updatedDashboards);

          const createdDashboard = updatedDashboards.find(
            (dashboard) =>
              dashboard.title?.trim().toLowerCase() === title.toLowerCase()
          );

          if (createdDashboard?.id) {
            setDashboardTitle("");
            setDashboardPrompt("");
            setSelectedDataSourceId("");
            setShowNewDashboardModal(false);
            setModalError("");

            goToDashboard(createdDashboard.id);
            return;
          }
        }
      } catch (refreshError) {
        console.error("Erro ao verificar dashboard criado:", refreshError);
      }

      setModalError(
        "A análise pode ter sido concluída. Atualize a página ou confira a lista de dashboards."
      );
    } finally {
      setLoading(false);
    }
  }

  function calculatePopoverPosition(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 136;
    const gap = 8;
    const viewportWidth = window.innerWidth;

    let left = rect.right + gap;

    if (left + menuWidth > viewportWidth - 12) {
      left = rect.left - menuWidth - gap;
    }

    return {
      top: rect.top + rect.height / 2,
      left,
    };
  }

  function toggleDashboardMenu(event, dashboardId) {
    event.stopPropagation();

    setOpenChatMenuId(null);

    if (openDashboardMenuId === dashboardId) {
      setOpenDashboardMenuId(null);
      return;
    }

    setPopoverPosition(calculatePopoverPosition(event));
    setOpenDashboardMenuId(dashboardId);
  }

  function toggleChatMenu(event, chatId) {
    event.stopPropagation();

    setOpenDashboardMenuId(null);

    if (openChatMenuId === chatId) {
      setOpenChatMenuId(null);
      return;
    }

    setPopoverPosition(calculatePopoverPosition(event));
    setOpenChatMenuId(chatId);
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
        prev.filter(
          (conversation) =>
            Number(getConversationId(conversation)) !==
            Number(conversationToDelete)
        )
      );

      if (window.location.pathname === `/chat/${conversationToDelete}`) {
        navigate("/home");
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
        prev.filter(
          (dashboard) => Number(dashboard.id) !== Number(dashboardToDelete)
        )
      );

      setDashboardToDelete(null);
      setShowDeleteDashboardModal(false);

      if (window.location.pathname.startsWith("/dashboards")) {
        navigate("/home");
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

  useEffect(() => {
    function handleOpenChatModal() {
      setChatTitle("");
      setModalError("");
      setShowNewChatModal(true);
    }

    function handleOpenDashboardModal() {
      openNewDashboardModal();
    }

    window.addEventListener("open-chat-modal", handleOpenChatModal);
    window.addEventListener("open-dashboard-modal", handleOpenDashboardModal);

    return () => {
      window.removeEventListener("open-chat-modal", handleOpenChatModal);
      window.removeEventListener(
        "open-dashboard-modal",
        handleOpenDashboardModal
      );
    };
  }, []);

  useEffect(() => {
    function handleClosePopover() {
      closeSidebarMenus();
    }

    window.addEventListener("click", handleClosePopover);
    window.addEventListener("scroll", handleClosePopover, true);
    window.addEventListener("resize", handleClosePopover);

    return () => {
      window.removeEventListener("click", handleClosePopover);
      window.removeEventListener("scroll", handleClosePopover, true);
      window.removeEventListener("resize", handleClosePopover);
    };
  }, []);

  return (
    <>
      <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <button
              type="button"
              className="sidebar-logo-button"
              onClick={goToHome}
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
              className={`sidebar-nav-item ${
                activeArea === "inicio" ? "is-active" : ""
              }`}
              onClick={goToHome}
              title="Início"
            >
              <Home size={20} />
              {!collapsed && <span>Início</span>}
            </button>

            <button
              type="button"
              className={`sidebar-nav-item ${
                activeArea === "data-sources" ? "is-active" : ""
              }`}
              onClick={() => navigate("/data-sources")}
              title="Fontes de Dados"
            >
              <Database size={20} />
              {!collapsed && <span>Fontes de Dados</span>}
            </button>
          </nav>

          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>{collapsed ? "Dash" : "Dashboards"}</span>
              {!collapsed && (
                <button
                  type="button"
                  onClick={openNewDashboardModal}
                  disabled={loading}
                >
                  <Plus size={15} />
                </button>
              )}
            </div>

            <div className="sidebar-list">
              {dashboards.length === 0 ? (
                !collapsed && (
                  <p className="sidebar-empty">Nenhum dashboard ainda.</p>
                )
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
                        onClick={(event) =>
                          toggleDashboardMenu(event, dashboard.id)
                        }
                      >
                        ⋯
                      </button>
                    )}

                    {openDashboardMenuId === dashboard.id && (
                      <div
                        className="sidebar-popover-menu"
                        onClick={(event) => event.stopPropagation()}
                        style={{
                          top: `${popoverPosition.top}px`,
                          left: `${popoverPosition.left}px`,
                        }}
                      >
                        <button
                          type="button"
                          onClick={(event) =>
                            handleDeleteDashboard(event, dashboard.id)
                          }
                        >
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
                <button
                  type="button"
                  onClick={openNewChatModal}
                  disabled={loading}
                >
                  <Plus size={15} />
                </button>
              )}
            </div>

            <div className="sidebar-list">
              {conversations.length === 0 ? (
                !collapsed && (
                  <p className="sidebar-empty">Nenhuma conversa ainda.</p>
                )
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
                          onClick={(event) => toggleChatMenu(event, id)}
                        >
                          ⋯
                        </button>
                      )}

                      {openChatMenuId === id && (
                        <div
                          className="sidebar-popover-menu"
                          onClick={(event) => event.stopPropagation()}
                          style={{
                            top: `${popoverPosition.top}px`,
                            left: `${popoverPosition.left}px`,
                          }}
                        >
                          <button
                            type="button"
                            onClick={(event) => handleDeleteChat(event, id)}
                          >
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
          <button
            type="button"
            className={`sidebar-nav-item sidebar-footer-nav-item ${
              activeArea === "help" ? "is-active" : ""
            }`}
            onClick={() => navigate("/help")}
            title="Ajuda"
          >
            <CircleHelp size={20} />
            {!collapsed && <span>Ajuda</span>}
          </button>

          <button
            type="button"
            className={`sidebar-nav-item sidebar-footer-nav-item ${
              activeArea === "settings" ? "is-active" : ""
            }`}
            onClick={() => navigate("/settings")}
            title="Configurações"
          >
            <Settings size={20} />
            {!collapsed && <span>Configurações</span>}
          </button>

          <button
            type="button"
            className="sidebar-nav-item sidebar-footer-nav-item"
            onClick={handleLogout}
            title="Sair"
          >
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
            <div className="modal-icon">
              <Sparkles size={22} />
            </div>

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
              <button
                type="button"
                className="modal-cancel"
                onClick={closeNewChatModal}
                disabled={loading}
              >
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
          <form
            className="modal-card modal-card-wide"
            onSubmit={handleCreateDashboard}
          >
            <div className="modal-icon">
              <LayoutDashboard size={22} />
            </div>

            <h2>Novo dashboard</h2>
            <p>Escolha uma fonte de dados e descreva qual análise a IA deve gerar.</p>

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
              Fonte de dados

              <div className="dashboard-source-picker">
                {dashboardSources.length === 0 ? (
                  <div className="dashboard-source-empty">
                    <Database size={24} />

                    <span>Nenhuma fonte cadastrada ainda.</span>

                    <button type="button" onClick={goToDataSources}>
                      <Plus size={16} />
                      Criar nova fonte
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="dashboard-source-list">
                      {dashboardSources.map((source) => (
                        <button
                          key={source.id}
                          type="button"
                          className={`dashboard-source-option ${
                            Number(selectedDataSourceId) === Number(source.id)
                              ? "is-selected"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedDataSourceId(String(source.id))
                          }
                        >
                          <Database size={18} />

                          <span>
                            <strong>{source.name}</strong>
                            <small>
                              {source.row_count || 0} linhas •{" "}
                              {source.column_count || 0} colunas
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="dashboard-source-add-button"
                      onClick={goToDataSources}
                    >
                      <Plus size={16} />
                      Adicionar nova fonte
                    </button>
                  </>
                )}
              </div>
            </label>

            <label className="settings-label">
              Prompt da análise
              <textarea
                value={dashboardPrompt}
                onChange={(event) => setDashboardPrompt(event.target.value)}
                placeholder="Ex: Analise os produtos mais vendidos"
              />
            </label>

            {modalError && <p className="modal-error">{modalError}</p>}

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={closeNewDashboardModal}
                disabled={loading}
              >
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
            <div className="modal-icon modal-icon-danger">
              <Trash2 size={22} />
            </div>

            <h2>Excluir conversa</h2>
            <p>Tem certeza que deseja excluir esta conversa?</p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={cancelDeleteChat}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDeleteChat}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDashboardModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon modal-icon-danger">
              <Trash2 size={22} />
            </div>

            <h2>Excluir dashboard</h2>
            <p>Tem certeza que deseja excluir este dashboard?</p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={cancelDeleteDashboard}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDeleteDashboard}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
