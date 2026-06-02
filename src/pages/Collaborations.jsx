import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search, Share2, Trash2, UsersRound } from "lucide-react";

import AppLayout from "../components/AppLayout";
import Loading from "../components/Loading";
import ProfileAvatar from "../components/ProfileAvatar";
import {
  deleteCollaboration,
  getCollaborationOverview,
  getDashboardCollaborators,
  searchUsers,
  shareDashboard,
  updateCollaboration,
} from "../api/collaborationApi";
import { getToken } from "../utils/storage";

const PERMISSIONS = [
  { value: "read", label: "Somente leitura", description: "Pode visualizar o dashboard." },
  { value: "edit", label: "Pode editar", description: "Também pode ajustar a aparência dos gráficos." },
  { value: "full", label: "Acesso geral", description: "Pode atualizar a análise e editar a fonte de dados." },
];

export default function Collaborations() {
  const [dashboards, setDashboards] = useState([]);
  const [sharedDashboards, setSharedDashboards] = useState([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permission, setPermission] = useState("read");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadOverview() {
    const response = await getCollaborationOverview(getToken());
    const owned = response?.dashboards || [];
    setDashboards(owned);
    setSharedDashboards(response?.shared_dashboards || []);
    setSelectedDashboardId((current) => current || String(owned[0]?.id || ""));
  }

  async function loadCollaborators(dashboardId) {
    if (!dashboardId) return setCollaborators([]);
    const response = await getDashboardCollaborators(getToken(), dashboardId);
    setCollaborators(response?.collaborators || []);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadOverview()
        .catch((err) => toast.error(err.message))
        .finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadCollaborators(selectedDashboardId).catch((err) => toast.error(err.message));
    }, 0);
    return () => clearTimeout(timeout);
  }, [selectedDashboardId]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const timeout = setTimeout(() => {
      searchUsers(getToken(), trimmed)
        .then((response) => setUsers(response?.users || []))
        .catch((err) => toast.error(err.message));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  async function handleShare(event) {
    event.preventDefault();
    if (!selectedDashboardId || !selectedUser) return;
    try {
      setSaving(true);
      await shareDashboard({
        token: getToken(),
        dashboard_id: selectedDashboardId,
        username: selectedUser.username,
        permission,
      });
      await loadCollaborators(selectedDashboardId);
      setQuery("");
      setUsers([]);
      setSelectedUser(null);
      toast.success("Dashboard compartilhado com sucesso.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePermission(collaborationId, nextPermission) {
    try {
      await updateCollaboration({ token: getToken(), collaboration_id: collaborationId, permission: nextPermission });
      await loadCollaborators(selectedDashboardId);
      toast.success("Permissão atualizada.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRemove(collaborationId) {
    try {
      await deleteCollaboration(getToken(), collaborationId);
      await loadCollaborators(selectedDashboardId);
      toast.success("Acesso removido.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <AppLayout>
      <main className="collaborations-page">
        <section className="collaborations-hero">
          <div>
            <span><UsersRound size={17} /> Colaborações</span>
            <h1>Compartilhe análises com sua equipe</h1>
            <p>Encontre pessoas pelo nome de usuário e escolha exatamente o que elas podem fazer.</p>
          </div>
          <Share2 size={42} />
        </section>

        {loading ? <Loading label="Carregando colaborações" /> : (
          <section className="collaborations-grid">
            <div className="collaboration-card">
              <h2>Novo compartilhamento</h2>
              <form onSubmit={handleShare}>
                <label>Dashboard
                  <select value={selectedDashboardId} onChange={(event) => setSelectedDashboardId(event.target.value)}>
                    <option value="">Selecione um dashboard</option>
                    {dashboards.map((dashboard) => <option key={dashboard.id} value={dashboard.id}>{dashboard.title}</option>)}
                  </select>
                </label>
                <label>Buscar por nome de usuário
                  <div className="collaboration-search"><Search size={17} /><input value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setSelectedUser(null); if (value.trim().length < 2) setUsers([]); }} placeholder="@usuario" /></div>
                </label>
                {users.length > 0 && !selectedUser && <div className="collaboration-results">
                  {users.map((user) => <button type="button" key={user.user_id} onClick={() => { setSelectedUser(user); setQuery(user.username); setUsers([]); }}>
                    <ProfileAvatar image={user.profile_image} name={user.name} /><span><strong>@{user.username}</strong><small>{user.name}</small></span>
                  </button>)}
                </div>}
                <div className="permission-grid">
                  {PERMISSIONS.map((item) => <button type="button" key={item.value} className={permission === item.value ? "is-active" : ""} onClick={() => setPermission(item.value)}>
                    <strong>{item.label}</strong><small>{item.description}</small>
                  </button>)}
                </div>
                <button className="collaboration-primary" disabled={saving || !selectedUser || !selectedDashboardId}>
                  <Share2 size={17} /> {saving ? "Compartilhando..." : "Compartilhar dashboard"}
                </button>
              </form>
            </div>

            <div className="collaboration-card">
              <h2>Pessoas com acesso</h2>
              {collaborators.length === 0 ? <p className="collaboration-empty">Esse dashboard ainda não foi compartilhado.</p> : collaborators.map((person) => (
                <div className="collaborator-row" key={person.id}>
                  <ProfileAvatar image={person.profile_image} name={person.name} />
                  <span><strong>@{person.username}</strong><small>{person.name}</small></span>
                  <select value={person.permission} onChange={(event) => handlePermission(person.id, event.target.value)}>
                    {PERMISSIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <button type="button" onClick={() => handleRemove(person.id)}><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="collaboration-card shared-overview">
          <h2>Compartilhados comigo</h2>
          {sharedDashboards.length === 0 ? <p className="collaboration-empty">Nenhum dashboard compartilhado com você ainda.</p> : sharedDashboards.map((dashboard) => (
            <div className="collaborator-row" key={dashboard.id}>
              <ProfileAvatar image={dashboard.creator_profile_image} name={dashboard.creator_name} />
              <span><strong>{dashboard.title}</strong><small>Criado por @{dashboard.creator_username}</small></span>
              <em>{PERMISSIONS.find((item) => item.value === dashboard.access_permission)?.label}</em>
            </div>
          ))}
        </section>
      </main>
    </AppLayout>
  );
}
