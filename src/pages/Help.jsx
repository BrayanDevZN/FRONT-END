import {
  CircleHelp,
  BarChart3,
  Upload,
  Palette,
  Save,
  FileDown,
  MessageCircle,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";

import AppLayout from "../components/AppLayout";

export default function Help() {
  return (
    <AppLayout>
      <main className="help-page">
        <section className="help-hero">
          <div className="help-icon">
            <CircleHelp size={34} />
          </div>

          <div>
            <h1>Ajuda</h1>
            <p>
              Entenda como usar o DataPilot AI para transformar arquivos de
              dados em dashboards, gráficos e análises inteligentes.
            </p>
          </div>
        </section>

        <section className="help-grid">
          <article className="help-card">
            <BarChart3 size={26} />
            <h2>O que é o DataPilot AI?</h2>
            <p>
              O DataPilot AI é uma plataforma criada para facilitar a análise de
              dados. O usuário envia uma planilha, faz uma pergunta e o sistema
              gera uma análise com gráfico, resumo e recomendações.
            </p>
            <p>
              A ideia é permitir que pessoas sem conhecimento técnico consigam
              entender informações importantes de forma visual e simples.
            </p>
          </article>

          <article className="help-card">
            <Upload size={26} />
            <h2>Como criar um dashboard</h2>
            <ol>
              <li>Clique em <strong>Novo dashboard</strong> na barra lateral.</li>
              <li>Digite um nome para identificar o dashboard.</li>
              <li>Escreva o que você quer analisar.</li>
              <li>Anexe um arquivo CSV, XLSX ou JSON.</li>
              <li>Clique em gerar e aguarde a análise.</li>
            </ol>
          </article>

          <article className="help-card">
            <Lightbulb size={26} />
            <h2>Como escrever um bom pedido</h2>
            <p>
              Quanto mais claro for o pedido, melhor será a análise. Em vez de
              escrever apenas “analise isso”, tente explicar o objetivo.
            </p>
            <div className="help-example">
              <strong>Exemplo:</strong>
              <span>
                Analise as campanhas com maior ROI, compare os canais de
                marketing e mostre quais regiões geraram mais receita.
              </span>
            </div>
          </article>

          <article className="help-card">
            <BarChart3 size={26} />
            <h2>Como interpretar os gráficos</h2>
            <p>
              Os gráficos ajudam a visualizar padrões nos dados. Gráficos de
              barras são usados para comparação, linhas para evolução no tempo,
              pizza para proporções e dispersão para relação entre variáveis.
            </p>
            <p>
              Abaixo do gráfico, a IA apresenta uma análise textual explicando
              os principais pontos encontrados.
            </p>
          </article>

          <article className="help-card">
            <Palette size={26} />
            <h2>Personalização visual</h2>
            <p>
              Você pode alterar a cor do gráfico, fundo, textos dos eixos,
              traços e estilo das barras. Isso ajuda a deixar o dashboard mais
              claro e adaptado ao tipo de apresentação.
            </p>
          </article>

          <article className="help-card">
            <Save size={26} />
            <h2>Salvar configurações</h2>
            <p>
              Depois de personalizar o gráfico, clique em <strong>Salvar</strong>.
              Assim, quando você abrir o dashboard novamente, as cores e estilos
              escolhidos serão carregados automaticamente.
            </p>
          </article>

          <article className="help-card">
            <FileDown size={26} />
            <h2>Exportar PDF</h2>
            <p>
              O botão de exportação permite baixar o dashboard em PDF, incluindo
              o gráfico e a análise da IA. Isso é útil para trabalhos,
              apresentações e relatórios.
            </p>
          </article>

          <article className="help-card">
            <MessageCircle size={26} />
            <h2>Como usar os chats</h2>
            <p>
              A área de chat serve para conversas e perguntas gerais. Ela pode
              ser usada para tirar dúvidas, pedir explicações ou discutir ideias
              relacionadas aos dados.
            </p>
          </article>

          <article className="help-card help-warning">
            <AlertTriangle size={26} />
            <h2>Limitações importantes</h2>
            <p>
              A qualidade da análise depende da qualidade dos dados enviados.
              Arquivos incompletos, colunas mal nomeadas ou dados muito
              bagunçados podem gerar análises menos precisas.
            </p>
            <p>
              Sempre revise os resultados antes de usar em decisões importantes.
              IA ajuda bastante, mas ainda não é mágica, infelizmente.
            </p>
          </article>
        </section>
      </main>
    </AppLayout>
  );
}