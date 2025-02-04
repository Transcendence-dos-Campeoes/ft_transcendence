function loadChart() {
  try {
    const statsChart = new Chart(document.getElementById("myChart"), {
      type: "bar",
      data: {
        labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        datasets: [
          {
            label: "Wins",
            data: [3, 1, 5, 4, 0, 2, 1],
            backgroundColor: "rgba(51, 147, 234, 0.4)" /* Light blue */,
            borderColor: "rgba(51, 147, 234, 0.8)" /* Solid blue */,
            borderWidth: 2,
          },
          {
            label: "Losses",
            data: [1, 2, 3, 1, 2, 1, 0],
            backgroundColor: "rgba(180, 216, 254, 0.4)" /* Light sky blue */,
            borderColor: "rgba(180, 216, 254, 0.8)" /* Solid sky blue */,
            borderWidth: 2,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "white",
            },
          },
        },
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2.4,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "white",
            },
          },
          x: {
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
            ticks: {
              color: "white",
            },
          },
        },
      },
    });
  } catch (error) {
    displayMessage("Failed to load graphics data", MessageType.ERROR);
  }
}
