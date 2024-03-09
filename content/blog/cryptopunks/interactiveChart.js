const chart = document.getElementById("interactive-chart");
const slider = document.getElementById("time-slider");

window.data = {};
window.time = slider.value;
window.graph = {};

slider.addEventListener("input", (event) => {
  window.time = event.target.value;
  updateData();
});

fetch("balances_interactive.json")
  .then((data) => data.json())
  .then((data) => parseData(data))
  .then((data) => {
    window.data = data;
    makeChart(window.data, window.time);
  });

function parseData(rawData) {
  const cleanData = [];

  for (let i = 0; i < rawData.length; i++) {
    var points = [];
    for (let j = 0; j < rawData[i].balances.length; j++) {
      points.push({ x: rawData[i].x[j], y: rawData[i].y[j] });
    }
    var current = {
      date: rawData[i].date,
      gini: rawData[i].gini,
      colour: rawData[i].colour,
      points: points,
    };
    cleanData.push(current);
    points = [];
  }

  return cleanData;
}

function makeChartData(data, time) {
  return {
    datasets: [
      {
        data: data[time].points,
        label: `${data[time].date} (n = ${
          data[time].points.length
        }, gini = ${data[time].gini.toFixed(3)})`,
        backgroundColor: data[time].colour,
        borderColor: data[time].colour,
        borderWidth: 4,
      },
      {
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        label: "equality",
        backgroundColor: "white",
        borderColor: "black",
        borderWidth: 2,
        borderDash: [15, 5],
      },
    ],
  };
}

function updateData() {
  window.graph.data = makeChartData(window.data, window.time);
  window.graph.update();
}

function makeChart(data, time) {
  Chart.defaults.font.size = 20;
  Chart.defaults.color = "black";

  window.graph = new Chart(chart, {
    type: "scatter",
    data: makeChartData(data, time),
    options: {
      showLine: true,
      animation: false,
      aspectRatio: 1.3,
      scales: {
        y: {
          beginAtZero: true,
          max: 1,
          title: {
            display: true,
            text: "Cumulative Percent of ETH Value of Punks",
            ticks: {
              font: {
                size: 100000,
              },
            },
          },
        },
        x: {
          beginAtZero: true,
          max: 1,
          title: {
            display: true,
            text: "Cumulative Percent of Addresses",
          },
        },
      },
      elements: {
        point: {
          radius: 0,
        },
      },
      plugins: {
        title: {
          display: true,
          text: "Figure 4: Interactive Distribution of ETH Value of Punks",
        },
        tooltip: { enabled: false },
        legend: { labels: { padding: 20 }, onClick: null },
      },
    },
  });
}
