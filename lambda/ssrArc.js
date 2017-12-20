const arc = require('../api/arc');
const { arcChartDataSelector } = require('../api/selectors');

module.exports = ({ canvas, width, height, store, scaling = 1 }) => {
  const canvasContext = canvas.getContext('2d');

  const preCalculated = arc.preCalculate({
    centerX: 150 * scaling,
    centerY: 187.5 * scaling,
    fontSize: 12 * scaling,
    textCircleMargin: 12 * scaling,
    radius: 150 * scaling,
    data: arcChartDataSelector(store),
    scaling,
    selectedData: {
      company: true,
    },
    canvasContext,
  });

  arc.draw(preCalculated, {
    width,
    height,
    bandWidth: 80 * scaling,
  });
};
