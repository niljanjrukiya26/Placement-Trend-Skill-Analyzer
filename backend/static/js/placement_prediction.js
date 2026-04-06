(function () {
  function clampPercent(value) {
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, numeric));
  }

  function getUserId() {
    return localStorage.getItem('user_id');
  }

  function getToken() {
    return localStorage.getItem('access_token');
  }

  function setLoading(isLoading) {
    var loading = document.getElementById('pp-loading');
    var content = document.getElementById('pp-content');
    var error = document.getElementById('pp-error');

    if (!loading || !content || !error) return;

    loading.style.display = isLoading ? 'flex' : 'none';
    content.style.display = isLoading ? 'none' : 'block';
    error.style.display = 'none';
  }

  function setError(message) {
    var loading = document.getElementById('pp-loading');
    var content = document.getElementById('pp-content');
    var error = document.getElementById('pp-error');
    var errorText = document.getElementById('pp-error-text');

    if (!loading || !content || !error || !errorText) return;

    loading.style.display = 'none';
    content.style.display = 'none';
    error.style.display = 'flex';
    errorText.textContent = message || 'Failed to load placement prediction';
  }

  function renderOverallCircle(probability) {
    var circle = document.getElementById('pp-overall-circle');
    var value = document.getElementById('pp-overall-value');

    if (!circle || !value) return;

    var safe = clampPercent(probability);
    circle.style.background = 'conic-gradient(#4f46e5 ' + (safe * 3.6) + 'deg, #e0e7ff 0deg)';
    value.textContent = Math.round(safe) + '%';
  }

  function renderBestDomain(bestDomain) {
    var node = document.getElementById('pp-best-domain');
    if (!node) return;
    node.textContent = bestDomain || 'N/A';
  }

  function renderChart(domainProbabilities) {
    var canvas = document.getElementById('pp-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    var rows = Object.entries(domainProbabilities || {}).map(function (entry) {
      return { domain: entry[0], probability: clampPercent(entry[1]) };
    }).sort(function (a, b) { return b.probability - a.probability; });

    var labels = rows.map(function (r) { return r.domain; });
    var values = rows.map(function (r) { return r.probability; });

    if (window.__placementChart) {
      window.__placementChart.destroy();
    }

    window.__placementChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: 'rgba(79, 70, 229, 0.75)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function (value) { return value + '%'; }
            }
          }
        }
      }
    });
  }

  function renderPrediction(data) {
    renderOverallCircle(data && data.overall_probability);
    renderBestDomain(data && data.best_domain);
    renderChart(data && data.domain_probabilities);
  }

  function fetchPlacementPrediction() {
    var userId = getUserId();
    if (!userId) {
      setError('User id not found. Please login again.');
      return;
    }

    setLoading(true);

    fetch('/predict-placement/' + encodeURIComponent(userId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getToken() ? ('Bearer ' + getToken()) : ''
      }
    })
      .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
      .then(function (result) {
        if (!result.ok) {
          throw new Error((result.body && result.body.message) || 'Failed to load placement prediction');
        }
        setLoading(false);
        renderPrediction(result.body && result.body.data ? result.body.data : {});
      })
      .catch(function (err) {
        setError(err && err.message ? err.message : 'Failed to load placement prediction');
      });
  }

  window.fetchPlacementPrediction = fetchPlacementPrediction;

  document.addEventListener('DOMContentLoaded', fetchPlacementPrediction);
})();
