const polarPie = require('../api/polarPie');
const { pieChartDataSelector } = require('../api/selectors');

module.exports = ({ canvas, width, height, store, scaling = 1 }) => {
  const canvasContext = canvas.getContext('2d');

  const preCalculated = polarPie.preCalculate({
    data: pieChartDataSelector(store),
    centerX: 150 * scaling,
    centerY: 150 * scaling,
    radius: 120 * scaling,
    extensionRadius: 6 * scaling,
    textCircleMargin: 12 * scaling,
    fontSize: 12 * scaling,
    scoreMax: 100,
    scaling,
    canvasContext,
    selectedData: {
      score: true,
    },
  });

  polarPie.draw(preCalculated, {
    width,
    height,
    dataAttributes: {
      score: {
        title: 'Company score',
        color: 'rgba(94, 194, 235, 0.75)',
      },
      reference: {
        title: 'Average Redeye score',
        color: 'rgba(94, 194, 235, 0.95)',
      },
    },
    mouseX: null,
    mouseY: null,
  });
};
