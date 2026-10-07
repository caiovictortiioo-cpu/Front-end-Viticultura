# AgroClima Cloud

Painel demonstrativo para clima e mercado da fruticultura no Vale do São Francisco (Projeto Integrador ADS). O projeto é uma SPA em **HTML, CSS e JavaScript nativos**, sem framework, bibliotecas de aplicação ou etapa de build. Os ajustes preservam a identidade visual existente e reutilizam os componentes do projeto.

## Como executar

Os módulos ES precisam ser servidos por HTTP, não por `file://`:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
# abra http://localhost:8080
```

Na tela de login, escolha um acesso de demonstração e preencha qualquer senha não vazia. A senha **não é validada**: o login apenas demonstra a navegação por perfil. Os perfis padrão são Produtor, Analista e Administrador.

## Funcionalidades da demonstração

- **Produtor:** painel com linguagem simplificada, cadastro e acompanhamento de plantações, registro da colheita e histórico/relatório das áreas.
- **Plantio:** a data inicial é gerada pelo sistema ao cadastrar. A colheita começa sem data; ao confirmar a colheita, o sistema grava a data e altera o status para `Colhida`, mantendo o registro.
- **Analista:** Histórico é uma linha do tempo de atividades; Relatórios é uma tela analítica separada, com indicadores, gráficos e exportação CSV.
- **Administrador:** edição de papéis e permissões, preferências de segurança, auditoria pesquisável/filtrável/ordenável, configurações funcionais e catálogo interativo do Design System.
- **Tema:** o controle claro/escuro fica na barra superior e em Configurações → Aparência. A preferência é salva e aplicada às páginas da SPA.
- **Persistência:** plantações, RBAC, preferências e eventos de auditoria são armazenados no `localStorage` do navegador atual.

## Limite importante: não há backend

Este checkout não contém API, controllers HTTP, DTOs, ORM ou banco de dados. Também não existe conexão executada com ThingSpeak, sensores, serviços de mercado ou modelos remotos; clima e mercado continuam baseados em séries demonstrativas do código. As regras de autenticação/RBAC e as políticas de segurança são executadas no cliente e **não devem ser tratadas como segurança de produção**. O `localStorage` é local ao navegador e não sincroniza registros entre pessoas ou dispositivos.

A análise detalhada das estruturas presentes e ausentes está em [`docs/arquitetura-real.md`](docs/arquitetura-real.md). Os diagramas PNG refletem essa implementação real, não uma arquitetura futura inventada:

1. [`docs/diagrama-seguranca-armazenamento.png`](docs/diagrama-seguranca-armazenamento.png) — 3720 × 2610 px.
2. [`docs/diagrama-analise-dados-dashboard.png`](docs/diagrama-analise-dados-dashboard.png) — 3720 × 2610 px.

Os SVGs-fonte editáveis e o script `docs/render_diagrams.py` (que recria esses SVGs) estão ao lado dos PNGs.

## Estrutura

```text
index.html
css/
  reset.css, variables.css, base.css, layout.css, components.css
  pages.css, auth.css, responsive.css, utilities.css, themes.css
js/
  main.js                       Inicialização, tema e atualização das views
  config/                       Papéis, navegação e rotas
  data/                         Séries de demonstração e repositório local JSON
  events/index.js               Eventos por delegação (data-action / data-form)
  modules/
    auth.js                     Resolução demonstrativa do perfil por e-mail
    access-control.js           Papéis/permissões do lado do cliente
    plantations.js              Cadastro e colheita com datas automáticas
    settings.js                 Preferências gerais/tema/segurança
    audit.js                    Registro de eventos locais
  state/store.js                Estado de interface e assinantes
  components/                   Ícones, controles, gráficos SVG e tabelas
  views/pages/                  Páginas do Produtor, Analista e Administrador
```

## Fluxo da aplicação

```text
ação do usuário → events/index.js → modules/* → data/local-repository.js → localStorage
                                                   ↓
                          state/store.js → main.js → views/* → DOM
```

- As views são montadas com a template tag `html`, que escapa os valores interpolados. O `innerHTML` fica restrito a `utils/dom.js`.
- Os eventos são registrados uma vez em `#root`; as views usam atributos `data-action` e `data-form`.
- A troca de página atualiza o conteúdo interno sem recriar a barra superior e o menu.
- Chaves locais atuais: `agroclima:plantations`, `agroclima:rbac`, `agroclima:settings` e `agroclima:audit-events`.

## Decisões de fidelidade

- Os tokens de cor, tipografia, espaçamentos e componentes existentes foram mantidos; o tema escuro usa os mesmos elementos e tokens sem redesenhar as páginas.
- Os gráficos continuam em SVG/CSS, sem dependência de biblioteca gráfica.
- A tela deixa explícitos os valores demonstrativos e as integrações não conectadas, em vez de indicar sensores ou serviços como se estivessem ativos.
