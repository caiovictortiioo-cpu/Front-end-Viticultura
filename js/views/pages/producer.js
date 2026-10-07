import { html } from '../../utils/html.js';
import { findVariety } from '../../data/varieties.js';
import { HUMIDITY_SERIES, TEMPERATURE_SERIES } from '../../data/series.js';
import { icon } from '../../components/icons.js';
import { badge, button, card, chartCard, metricsGrid, sectionHead } from '../../components/ui.js';
import { barChart, chartLegend, lineChart } from '../../components/charts.js';
import { pageHeader } from '../../components/page-header.js';
import { comparisonTable, readingsTable } from '../../components/tables.js';
import { page } from './page-layout.js';

function syncStrip() {
  return html`<div class="sync-strip"><div>${icon('wifi', 17)}<strong>Dados de demonstração</strong><span>Exemplos para visualizar o painel; não são atualizados ao vivo.</span></div>${badge('Sem conexão ao vivo', 'info')}</div>`;
}

function harvestRecommendation(varietyName) {
  return card(
    html`<div class="recommend-icon">${icon('leaf')}</div><div class="recommend-main"><span class="overline">Dica para sua colheita</span><h3>Período indicado para colher</h3><div class="recommend-date">18 a 20 de outubro</div><p>O clima e as informações desta variedade apontam um bom momento para colher ${varietyName}.</p><div class="confidence"><span>Chance de a indicação estar certa</span><strong>87%</strong><div><i style="width:87%"></i></div></div></div>${button('Ver detalhes', { variant: 'soft', action: 'navigate', page: 'Previsões' })}`,
    'recommend harvest',
  );
}

function logisticsRecommendation() {
  return card(
    html`<div class="recommend-icon">${icon('truck')}</div><div class="recommend-main"><span class="overline">Dica para o envio</span><h3>Bom período para vender e enviar</h3><div class="recommend-date">19 a 21 de outubro</div><p>A procura está alta e o risco de chuva no trajeto é baixo. O preço estimado está 8,4% acima da média.</p><div class="recommend-tags">${badge('Pouco risco')}${badge('Boa procura', 'info')}</div></div>${button('Ver mercado', { variant: 'soft', action: 'navigate', page: 'Mercado e Exportação' })}`,
    'recommend logistics',
  );
}

export function overviewPage({ variety }) {
  const current = findVariety(variety);
  return page(
    pageHeader({ title: 'Visão Geral', subtitle: 'Informações simples para cuidar da plantação e planejar a colheita.', variety }),
    syncStrip(),
    metricsGrid([
      { icon: 'thermo', label: 'Temperatura', value: current.temp, meta: 'Boa para acompanhar hoje', tone: 'orange' },
      { icon: 'drop', label: 'Umidade do ar', value: current.humid, meta: 'Sem mudança importante', tone: 'blue' },
      { icon: 'leaf', label: 'Condição das uvas', value: 'Favorável', meta: 'Bom momento para acompanhar' },
      { icon: 'truck', label: 'Período para envio', value: '18–21 Out', meta: 'Procura alta por uvas', tone: 'purple' },
      { icon: 'warning', label: 'Atenção ao clima', value: current.risk, meta: 'Sem avisos importantes', tone: 'green' },
    ]),
    html`<div class="grid-2">${chartCard({ title: 'Temperatura nas últimas 24 horas', subtitle: 'Como a temperatura mudou ao longo do dia', legend: '28,4 °C agora', content: lineChart() })}${chartCard({ title: 'Umidade do ar', subtitle: 'Acompanhe as mudanças durante o dia', legend: '67% agora', content: lineChart({ data: HUMIDITY_SERIES, color: 'blue' }) })}</div>`,
    html`<div class="recommend-grid">${harvestRecommendation(variety)}${logisticsRecommendation()}</div>`,
    comparisonTable(),
  );
}

function integrationStatus() {
  return html`<div class="integration-status"><div class="thing-logo">${icon('cloud')}</div><div><span>Origem das informações</span><strong>Amostras salvas no código</strong></div>${badge('Demonstração', 'info')}<div class="status-detail"><span>Atualização ao vivo</span><strong>Não disponível</strong></div><div class="status-detail"><span>Sensor conectado</span><strong>Não configurado</strong></div></div>`;
}

export function monitoringPage({ variety }) {
  return page(
    pageHeader({ title: 'Monitoramento Climático', subtitle: 'Veja a temperatura e a umidade registradas na plantação.', variety }),
    integrationStatus(),
    metricsGrid(
      [
        { icon: 'thermo', label: 'Temperatura', value: '28,4 °C', meta: 'Máx. 30,2 °C', tone: 'orange' },
        { icon: 'drop', label: 'Umidade', value: '67%', meta: 'Mín. 61%', tone: 'blue' },
        { icon: 'activity', label: 'Amostras no painel', value: '1.284', meta: 'Números de demonstração' },
        { icon: 'wifi', label: 'Sensores', value: 'Não conectados', meta: 'Dados ao vivo indisponíveis', tone: 'purple' },
      ],
      'four',
    ),
    html`<div class="grid-2">${chartCard({ title: 'Temperatura por hora', subtitle: 'Hoje · °C', content: lineChart() })}${chartCard({ title: 'Umidade por hora', subtitle: 'Hoje · %', content: lineChart({ data: HUMIDITY_SERIES, color: 'blue' }) })}</div>`,
    readingsTable(),
  );
}

const FORECAST_TIMELINE = [
  { state: 'done', when: 'Hoje', what: 'Monitoramento' },
  { state: 'active', when: '18–20 Out', what: 'Colheita indicada' },
  { state: '', when: '20 Out', what: 'Resfriamento' },
  { state: '', when: '21–22 Out', what: 'Envio' },
  { state: '', when: '02 Nov', what: 'Entrega' },
];

const FORECAST_REASONS = ['Temperatura adequada para as uvas', 'Umidade sem grandes mudanças', 'Procura por uvas em alta'];

function forecastInsight() {
  return card(
    html`<div class="insight-mark">${icon('model')}</div><span class="overline">Entenda a indicação</span><h3>Por que esse período?</h3><p>A temperatura, a umidade e a procura por esta variedade estão favoráveis para planejar a colheita.</p><ul>${FORECAST_REASONS.map((reason) => html`<li>${icon('check', 16)} ${reason}</li>`)}</ul>${button('Ver dados utilizados')}`,
    'insight-card',
  );
}

export function forecastsPage({ variety }) {
  const observedVsForecast = chartCard({
    title: 'Temperatura observada e estimada',
    subtitle: 'Os pontos futuros são apenas uma estimativa de demonstração',
    content: html`${chartLegend([
      { tone: 'green', label: 'Registrado' },
      { tone: 'blue', label: 'Estimativa' },
      { tone: 'soft', label: 'Margem de variação' },
    ])}${lineChart({ data: TEMPERATURE_SERIES, secondary: [23, 24, 23, 24, 25, 26, 27, 28, 29, 29, 28, 27, 27] })}`,
  });
  const timeline = card(
    html`${sectionHead({ title: 'Próximas etapas', subtitle: `Planejamento de referência para ${variety}` })}<div class="timeline">${FORECAST_TIMELINE.map(
      ({ state, when, what }) => html`<div${state ? html` class="${state}"` : ''}><i></i><strong>${when}</strong><span>${what}</span></div>`,
    )}</div>`,
    'timeline-card',
  );
  return page(
    pageHeader({ title: 'Previsões', subtitle: 'Veja uma estimativa de período para colher e planejar o envio.', variety }),
    metricsGrid(
      [
        { icon: 'quality', label: 'Chance de acerto', value: '87%', meta: 'Estimativa demonstrativa' },
        { icon: 'clock', label: 'Período indicado', value: '18–20 Out', meta: 'Três dias de referência', tone: 'purple' },
        { icon: 'warning', label: 'Atenção ao clima', value: 'Baixa', meta: 'Nas próximas 72 horas' },
        { icon: 'trend', label: 'Mudança prevista', value: 'Estável', meta: 'Clima e procura', tone: 'blue' },
      ],
      'four',
    ),
    html`<div class="grid-main">${observedVsForecast}${forecastInsight()}</div>`,
    timeline,
  );
}

export function marketPage({ variety }) {
  return page(
    pageHeader({ title: 'Mercado e Exportação', subtitle: 'Consulte preços de referência e períodos para vender e enviar sua uva.', variety }),
    metricsGrid(
      [
        { icon: 'market', label: 'Preço de referência', value: 'R$ 8,42/kg', meta: 'Amostra demonstrativa' },
        { icon: 'trend', label: 'Preço médio', value: 'R$ 7,89/kg', meta: 'Amostra dos últimos 30 dias', tone: 'blue' },
        { icon: 'activity', label: 'Procura por uva', value: 'Alta', meta: 'Exemplo para o mercado europeu', tone: 'purple' },
        { icon: 'truck', label: 'Volume de referência', value: '428 t', meta: 'Valor demonstrativo', tone: 'orange' },
      ],
      'four',
    ),
    html`<div class="grid-2">${chartCard({ title: 'Evolução de preços', subtitle: 'R$/kg · últimos 30 dias', legend: '+6,8%', content: lineChart({ data: [68, 70, 69, 72, 74, 73, 77, 79, 78, 81, 83, 82, 86] }) })}${chartCard({ title: 'Demanda por mercado', subtitle: 'Participação estimada nos embarques', content: barChart([88, 73, 61, 48, 37, 30, 24]) })}</div>`,
    comparisonTable(),
  );
}
