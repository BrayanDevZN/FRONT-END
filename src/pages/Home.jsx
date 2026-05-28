import AppLayout from "../components/AppLayout";

export default function Home() {
  return (
    <AppLayout>
      <div className="home-page">
        <div className="home-header">
          <h1>Olá 👋</h1>
          <p>O que deseja analisar hoje?</p>
        </div>

        <div className="home-cards">
          <div className="home-card">
            <h3>📊 Analisar arquivo</h3>
            <p>Envie CSV, XLSX ou JSON para análise com IA.</p>
          </div>

          <div className="home-card">
            <h3>💬 Novo chat</h3>
            <p>Inicie uma nova conversa com o agente.</p>
          </div>

          <div className="home-card">
            <h3>📈 Dashboards</h3>
            <p>Visualize dashboards criados anteriormente.</p>
          </div>

          <div className="home-card">
            <h3>⚙ Configurações</h3>
            <p>Gerencie conta, senha e preferências.</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}