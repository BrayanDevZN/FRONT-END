import { useEffect, useState } from "react";

import {
  BarChart3,
  Bot,
  Database,
  FileText,
  Lightbulb,
  MessageSquareText,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
  X,
  ZoomIn,
} from "lucide-react";

import AppLayout from "../components/AppLayout";

const TEAM_TIERS = [
  {
    key: "direcao",
    label: "Nível 01",
    title: "Direção e visão do produto",
    description:
      "Responsável por manter o DataPilot AI alinhado ao problema real: transformar dados financeiros em decisões simples, rápidas e inteligentes.",
    members: [
      {
        name: "Eduardo Rodrigues",
        role: "Product Owner & Líder do Projeto",
        image: "/team/eduardo-rodrigues.jpeg",
        icon: Sparkles,
        summary:
          "Conduz a visão do produto, prioriza funcionalidades, conecta tecnologia com necessidade de negócio e valida a entrega final da plataforma.",
        tags: ["Estratégia", "Produto", "IA aplicada"],
        featured: true,
      },
      {
        name: "Brayan de Souza",
        role: "Líder Back-end & Integrações",
        image: "/team/brayan-de-souza.jpeg",
        icon: Bot,
        summary:
          "Lidera a base técnica, integrações, estrutura de APIs e conexão entre dados carregados e recursos inteligentes do sistema.",
        tags: ["APIs", "Banco de dados", "Integrações"],
        featured: true,
      },
    ],
  },
  {
    key: "estrategia",
    label: "Nível 02",
    title: "Estratégia, experiência e inteligência de dados",
    description:
      "Camada que traduz a proposta do sistema em jornadas, indicadores e regras financeiras bem estruturadas.",
    members: [
      {
        name: "Kammilly Vitória",
        role: "UX/UI Lead",
        image: "/team/kammilly-vitoria.jpg",
        icon: Lightbulb,
        summary:
          "Cuida da experiência visual, fluxos de navegação, clareza das telas e consistência estética para que o sistema seja fácil de usar.",
        tags: ["Interface", "Jornada", "Usabilidade"],
      },
      {
        name: "Vitor Augusto",
        role: "Lead de Business Intelligence",
        image: "/team/vitor-augusto.jpg",
        icon: BarChart3,
        summary:
          "Define indicadores, organiza a leitura dos dashboards e ajuda a transformar planilhas em métricas compreensíveis.",
        tags: ["Dashboards", "KPIs", "Relatórios"],
      },
      {
        name: "Alessandra Firmiano",
        role: "Coordenadora Financeira & Regras de Negócio",
        image: "/team/alessandra-firmiano.jpg",
        icon: FileText,
        summary:
          "Estrutura regras de movimentações, relatórios financeiros e valida se as análises fazem sentido para microempreendedores.",
        tags: ["Financeiro", "Regras", "Validação"],
      },
    ],
  },
  {
    key: "execucao",
    label: "Nível 03",
    title: "Engenharia, qualidade e operação",
    description:
      "Time responsável por tirar a ideia do papel, integrar dados, testar a plataforma e garantir uma entrega confiável.",
    members: [
      {
        name: "Tiago Vilaça",
        role: "Tech Lead Front-end",
        image: "/team/tiago-vilaca.jpg",
        icon: Settings,
        summary:
          "Lidera a implementação das telas, componentes, responsividade e interação entre interface, dashboards e IA.",
        tags: ["Front-end", "Componentes", "Performance"],
      },
      {
        name: "Kauan Gabriel",
        role: "DevOps e Segurança",
        image: "/team/kauan-gabriel.jpg",
        icon: Database,
        summary:
          "Cuida da organização de deploy, segurança da aplicação, versionamento e suporte à estabilidade técnica do ambiente.",
        tags: ["Deploy", "Segurança", "Versionamento"],
      },
      {
        name: "Wesley Henrique",
        role: "Analista de Dados & Insights",
        image: "/team/wesley-henrique.jpg",
        icon: TrendingUp,
        summary:
          "Apoia a interpretação dos dados, identifica padrões e ajuda a converter gráficos em respostas práticas para tomada de decisão.",
        tags: ["Insights", "Análise", "Indicadores"],
      },
      {
        name: "Eric Henrique",
        role: "QA & Validação da Plataforma",
        image: "/team/eric-henrique.jpg",
        icon: Target,
        summary:
          "Testa fluxos, revisa comportamentos, identifica inconsistências e garante que a experiência final esteja estável.",
        tags: ["Testes", "Qualidade", "Confiabilidade"],
      },
    ],
  },
];

const WORKFLOW = [
  {
    icon: Lightbulb,
    title: "Pesquisa e fluxo",
    text: "O time entende o problema financeiro e desenha uma experiência objetiva para quem precisa decidir rápido.",
  },
  {
    icon: Database,
    title: "Dados conectados",
    text: "Planilhas, fontes e movimentações viram base para relatórios, dashboards e análises com IA.",
  },
  {
    icon: MessageSquareText,
    title: "IA como copiloto",
    text: "A inteligência interpreta perguntas, explica os indicadores e ajuda a transformar números em ação.",
  },
  {
    icon: UsersRound,
    title: "Entrega colaborativa",
    text: "Cada pessoa atua em uma etapa da solução para manter o projeto consistente, bonito e funcional.",
  },
];

function MemberCard({ member, onPhotoOpen }) {
  const Icon = member.icon;

  return (
    <article className={`about-member-card ${member.featured ? "is-featured" : ""}`}>
      <button
        type="button"
        className="about-member-photo-wrap"
        onClick={() => onPhotoOpen(member)}
        aria-label={`Abrir foto de ${member.name}`}
      >
        <img src={member.image} alt={member.name} className="about-member-photo" />

        <span className="about-photo-zoom">
          <ZoomIn size={17} />
          Ver foto
        </span>

        <span className="about-member-icon">
          <Icon size={18} />
        </span>
      </button>

      <div className="about-member-info">
        <span className="about-member-role">{member.role}</span>
        <h3>{member.name}</h3>
        <p>{member.summary}</p>

        <div className="about-member-tags">
          {member.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function About() {
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (!selectedMember) return undefined;

    function handleEscape(event) {
      if (event.key === "Escape") {
        setSelectedMember(null);
      }
    }

    document.body.classList.add("about-photo-modal-open");
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("about-photo-modal-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedMember]);

  return (
    <AppLayout>
      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-copy">
            <span className="about-kicker">
              <UsersRound size={18} />
              Sobre Nós
            </span>

            <h1>O time por trás do DataPilot AI</h1>

            <p>
              Uma equipe organizada como uma célula de produto: estratégia,
              experiência, dados, engenharia e validação trabalhando juntos para
              criar uma plataforma financeira com IA simples, visual e útil.
            </p>
          </div>

          <div className="about-hero-panel">
            <div className="about-orbit-card about-orbit-main">
              <Sparkles size={24} />
              <strong>DataPilot AI</strong>
              <span>Produto financeiro inteligente</span>
            </div>

            <div className="about-hero-stats">
              <div>
                <strong>09</strong>
                <span>Integrantes</span>
              </div>
              <div>
                <strong>03</strong>
                <span>Níveis de atuação</span>
              </div>
              <div>
                <strong>01</strong>
                <span>Objetivo comum</span>
              </div>
            </div>
          </div>
        </section>

        <section className="about-workflow-grid" aria-label="Fluxo de trabalho do time">
          {WORKFLOW.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="about-workflow-card">
                <span>
                  <Icon size={20} />
                </span>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className="about-hierarchy" aria-label="Hierarquia da equipe">
          {TEAM_TIERS.map((tier) => (
            <div key={tier.key} className={`about-tier about-tier-${tier.key}`}>
              <div className="about-tier-heading">
                <span>{tier.label}</span>
                <div>
                  <h2>{tier.title}</h2>
                  <p>{tier.description}</p>
                </div>
              </div>

              <div className="about-tier-line" />

              <div className="about-members-grid">
                {tier.members.map((member) => (
                  <MemberCard key={member.name} member={member} onPhotoOpen={setSelectedMember} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>

      {selectedMember && (
        <div
          className="about-photo-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto de ${selectedMember.name}`}
          onMouseDown={() => setSelectedMember(null)}
        >
          <div
            className="about-photo-modal-card"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="about-photo-modal-close"
              onClick={() => setSelectedMember(null)}
              aria-label="Fechar foto"
            >
              <X size={20} />
            </button>

            <div className="about-photo-modal-frame">
              <img src={selectedMember.image} alt={selectedMember.name} />
            </div>

            <div className="about-photo-modal-caption">
              <strong>{selectedMember.name}</strong>
              <span>{selectedMember.role}</span>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
