import { html } from '../../utils/html.js';
import { icon } from '../../components/icons.js';
import { badge, button, card, chartCard, metricsGrid, sectionHead } from '../../components/ui.js';
import { barChart, chartLegend, donutChart, lineChart } from '../../components/charts.js';
import { pageHeader } from '../../components/page-header.js';
import { readingsTable, tableWrapper } from '../../components/tables.js';
import { VARIETIES } from '../../data/varieties.js';
import { TEMPERATURE_SERIES } from '../../data/series.js';
import { page } from './page-layout.js';

const PIPELINES = [
  { name: 'Entrada de dados', detail: '1.284 registros hoje', tone: 'blue', icon: 'cloud', status: 'Operacional' },
  { name: 'Conferência dos dados', detail: '98,7% de aprovação', tone: 'green', icon: 'quality', status: 'Operacional' },
  { name: 'Dados de mercado', detail: 'Atualizado há 34 min', tone: 'purple', icon: 'market', status: 'Operacional' },
  { name: 'Previsão de safra', detail: 'Última execução há 2h', tone: 'orange', icon: 'model', status: 'Modelo ativo' },
];

function pipelineHealth() {
  const items = PIPELINES.map(
    (pipeline) => html`<div><div class="pipe-icon tone-${pipeline.tone}">${icon(pipeline.icon)}</div><div><strong>${pipeline.name}</strong><span>${pipeline.detail}</span></div>${badge(pipeline.status)}</div>`,
  );
  return card(
    html`${sectionHead({ title: 'Estado dos processos de dados', subtitle: 'Etapas de recebimento, conferência e previsão.' })}<div class="pipeline-list">${items}</div>`,
    'table-card',
  );
}

export function analyticsDashboardPage({ variety }) {
  const predictedVsActual = chartCard({
    title: 'Previsão e resultado observado',
    subtitle: 'Desempenho do modelo ativo · últimos 30 dias',
    content: html`${chartLegend([
      { tone: 'green', label: 'Observado' },
      { tone: 'blue', label: 'Previsto' },
    ])}${lineChart({ secondary: [23, 24, 24, 23, 25, 27, 28, 29, 30, 28, 29, 28, 27] })}`,
  });
  const dataIntegrity = chartCard({
    title: 'Qualidade dos dados',
    subtitle: 'Distribuição dos registros',
    content: donutChart({
      total: '98,7%',
      caption: 'válidos',
      legend: [
        { tone: 'green', label: 'Válidos', value: '12.296' },
        { tone: 'gold', label: 'Fora do padrão', value: '118' },
        { tone: 'red', label: 'Ausentes', value: '44' },
      ],
    }),
  });
  return page(
    pageHeader({ title: 'Dashboard Analítico', subtitle: 'Qualidade dos dados, previsões e resultados.', variety }),
    metricsGrid([
      { icon: 'database', label: 'Registros processados', value: '12.458', meta: '+1.284 hoje' },
      { icon: 'cloud', label: 'Dados recebidos hoje', value: '1.284', meta: 'Último há 15s', tone: 'blue' },
      { icon: 'quality', label: 'Qualidade dos dados', value: '98,7%', meta: '+0,6% no período' },
      { icon: 'model', label: 'Previsão ativa', value: 'AC-Predict v3.2', meta: 'Executada há 2h', tone: 'purple' },
      { icon: 'trend', label: 'Precisão', value: '91,4%', meta: 'Meta: ≥ 88%', tone: 'orange' },
    ]),
    html`<div class="grid-main">${predictedVsActual}${dataIntegrity}</div>`,
    pipelineHealth(),
  );
}

export function analystHistoryPage({ auditLogs = [] } = {}) {
  const relevantEvents = auditLogs.filter((event) => [
    'Plantações', 'Análises', 'Relatórios', 'Monitoramento', 'Dados de mercado',
  ].includes(event.resource));
  const events = relevantEvents.map((event) => {
    const iconName = event.resource === 'Plantações' ? 'leaf' : event.resource === 'Relatórios' ? 'report' : event.resource === 'Monitoramento' ? 'cloud' : 'activity';
    return html`<article class="event-timeline-item"><span class="event-timeline-icon">${icon(iconName, 17)}</span><div class="event-timeline-copy"><div><span class="overline">${event.resource}</span><time>${formatEventDate(event.occurredAt)}</time></div><h3>${event.action}</h3><p>${event.details || 'Registro de atividade do sistema.'}</p><small>${event.user}</small></div>${badge(event.status, event.status === 'Concluído' ? 'success' : 'warning')}</article>`;
  });
  const plantationEvents = relevantEvents.filter((event) => event.resource === 'Plantações').length;
  const analysisEvents = relevantEvents.filter((event) => ['Análises', 'Relatórios'].includes(event.resource)).length;
  return page(
    pageHeader({ title: 'Histórico', subtitle: 'Acompanhe em ordem de data as análises, plantações e relatórios registrados.', varietyMode: 'hidden' }),
    metricsGrid([
      { icon: 'clock', label: 'Eventos registrados', value: relevantEvents.length, meta: 'Ordenados do mais recente' },
      { icon: 'leaf', label: 'Ações em plantações', value: plantationEvents, meta: 'Cadastros e colheitas', tone: 'green' },
      { icon: 'activity', label: 'Análises e relatórios', value: analysisEvents, meta: 'Atividades analíticas', tone: 'blue' },
    ], 'four'),
    card(
      html`${sectionHead({ title: 'Linha do tempo', subtitle: 'Cada item mostra quando ocorreu e o que foi registrado.' })}
        ${events.length ? html`<div class="event-timeline">${events}</div>` : html`<div class="empty-state"><span>${icon('clock')}</span><strong>Nenhum evento neste histórico ainda</strong><small>Cadastros de plantações e relatórios gerados aparecerão aqui.</small></div>`}`,
      'table-card analyst-history-card',
    ),
  );
}

function formatEventDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function registeredPlantsByVariety(plantations) {
  return VARIETIES.map((variety) => plantations
    .filter((plantation) => plantation.variety === variety.name)
    .reduce((total, plantation) => total + Number(plantation.quantity || 0), 0));
}

function reportTableRows(plantations) {
  const rows = VARIETIES.map((variety, index) => {
    const plantCount = registeredPlantsByVariety(plantations)[index];
    return html`<tr><td><div class="variety-cell"><span class="grape-dot grape-${variety.color}"></span><div><strong>${variety.name}</strong><small>${variety.type}</small></div></div></td><td>${variety.temp}</td><td>${variety.humid}</td><td>${badge(variety.risk, variety.risk === 'Baixo' ? 'success' : 'warning')}</td><td>${variety.price}</td><td>${plantCount.toLocaleString('pt-BR')}</td></tr>`;
  });
  return tableWrapper(['Variedade', 'Temperatura', 'Umidade', 'Risco', 'Preço de referência', 'Plantas cadastradas'], rows);
}

export function analystReportsPage({ plantations = [], auditLogs = [] } = {}) {
  const totalPlants = plantations.reduce((total, plantation) => total + Number(plantation.quantity || 0), 0);
  const reportsGenerated = auditLogs.filter((event) => event.resource === 'Relatórios').length;
  const plantCounts = registeredPlantsByVariety(plantations);
  const maxPlants = Math.max(1, ...plantCounts);
  const normalizedPlantCounts = plantCounts.map((count) => count ? Math.max(6, Math.round((count / maxPlants) * 100)) : 0);
  return page(
    pageHeader({ title: 'Relatórios', subtitle: 'Consulte dados consolidados, compare indicadores e exporte um resumo em CSV.', varietyMode: 'hidden' }),
    html`<div class="report-notice">${icon('database', 16)}<span>Temperatura, mercado e qualidade usam séries demonstrativas. Os dados de plantio vêm dos registros deste navegador.</span><button type="button" class="btn btn-primary" data-action="download-analyst-report">${icon('download', 16)} Gerar relatório CSV</button></div>`,
    metricsGrid([
      { icon: 'grid', label: 'Variedades analisadas', value: VARIETIES.length, meta: 'Dados de referência' },
      { icon: 'leaf', label: 'Plantações cadastradas', value: plantations.length, meta: 'Ativas e já colhidas', tone: 'green' },
      { icon: 'activity', label: 'Plantas registradas', value: totalPlants.toLocaleString('pt-BR'), meta: 'Somatório das plantações', tone: 'blue' },
      { icon: 'report', label: 'Relatórios gerados', value: reportsGenerated, meta: 'Nesta demonstração', tone: 'purple' },
    ], 'four'),
    html`<div class="grid-2">${chartCard({ title: 'Temperatura de referência', subtitle: 'Série demonstrativa · últimos pontos observados', content: lineChart({ data: TEMPERATURE_SERIES }) })}${chartCard({ title: 'Plantas cadastradas por variedade', subtitle: 'Quantidade informada nos cadastros', content: barChart(normalizedPlantCounts, VARIETIES.map(({ short }) => short)) })}</div>`,
    card(
      html`${sectionHead({ title: 'Resumo por variedade', subtitle: 'Indicadores para consulta e comparação; preços e clima são dados demonstrativos.' })}${reportTableRows(plantations)}`,
      'table-card report-table-card',
    ),
  );
}

export function buildAnalystCsv(plantations = []) {
  const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const lines = [
    ['Variedade', 'Tipo', 'Temperatura de referência', 'Umidade de referência', 'Risco', 'Preço de referência', 'Plantas cadastradas'],
    ...VARIETIES.map((variety, index) => [variety.name, variety.type, variety.temp, variety.humid, variety.risk, variety.price, registeredPlantsByVariety(plantations)[index]]),
  ];
  return `\uFEFF${lines.map((line) => line.map(quote).join(';')).join('\r\n')}`;
}

export function qualityPage({ variety }) {
  return page(
    pageHeader({ title: 'Qualidade dos Dados', subtitle: 'Completude, consistência e confiabilidade das fontes.', variety }),
    metricsGrid(
      [
        { icon: 'quality', label: 'Completude', value: '98,7%', meta: 'Meta ≥ 97%' },
        { icon: 'check', label: 'Consistência', value: '97,9%', meta: 'Dentro da meta', tone: 'blue' },
        { icon: 'warning', label: 'Dados ausentes', value: '44', meta: '0,35% do total', tone: 'orange' },
        { icon: 'activity', label: 'Fora do padrão', value: '118', meta: '0,94% do total', tone: 'purple' },
      ],
      'four',
    ),
    html`<div class="grid-2">${chartCard({ title: 'Qualidade ao longo do tempo', subtitle: 'Percentual de registros válidos', content: lineChart({ data: [92, 94, 95, 94, 96, 97, 98, 97, 98, 99, 98, 99, 99] }) })}${chartCard({ title: 'Registros por fonte', subtitle: 'Volume validado nos últimos 7 dias', content: barChart([76, 82, 91, 88, 94, 97, 99]) })}</div>`,
    readingsTable(),
  );
}

const MODEL_STATS = [
  ['Precisão', '91,4%'],
  ['MAE', '1,28'],
  ['RMSE', '1,74'],
  ['Amostras', '48.2k'],
];

const MODEL_CONFIG_FIELDS = [
  ['Modelo', 'AC-Predict v3.2'],
  ['Variedade analisada', 'Todas as variedades'],
  ['Período histórico', 'Últimos 24 meses'],
  ['Nível de confiança', '95%'],
];

const MODEL_FEATURES = ['Temperatura', 'Umidade', 'Preço', 'Demanda', 'Histórico climático'];

const MODEL_COMPARISON = [
  ['AC-Predict', 'v3.2', '91,4%', '1,28', '1,74'],
  ['Random Forest', 'v2.8', '88,9%', '1,51', '1,93'],
  ['LSTM Climate', 'v1.7', '87,6%', '1,62', '2,04'],
];

function modelHero(modelMessage = '') {
  return card(
    html`<div class="model-badge">${icon('model', 28)}</div><div><span class="overline">Modelo de demonstração</span><h2>AC-Predict v3.2</h2><p>Previsão combinada de colheita e envio · valores ilustrativos.</p></div><div class="model-stats">${MODEL_STATS.map(
      ([label, value]) => html`<div><span>${label}</span><strong>${value}</strong></div>`,
    )}</div><div class="button-row">${button('Testar modelo', { variant: 'secondary', action: 'run-demo-analysis' })}${button('Executar treinamento', { iconName: 'activity', action: 'run-demo-analysis' })}</div>${modelMessage && html`<p class="form-feedback model-feedback" role="status">${modelMessage}</p>`}`,
    'model-hero',
  );
}

function modelConfigForm() {
  const fields = MODEL_CONFIG_FIELDS.map(
    ([label, option]) => html`<label class="field"><span>${label}</span><select><option>${option}</option></select></label>`,
  );
  const features = MODEL_FEATURES.map((feature) => html`<label><input type="checkbox" checked><span>${feature}</span></label>`);
  return card(
    html`${sectionHead({ title: 'Configuração do Modelo', subtitle: 'Parâmetros demonstrativos da próxima execução' })}<div class="form-grid">${fields}</div><div class="checks">${features}</div><div class="button-row">${button('Salvar configuração', { variant: 'secondary', action: 'save-demo-model' })}${button('Executar modelo', { action: 'run-demo-analysis' })}</div>`,
    'form-card',
  );
}

export function modelsPage({ modelMessage = '' } = {}) {
  const rows = MODEL_COMPARISON.map(
    (columns, index) => html`<tr>${columns.map((value) => html`<td><strong>${value}</strong></td>`)}<td>${badge(index === 0 ? 'Ativo' : 'Disponível', index === 0 ? 'success' : 'neutral')}</td></tr>`,
  );
  return page(
    pageHeader({ title: 'Modelos Preditivos', subtitle: 'Treinamento e avaliação dos modelos de previsão.', varietyMode: 'hidden' }),
    modelHero(modelMessage),
    html`<div class="grid-2">${chartCard({ title: 'Previsão x Real', subtitle: 'Validação da versão demonstrativa', content: lineChart({ secondary: [24, 24, 23, 24, 24, 26, 28, 28, 30, 29, 28, 28, 26] }) })}${modelConfigForm()}</div>`,
    card(
      html`${sectionHead({ title: 'Comparação de modelos', subtitle: 'Métricas de referência (dados demonstrativos)' })}${tableWrapper(['Modelo', 'Versão', 'Precisão', 'MAE', 'RMSE', 'Status'], rows)}`,
      'table-card',
    ),
  );
}
