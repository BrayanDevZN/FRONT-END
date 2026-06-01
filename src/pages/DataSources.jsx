import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Database,
  FileSpreadsheet,
  Plus,
  RefreshCcw,
  Trash2,
  UploadCloud,
} from "lucide-react";

import AppLayout from "../components/AppLayout";
import { getToken } from "../utils/storage";

import {
  createDataSource,
  getDataSource,
  getDataSources,
  updateDataSource,
  deleteDataSource,
} from "../api/dataSourceApi";

const ROWS_STEP = 25;

export default function DataSources() {
  const [dataSources, setDataSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [sourceName, setSourceName] = useState("");
  const [sourceFile, setSourceFile] = useState(null);
  const [updateFile, setUpdateFile] = useState(null);

  const [visibleRows, setVisibleRows] = useState(ROWS_STEP);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [error, setError] = useState("");

  async function loadDataSources() {
    try {
      setLoadingList(true);
      setError("");

      const token = getToken();
      const response = await getDataSources(token);

      const sources = response?.data_sources || [];
      setDataSources(sources);

      if (!selectedSource && sources.length > 0) {
        await openDataSource(sources[0].id);
      }
    } catch (err) {
      const message = err.message || "Erro ao buscar fontes de dados.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingList(false);
    }
  }

  async function openDataSource(dataSourceId) {
    try {
      setError("");
      setVisibleRows(ROWS_STEP);

      const token = getToken();
      const response = await getDataSource(token, dataSourceId);

      setSelectedSource(response?.data_source || null);
    } catch (err) {
      const message = err.message || "Erro ao abrir fonte de dados.";
      setError(message);
      toast.error(message);
    }
  }

  function closeCreateModal() {
    if (loadingCreate) return;

    setSourceName("");
    setSourceFile(null);
    setShowCreateModal(false);
  }

  function closeUpdateModal() {
    if (loadingUpdate) return;

    setUpdateFile(null);
    setShowUpdateModal(false);
  }

  async function handleCreateSource(event) {
    event.preventDefault();

    if (!sourceName.trim()) {
      toast.error("Digite o nome da fonte.");
      return;
    }

    if (!sourceFile) {
      toast.error("Selecione um arquivo.");
      return;
    }

    try {
      setLoadingCreate(true);
      setError("");

      const token = getToken();

      const response = await createDataSource({
        token,
        name: sourceName.trim(),
        file: sourceFile,
      });

      const createdSource = response?.data_source;

      toast.success("Fonte de dados criada com sucesso.");

      setSourceName("");
      setSourceFile(null);
      setShowCreateModal(false);

      await loadDataSources();

      if (createdSource?.id) {
        await openDataSource(createdSource.id);
      }
    } catch (err) {
      const message = err.message || "Erro ao criar fonte de dados.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleUpdateSource(event) {
    event.preventDefault();

    if (!selectedSource?.id) {
      toast.error("Selecione uma fonte primeiro.");
      return;
    }

    if (!updateFile) {
      toast.error("Selecione a nova planilha.");
      return;
    }

    try {
      setLoadingUpdate(true);
      setError("");

      const token = getToken();

      const response = await updateDataSource({
        token,
        data_source_id: selectedSource.id,
        file: updateFile,
      });

      const updatedSource = response?.data_source;

      toast.success("Fonte atualizada com sucesso.");

      setUpdateFile(null);
      setShowUpdateModal(false);

      await loadDataSources();

      if (updatedSource?.id) {
        await openDataSource(updatedSource.id);
      }
    } catch (err) {
      const message = err.message || "Erro ao atualizar fonte.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingUpdate(false);
    }
  }

  async function confirmDeleteSource() {
    if (!selectedSource?.id) return;

    try {
      setLoadingDelete(true);
      setError("");

      const token = getToken();

      await deleteDataSource(token, selectedSource.id);

      toast.success("Fonte excluída com sucesso.");

      setSelectedSource(null);
      setVisibleRows(ROWS_STEP);
      setShowDeleteModal(false);

      await loadDataSources();
    } catch (err) {
      const message = err.message || "Erro ao excluir fonte.";
      setError(message);
      toast.error(message);
    } finally {
      setLoadingDelete(false);
    }
  }

  function handleShowMoreRows() {
    setVisibleRows((currentValue) => currentValue + ROWS_STEP);
  }

  useEffect(() => {
    loadDataSources();
  }, []);

  useEffect(() => {
    setVisibleRows(ROWS_STEP);
  }, [selectedSource?.id]);

  const allRows = Array.isArray(selectedSource?.file_data)
    ? selectedSource.file_data
    : [];

  const previewRows = allRows.slice(0, visibleRows);

  const hasMoreRows = previewRows.length < allRows.length;

  const previewColumns =
    previewRows.length > 0 ? Object.keys(previewRows[0]) : [];

  return (
    <AppLayout>
      <main className="data-sources-page">
        <section className="data-sources-header">
          <div>
            <span className="data-sources-eyebrow">
              <Database size={18} />
              Fontes de Dados
            </span>

            <h1>Gerencie suas fontes de dados</h1>

            <p>
              Adicione planilhas, atualize arquivos existentes e reutilize as
              mesmas fontes para criar vários dashboards.
            </p>
          </div>

          <div className="data-sources-actions">
            <button
              type="button"
              className="data-source-secondary-button"
              onClick={() => setShowUpdateModal(true)}
              disabled={!selectedSource}
            >
              <RefreshCcw size={18} />
              Atualizar fonte
            </button>

            <button
              type="button"
              className="data-source-primary-button"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              Adicionar fonte
            </button>
          </div>
        </section>

        {error && <p className="error-message">{error}</p>}

        <section className="data-sources-layout">
          <aside className="data-sources-panel">
            <div className="data-sources-panel-top">
              <h2>Suas fontes</h2>
              <span>{dataSources.length}</span>
            </div>

            <div className="data-sources-list">
              {loadingList ? (
                <p className="data-source-empty">Carregando...</p>
              ) : dataSources.length === 0 ? (
                <p className="data-source-empty">
                  Nenhuma fonte cadastrada ainda.
                </p>
              ) : (
                dataSources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    className={`data-source-item ${
                      selectedSource?.id === source.id ? "is-active" : ""
                    }`}
                    onClick={() => openDataSource(source.id)}
                  >
                    <FileSpreadsheet size={18} />

                    <span>
                      <strong>{source.name}</strong>
                      <small>{source.file_name}</small>
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="data-source-content">
            {!selectedSource ? (
              <div className="data-source-empty-state">
                <Database size={46} />
                <h2>Selecione uma fonte</h2>
                <p>
                  Escolha uma fonte na lista ou adicione uma nova planilha para
                  começar.
                </p>
              </div>
            ) : (
              <>
                <div className="data-source-details-card">
                  <div>
                    <h2>{selectedSource.name}</h2>
                    <p>{selectedSource.file_name}</p>
                  </div>

                  <button
                    type="button"
                    className="data-source-danger-button"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 size={18} />
                    Excluir
                  </button>
                </div>

                <div className="data-source-stats">
                  <div>
                    <span>Linhas</span>
                    <strong>{selectedSource.row_count || 0}</strong>
                  </div>

                  <div>
                    <span>Colunas</span>
                    <strong>{selectedSource.column_count || 0}</strong>
                  </div>

                  <div>
                    <span>Arquivo</span>
                    <strong>{selectedSource.file_name}</strong>
                  </div>
                </div>

                <div className="data-source-preview-card">
                  <div className="data-source-preview-header">
                    <h3>Prévia dos dados</h3>
                    <span>
                      Mostrando {previewRows.length} de {allRows.length} linhas
                    </span>
                  </div>

                  {previewRows.length === 0 ? (
                    <p className="data-source-empty">
                      Nenhum dado disponível para visualização.
                    </p>
                  ) : (
                    <>
                      <div className="data-source-table-scroll">
                        <table className="data-source-table">
                          <thead>
                            <tr>
                              {previewColumns.map((column) => (
                                <th key={column}>{column}</th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {previewRows.map((row, index) => (
                              <tr key={index}>
                                {previewColumns.map((column) => (
                                  <td key={column}>
                                    {row[column] === null ||
                                    row[column] === undefined
                                      ? "-"
                                      : String(row[column])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {hasMoreRows && (
                        <div className="data-source-load-more">
                          <button
                            type="button"
                            onClick={handleShowMoreRows}
                          >
                            Ver mais
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </section>
        </section>

        {showCreateModal && (
          <div className="modal-overlay">
            <form
              className="modal-card modal-card-wide"
              onSubmit={handleCreateSource}
            >
              <div className="modal-icon">
                <UploadCloud size={22} />
              </div>

              <h2>Adicionar fonte</h2>
              <p>Escolha um nome e envie uma planilha para salvar como fonte.</p>

              <label className="settings-label">
                Nome da fonte
                <input
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  placeholder="Ex: Marketing 2026"
                  autoFocus
                />
              </label>

              <label className="settings-label">
                Arquivo
                <label className="custom-file-upload">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={(event) => setSourceFile(event.target.files[0])}
                  />
                  <UploadCloud size={18} />
                  <span>
                    {sourceFile ? sourceFile.name : "Selecionar arquivo"}
                  </span>
                </label>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeCreateModal}
                  disabled={loadingCreate}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="modal-confirm"
                  disabled={loadingCreate}
                >
                  {loadingCreate ? "Salvando..." : "Salvar fonte"}
                </button>
              </div>
            </form>
          </div>
        )}

        {showUpdateModal && (
          <div className="modal-overlay">
            <form
              className="modal-card modal-card-wide"
              onSubmit={handleUpdateSource}
            >
              <div className="modal-icon">
                <RefreshCcw size={22} />
              </div>

              <h2>Atualizar fonte</h2>

              <p>
                Envie uma nova planilha para substituir os dados de{" "}
                <strong>{selectedSource?.name}</strong>.
              </p>

              <label className="settings-label">
                Nova planilha
                <label className="custom-file-upload">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={(event) => setUpdateFile(event.target.files[0])}
                  />
                  <UploadCloud size={18} />
                  <span>
                    {updateFile ? updateFile.name : "Selecionar arquivo"}
                  </span>
                </label>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={closeUpdateModal}
                  disabled={loadingUpdate}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="modal-confirm"
                  disabled={loadingUpdate}
                >
                  {loadingUpdate ? "Atualizando..." : "Atualizar fonte"}
                </button>
              </div>
            </form>
          </div>
        )}

        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-icon modal-icon-danger">
                <Trash2 size={22} />
              </div>

              <h2>Excluir fonte</h2>

              <p>
                Tem certeza que deseja excluir{" "}
                <strong>{selectedSource?.name}</strong>?
              </p>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loadingDelete}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="delete-confirm-button"
                  onClick={confirmDeleteSource}
                  disabled={loadingDelete}
                >
                  {loadingDelete ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
