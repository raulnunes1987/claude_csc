export function initHistoryChart(data) {
  const seasons = data.seasons;
  const labels = seasons.map(s => s.year);

  const serieAData = seasons.map(s => (s.division === 'A' ? s.position : null));
  const serieBData = seasons.map(s => (s.division === 'B' ? s.position : null));

  // Plugin: colored zone bands drawn behind the chart lines
  const zonesPlugin = {
    id: 'zones',
    beforeDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      const yScale = scales.y;
      const { left, right } = chartArea;
      const w = right - left;
      ctx.save();
      // Green: promotion zone (1–4) for Série B
      ctx.fillStyle = 'rgba(45, 122, 45, 0.07)';
      ctx.fillRect(left, yScale.getPixelForValue(0.5), w, yScale.getPixelForValue(4.5) - yScale.getPixelForValue(0.5));
      // Red: relegation zone (17–20) for Série A
      ctx.fillStyle = 'rgba(178, 34, 34, 0.08)';
      ctx.fillRect(left, yScale.getPixelForValue(16.5), w, yScale.getPixelForValue(20.5) - yScale.getPixelForValue(16.5));
      ctx.restore();
    },
  };

  // Plugin: position number + ↑/↓ icon above each data point
  const dataLabelsPlugin = {
    id: 'dataLabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (meta.hidden) return;
        meta.data.forEach((point, index) => {
          const value = dataset.data[index];
          if (value === null || value === undefined) return;
          const season = seasons[index];
          const icon  = season.promoted ? ' ↑' : season.relegated ? ' ↓' : '';
          const color = season.promoted ? '#2d7a2d' : season.relegated ? '#b22222' : '#555555';
          ctx.save();
          ctx.font = 'bold 9px system-ui, sans-serif';
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`${value}º${icon}`, point.x, point.y - 8);
          ctx.restore();
        });
      });
    },
  };

  const ctx = document.getElementById('history-chart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Série A (1ª Divisão)',
          data: serieAData,
          borderColor: '#1a1a1a',
          backgroundColor: 'rgba(26,26,26,0.07)',
          pointBackgroundColor: serieAData.map((v, i) => {
            const s = seasons[i];
            return s.promoted ? '#2d7a2d' : s.relegated ? '#b22222' : '#1a1a1a';
          }),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 9,
          spanGaps: false,
          tension: 0.2,
          borderWidth: 2.5,
          fill: false,
        },
        {
          label: 'Série B (2ª Divisão)',
          data: serieBData,
          borderColor: '#777777',
          backgroundColor: 'rgba(119,119,119,0.07)',
          pointBackgroundColor: serieBData.map((v, i) => {
            const s = seasons[i];
            return s.promoted ? '#2d7a2d' : '#777777';
          }),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointStyle: 'rectRot',
          pointRadius: 6,
          pointHoverRadius: 9,
          spanGaps: false,
          tension: 0.2,
          borderDash: [6, 4],
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      layout: { padding: { top: 24 } },
      scales: {
        y: {
          reverse: true,
          min: 1,
          max: 20,
          title: {
            display: true,
            text: 'Colocação Final',
            font: { size: 12, weight: '600' },
          },
          ticks: {
            stepSize: 1,
            callback: val => `${val}º`,
          },
          grid: {
            color: ctx => {
              const v = ctx.tick.value;
              if (v >= 17) return 'rgba(178,32,32,0.12)';
              if (v === 4)  return 'rgba(45,122,45,0.15)';
              return 'rgba(0,0,0,0.06)';
            },
          },
        },
        x: {
          title: {
            display: true,
            text: 'Temporada',
            font: { size: 12, weight: '600' },
          },
          ticks: { maxRotation: 45, minRotation: 45 },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => `Temporada ${items[0].label}`,
            label: ctx => {
              if (ctx.parsed.y === null) return null;
              const season = seasons[ctx.dataIndex];
              const suffix = season.promoted  ? ' ↑ Promovido'
                           : season.relegated ? ' ↓ Rebaixado'
                           : '';
              return ` Série ${season.division}: ${ctx.parsed.y}º lugar${suffix}`;
            },
            afterBody: items => {
              const season = seasons[items[0].dataIndex];
              if (season.note) return [`  Obs: ${season.note}`];
              return [];
            },
          },
        },
      },
    },
    plugins: [zonesPlugin, dataLabelsPlugin],
  });
}
