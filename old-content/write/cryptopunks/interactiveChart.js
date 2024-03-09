import React, { useState } from "react"
import Form from "react-bootstrap/Form"
import Chart from "chart.js/auto"
import { Scatter } from "react-chartjs-2"

const inequalityData = require("./balances_interactive.json")

const parseData = rawData => {
  const cleanData = []

  for (let i = 0; i < rawData.length; i++) {
    var points = []
    for (let j = 0; j < rawData[i].balances.length; j++) {
      points.push({ x: rawData[i].x[j], y: rawData[i].y[j] })
    }
    var current = {
      date: rawData[i].date,
      gini: rawData[i].gini,
      colour: rawData[i].colour,
      points: points,
    }
    cleanData.push(current)
    points = []
  }

  return cleanData
}

const InteractiveChart = () => {
  const graphData = parseData(inequalityData)
  const [time, setTime] = useState(0)
  const data = {
    datasets: [
      {
        data: graphData[time].points,
        label: `${graphData[time].date} (n = ${
          graphData[time].points.length
        }, gini = ${graphData[time].gini.toFixed(3)})`,
        backgroundColor: graphData[time].colour,
        borderColor: graphData[time].colour,
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
  }

  Chart.defaults.font.size = 20
  Chart.defaults.color = "black"

  const options = {
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
  }

  return (
    <>
      <Scatter options={options} data={data} />
      <Form className="my-3">
        <Form.Group controlId="formBasicRange">
          <Form.Range
            value={time}
            min={0}
            max={graphData.length - 1}
            onChange={event => setTime(event.target.value)}
          />
        </Form.Group>
      </Form>
      <br />
    </>
  )
}

export default InteractiveChart
