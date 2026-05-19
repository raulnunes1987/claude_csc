export function initMatchesTable(data) {
  const { matches, meta } = data;

  updateLastUpdated(matches);
  renderSummary(matches);
  renderTables(matches, meta);
}

function updateLastUpdated(matches) {
  const played = matches.filter(m => m.home_score !== null);
  if (!played.length) return;
  const last = played[played.length - 1];
  const d = new Date(last.date + 'T12:00:00');
  const el = document.getElementById('last-updated');
  if (el) el.textContent = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function renderSummary(matches) {
  let wins = 0, draws = 0, losses = 0, goals = 0;

  matches.forEach(m => {
    if (m.home_score === null) return;
    const result = getResult(m);
    if (result === 'win')  wins++;
    if (result === 'draw') draws++;
    if (result === 'loss') losses++;
    goals += m.scorers.filter(s => s.team === 'ceara').length;
  });

  const total = wins + draws + losses;
  const container = document.getElementById('match-summary');
  container.innerHTML = `
    <div class="summary-card">
      <div class="summary-num">${total}</div>
      <div class="summary-label">Jogos</div>
    </div>
    <div class="summary-card wins">
      <div class="summary-num">${wins}</div>
      <div class="summary-label">Vitórias</div>
    </div>
    <div class="summary-card draws">
      <div class="summary-num">${draws}</div>
      <div class="summary-label">Empates</div>
    </div>
    <div class="summary-card losses">
      <div class="summary-num">${losses}</div>
      <div class="summary-label">Derrotas</div>
    </div>
    <div class="summary-card">
      <div class="summary-num">${goals}</div>
      <div class="summary-label">Gols marcados</div>
    </div>
  `;
}

function renderTables(matches, meta) {
  const competitionOrder = ['CEARENSE', 'COPA_NE', 'COPA_BR', 'SERIE_B'];
  const grouped = {};

  matches.forEach(m => {
    if (!grouped[m.competition]) grouped[m.competition] = [];
    grouped[m.competition].push(m);
  });

  const container = document.getElementById('matches-container');
  container.innerHTML = '';

  const keys = competitionOrder.filter(k => grouped[k]);
  const remaining = Object.keys(grouped).filter(k => !competitionOrder.includes(k));

  [...keys, ...remaining].forEach(key => {
    const block = document.createElement('div');
    block.className = 'competition-block';

    const title = meta.competitions[key] || key;
    block.innerHTML = `<div class="competition-title">${title}</div>`;

    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Data</th>
          <th>Rodada</th>
          <th class="confronto">Confronto</th>
          <th>Resultado</th>
          <th>Gols do Ceará</th>
        </tr>
      </thead>
    `;

    const tbody = document.createElement('tbody');
    grouped[key].forEach(m => {
      const rows = buildRow(m);
      [].concat(rows).forEach(row => tbody.appendChild(row));
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    block.appendChild(wrapper);
    container.appendChild(block);
  });
}

function buildRow(match) {
  const tr = document.createElement('tr');
  if (match.ceara_side === 'home') tr.classList.add('home-game');

  const d = new Date(match.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  const isHome = match.ceara_side === 'home';
  const confronto = isHome
    ? `<strong>Ceará</strong> × ${match.away}`
    : `${match.home} × <strong>Ceará</strong>`;

  const result = getResult(match);
  const scoreStr = `${match.home_score} – ${match.away_score}`;

  const scorersList = match.scorers
    .filter(s => s.team === 'ceara')
    .map(s => {
      const min = s.minute ? ` ${s.minute}'` : '';
      return `<span class="scorer-ceara">${s.player}${min}</span>`;
    })
    .join(', ') || '<span style="color:#aaa">—</span>';

  tr.innerHTML = `
    <td>${dateStr}</td>
    <td>${match.round}</td>
    <td class="confronto">${confronto}</td>
    <td class="result ${result}">${scoreStr}</td>
    <td class="scorers">${scorersList}</td>
  `;

  if (match.note) {
    const noteTr = document.createElement('tr');
    noteTr.innerHTML = `<td colspan="5" class="note-cell">ℹ️ ${match.note}</td>`;
    return [tr, noteTr];
  }

  return tr;
}

function getResult(match) {
  const ceara_goals = match.ceara_side === 'home' ? match.home_score : match.away_score;
  const opp_goals   = match.ceara_side === 'home' ? match.away_score : match.home_score;
  if (ceara_goals > opp_goals)  return 'win';
  if (ceara_goals === opp_goals) return 'draw';
  return 'loss';
}
