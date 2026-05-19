import { initHistoryChart } from './chart_history.js';
import { initMatchesTable } from './table_matches.js';

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadData();
});

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(p => p.setAttribute('hidden', ''));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      document.getElementById(target).removeAttribute('hidden');
    });
  });
}

async function loadData() {
  const [historyRes, matchesRes] = await Promise.all([
    fetch('data/brasileirao_history.json'),
    fetch('data/matches_2026.json'),
  ]);

  const historyData = await historyRes.json();
  const matchesData = await matchesRes.json();

  initHistoryChart(historyData);
  initMatchesTable(matchesData);
}
