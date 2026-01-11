/**
 * HTML template generator for Jirafly web interface
 * Generates complete HTML page with Chart.js visualizations
 */

const { CHART_COLORS } = require('./config');

const CSS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'JetBrains Mono', monospace;
    background: #fafafa;
    min-height: 100vh;
    padding: 40px 20px;
    color: #000;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  h1 {
    color: #000;
    margin-bottom: 8px;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .subtitle {
    color: #666;
    margin-bottom: 40px;
    font-size: 14px;
    font-weight: 400;
  }

  .params-info {
    background: #fff;
    border: 1px solid #e0e0e0;
    padding: 16px;
    margin-bottom: 24px;
    font-size: 13px;
    color: #666;
  }

  .params-info code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', monospace;
    color: #000;
  }

  #status {
    padding: 16px;
    background: #fff;
    border: 1px solid #e0e0e0;
    margin-bottom: 32px;
    color: #000;
    font-weight: 400;
    font-size: 13px;
  }

  #status.loading {
    border-color: #999;
  }

  #status.error {
    border-color: #000;
    background: #fff;
    color: #ef4444;
  }

  .charts-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
    margin-top: 32px;
  }

  @media (min-width: 1200px) {
    .charts-container {
      grid-template-columns: 1fr 1fr;
    }
  }

  .chart-wrapper {
    background: #fff;
    border: 1px solid #e0e0e0;
    padding: 24px;
  }

  .chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #000;
    margin-bottom: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .chart-canvas {
    max-height: 400px;
  }

  .spinner {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #e0e0e0;
    border-top: 2px solid #000;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 8px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

function generateHTML() {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jirafly Web 🪰</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1"></script>
  <style>${CSS_STYLES}</style>
</head>
<body>
  <div class="container">
    <h1>Jirafly Web 🪰</h1>
    <p class="subtitle">Task Distribution Analysis</p>

    <div class="params-info">
      Configure via URL parameters: <code>?filter_id=123&group_by=fix_version</code> or <code>?filter_id=123&group_by=sprint</code>
    </div>

    <div id="status">Initializing...</div>

    <div class="charts-container" id="chartsContainer" style="display: none;">
      <div class="chart-wrapper">
        <div class="chart-title">Percentage Distribution by Category</div>
        <canvas id="percentageChart" class="chart-canvas"></canvas>
      </div>

      <div class="chart-wrapper">
        <div class="chart-title">Absolute HLE Values by Category</div>
        <canvas id="hleChart" class="chart-canvas"></canvas>
      </div>
    </div>
  </div>

  <script>
    let percentageChart = null;
    let hleChart = null;

    const COLORS = ${JSON.stringify(CHART_COLORS)};

    function calculatePercentage(value, total) {
      return Math.round((value / total) * 1000) / 10;
    }

    function preparePercentageData(groups, categories, countsByGroup) {
      const percentageData = {};
      categories.forEach(category => percentageData[category] = []);

      groups.forEach(group => {
        const total = Object.values(countsByGroup[group]).reduce((sum, count) => sum + count, 0);
        categories.forEach(category => {
          percentageData[category].push(calculatePercentage(countsByGroup[group][category], total));
        });
      });

      return percentageData;
    }

    function prepareHLEData(groups, categories, hleByGroup) {
      const hleData = {};
      categories.forEach(category => {
        hleData[category] = groups.map(group => hleByGroup[group][category]);
      });
      return hleData;
    }

    function buildChartConfig(groups, categories, data, yAxisConfig, tooltipFormatter) {
      return {
        type: 'bar',
        data: {
          labels: groups,
          datasets: categories.map(category => ({
            label: category,
            data: data[category],
            backgroundColor: COLORS[category],
            borderWidth: 0
          }))
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            title: { display: false },
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  family: 'JetBrains Mono',
                  size: 11
                },
                color: '#000',
                padding: 12,
                usePointStyle: true,
                pointStyle: 'rect'
              }
            },
            tooltip: {
              backgroundColor: '#000',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#000',
              borderWidth: 1,
              padding: 12,
              titleFont: {
                family: 'JetBrains Mono',
                size: 12
              },
              bodyFont: {
                family: 'JetBrains Mono',
                size: 11
              },
              callbacks: {
                label: function(context) {
                  return \`\${context.dataset.label}: \${tooltipFormatter(context.parsed.y)}\`;
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false
              },
              ticks: {
                font: {
                  family: 'JetBrains Mono',
                  size: 11
                },
                color: '#666'
              },
              border: {
                color: '#e0e0e0'
              }
            },
            y: {
              stacked: true,
              grid: {
                color: '#f0f0f0',
                drawBorder: false
              },
              ticks: {
                font: {
                  family: 'JetBrains Mono',
                  size: 11
                },
                color: '#666'
              },
              border: {
                color: '#e0e0e0'
              },
              ...yAxisConfig
            }
          }
        }
      };
    }

    function getURLParams() {
      const params = new URLSearchParams(window.location.search);
      return {
        filterId: params.get('filter_id'),
        groupBy: params.get('group_by') || 'fix_version'
      };
    }

    async function loadData() {
      const { filterId, groupBy } = getURLParams();
      const statusEl = document.getElementById('status');

      if (!filterId) {
        statusEl.className = 'error';
        statusEl.textContent = 'Error: Missing filter_id parameter in URL';
        return;
      }

      statusEl.className = 'loading';
      statusEl.innerHTML = '<span class="spinner"></span>Loading data from Jira...';

      try {
        const response = await fetch(\`/api/data?filter_id=\${filterId}&group_by=\${groupBy}\`);

        if (!response.ok) {
          throw new Error('Failed to load data');
        }

        const data = await response.json();

        statusEl.className = '';
        statusEl.textContent = \`Loaded \${data.totalIssues} tasks from filter \${filterId} (grouped by \${groupBy})\`;

        renderCharts(data);
        document.getElementById('chartsContainer').style.display = 'grid';
      } catch (error) {
        statusEl.className = 'error';
        statusEl.textContent = \`Error: \${error.message}\`;
      }
    }

    function renderCharts(data) {
      const { groups, categories, countsByGroup, hleByGroup } = data;

      const percentageData = preparePercentageData(groups, categories, countsByGroup);
      const hleData = prepareHLEData(groups, categories, hleByGroup);

      if (percentageChart) percentageChart.destroy();
      if (hleChart) hleChart.destroy();

      const percentageCtx = document.getElementById('percentageChart').getContext('2d');
      percentageChart = new Chart(percentageCtx, buildChartConfig(
        groups, categories, percentageData,
        {
          max: 100,
          ticks: { callback: value => value + '%' },
          title: { display: true, text: 'Percentage (%)' }
        },
        value => value.toFixed(1) + '%'
      ));

      const hleCtx = document.getElementById('hleChart').getContext('2d');
      hleChart = new Chart(hleCtx, buildChartConfig(
        groups, categories, hleData,
        {
          beginAtZero: true,
          title: { display: true, text: 'HLE Value' }
        },
        value => value.toFixed(1)
      ));
    }

    // Auto-load data when page loads
    window.addEventListener('DOMContentLoaded', loadData);
  </script>
</body>
</html>`;
}

module.exports = { generateHTML };
