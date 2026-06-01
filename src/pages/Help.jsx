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
  Database,
  RefreshCcw,
  Link,
  FileSpreadsheet,
  Bot,
  CheckCircle2,
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
              Aprenda como usar o DataPilot AI para transformar planilhas em
              fontes de dados, dashboards, gráficos, análises e conversas com IA.
            </p>
          </div>
        </section>

        <section className="help-grid">
          <article className="help-card">
            <BarChart3 size={26} />
            <h2>O que é o DataPilot AI?</h2>
            <p>
              O DataPilot AI é uma plataforma de análise de dados. Você cadastra
              uma fonte de dados, cria dashboards a partir dela e a IA gera
              gráficos, interpretações e recomendações.
            </p>
            <p>
              A ideia é ajudar pessoas que não dominam BI, Excel avançado ou
              programação a entenderem melhor seus dados de forma visual.
            </p>
          </article>

          <article className="help-card">
            <Database size={26} />
            <h2>O que são fontes de dados?</h2>
            <p>
              Fontes de dados são os arquivos que alimentam seus dashboards.
              Elas podem ser planilhas CSV, XLSX, XLS ou arquivos JSON.
            </p>
            <p>
              Em vez de enviar o mesmo arquivo toda vez, você salva uma fonte
              uma única vez e pode reutilizá-la em vários dashboards diferentes.
            </p>
          </article>

          <article className="help-card">
            <FileSpreadsheet size={26} />
            <h2>Como adicionar uma fonte</h2>
            <ol>
              <li>Clique em <strong>Fontes de Dados</strong>.</li>
              <li>Clique em <strong>Adicionar fonte</strong>.</li>
              <li>Dê um nome para identificar a fonte.</li>
              <li>Envie um arquivo CSV, XLSX, XLS ou JSON.</li>
              <li>Confira a prévia dos dados antes de criar dashboards.</li>
            </ol>
          </article>

          <article className="help-card">
            <RefreshCcw size={26} />
            <h2>Como atualizar uma fonte</h2>
            <p>
              Quando os dados mudarem, você pode atualizar a fonte enviando uma
              nova planilha. Isso substitui os dados antigos pelos novos.
            </p>
            <p>
              Se a fonte estiver ligada a dashboards, o sistema mostra quais
              dashboards dependem dela e pergunta se você deseja atualizar todos.
            </p>
          </article>

          <article className="help-card">
            <Link size={26} />
            <h2>Dashboards vinculados</h2>
            <p>
              Um dashboard pode estar ligado a uma fonte de dados. Isso permite
              que ele seja recriado automaticamente quando a fonte for atualizada.
            </p>
            <p>
              Ao escolher <strong>Atualizar tudo</strong>, o DataPilot usa o
              mesmo prompt salvo no dashboard para gerar novos gráficos e uma
              nova análise com os dados atualizados.
            </p>
          </article>

          <article className="help-card">
            <Upload size={26} />
            <h2>Como criar um dashboard</h2>
            <ol>
              <li>Clique em <strong>Novo dashboard</strong>.</li>
              <li>Digite um nome para o dashboard.</li>
              <li>Escolha uma fonte de dados cadastrada.</li>
              <li>Escreva o que você quer analisar.</li>
              <li>Clique em gerar e aguarde a análise da IA.</li>
            </ol>
          </article>

          <article className="help-card">
            <Lightbulb size={26} />
            <h2>Como escrever um bom pedido</h2>
            <p>
              Quanto mais específico for o pedido, melhor será o resultado. Evite
              escrever apenas “analise isso”. Explique o objetivo da análise.
            </p>

            <div className="help-example">
              <strong>Exemplo bom:</strong>
              <span>
                Analise quais canais geraram mais receita, compare o ROI das
                campanhas e mostre os produtos com melhor desempenho.
              </span>
            </div>
          </article>

          <article className="help-card">
            <BarChart3 size={26} />
            <h2>Como interpretar os gráficos</h2>
            <p>
              Barras servem para comparar categorias. Linhas mostram evolução no
              tempo. Pizza mostra proporções. Dispersão ajuda a observar relação
              entre duas variáveis numéricas.
            </p>
            <p>
              Abaixo dos gráficos, a IA apresenta uma análise textual explicando
              os principais padrões encontrados.
            </p>
          </article>

          <article className="help-card">
            <Palette size={26} />
            <h2>Personalização visual</h2>
            <p>
              Você pode alterar cor do gráfico, fundo, textos dos eixos, traços
              e estilo das barras. Isso ajuda a deixar o dashboard mais claro
              para apresentações, relatórios ou trabalhos.
            </p>
          </article>

          <article className="help-card">
            <Save size={26} />
            <h2>Salvar configurações</h2>
            <p>
              Depois de personalizar um gráfico, clique em <strong>Salvar</strong>.
              Assim, quando você abrir o dashboard novamente, as cores e estilos
              escolhidos serão carregados automaticamente.
            </p>
          </article>

          <article className="help-card">
            <RefreshCcw size={26} />
            <h2>Atualizar dashboard</h2>
            <p>
              O botão <strong>Atualizar</strong> refaz a análise do dashboard
              usando a mesma fonte de dados e o mesmo prompt salvo.
            </p>
            <p>
              Use isso quando quiser gerar gráficos e insights novamente sem
              criar outro dashboard do zero.
            </p>
          </article>

          <article className="help-card">
            <FileDown size={26} />
            <h2>Exportar PDF</h2>
            <p>
              O botão de exportação baixa o dashboard em PDF, incluindo gráficos
              e análise da IA. Isso é útil para trabalhos, apresentações e
              relatórios.
            </p>
          </article>

          <article className="help-card">
            <MessageCircle size={26} />
            <h2>Como usar os chats</h2>
            <p>
              A área de chat serve para conversas gerais com a IA. Você pode
              pedir explicações, tirar dúvidas, discutir ideias ou entender
              conceitos relacionados aos dados.
            </p>
            <p>
              O chat não substitui o dashboard. Ele é melhor para perguntas e
              explicações. O dashboard é melhor para análise visual de dados.
            </p>
          </article>

          <article className="help-card">
            <Bot size={26} />
            <h2>O que a IA faz?</h2>
            <p>
              A IA interpreta o pedido do usuário, escolhe métricas, sugere
              gráficos e gera uma análise textual com base nos dados disponíveis.
            </p>
            <p>
              Ela não deve inventar dados. Se uma coluna não existir ou estiver
              mal preenchida, a análise pode ficar limitada.
            </p>
          </article>

          <article className="help-card">
            <CheckCircle2 size={26} />
            <h2>Boas práticas</h2>
            <ul>
              <li>Use nomes de colunas claros, como Receita, Produto e Data.</li>
              <li>Evite planilhas com células mescladas.</li>
              <li>Remova linhas totalmente vazias.</li>
              <li>Prefira datas em formato consistente.</li>
              <li>Revise os gráficos antes de tomar decisões.</li>
            </ul>
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
              IA ajuda bastante, mas ainda não é mágica, infelizmente. Se fosse,
              planilha bagunçada já teria sido extinta.
            </p>
          </article>
        </section>
      </main>
    </AppLayout>
  );
}