import QuickChart from "quickchart-js";

export const generateChart = (
  type,
  labels,
  data,
  title,
  status,
  percent
) => {
  const chart = new QuickChart();

  chart
    .setConfig({
      type: type,
      data: {
        datasets: [
          {
            data: data,
            backgroundColor: ["#00e28f", "#fd6460"],
          },
        ],
        labels: labels,
      },
      options: {
        cutoutPercentage: 50,
        title: {
          display: true,
          text: title,
        },
        plugins: {
          datalabels: { display: false },
          doughnutlabel: {
            labels: [
              {
                text: `${percent}%\n`,
                font: {
                  size: "50",
                },
              },
              {
                text: `${status}\n`,
                color: "#aaa",
                font: {
                  size: "25",
                },
              },
            ],
          },
        },
      },
    })
    .setBackgroundColor("transparent");

  return chart.getUrl();
};
