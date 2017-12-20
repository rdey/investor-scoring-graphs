const keys = require('lodash/keys');
const assign = require('lodash/assign');

module.exports = {
  preCalculate: function arc({
    canvasContext: c,
    radius,
    textCircleMargin,
    fontSize,
    centerX: cx,
    centerY: cy,
    data,
    selectedData,
    scaling,
  }) {
    const totalValue = {};
    const labelRadius = radius + textCircleMargin;

    keys(data).forEach((groupId) => {
      totalValue[groupId] = keys(data[groupId]).reduce((o, valueId) => {
        const { value } = data[groupId][valueId];
        return o + value;
      }, 0);
    });

    const preCalculated = {
      totalValue,
      arc: {},
    };

    keys(data).forEach((groupId) => {
      let cumVal = 0;

      preCalculated.arc[groupId] = {
        angles: {},
        label: {},
      };

      const valueKeys = keys(data[groupId]);
      valueKeys.forEach((valueId, index) => {
        const { value, title } = data[groupId][valueId];

        const newCumVal = cumVal + value / totalValue[groupId];
        const sa = -Math.PI + Math.PI * cumVal;
        const ea = -Math.PI + Math.PI * newCumVal;

        preCalculated.arc[groupId].angles[valueId] = {
          sa,
          ea,
        };

        const midAngle = (sa + ea) / 2;

        c.font = `${fontSize}px Libre Franklin`;
        const textWidth = c.measureText(title).width;

        let lr = labelRadius;
        let textCoverAngle = textWidth / lr;
        let textSa = midAngle - textCoverAngle / 2;
        let textEa = midAngle + textCoverAngle / 2;

        let extraRadius = false;

        const approximateLetterAngle = fontSize / lr;
        if (index > 0) {
          if (
            preCalculated.arc[groupId].label[valueKeys[index - 1]].ea >=
              textSa - approximateLetterAngle &&
            !valueKeys[index - 1].extraRadius
          ) {
            // lets add radius to this label to avoid overlap
            extraRadius = true;
            lr = labelRadius + fontSize;
            textCoverAngle = textWidth / lr;
            textSa = midAngle - textCoverAngle / 2;
            textEa = midAngle + textCoverAngle / 2;
          }
        }

        const labelLetters = [];

        let rA = textSa;
        let letterWidth = null;
        for (let i = 0; i < title.length; i += 1) {
          const tA = rA;

          c.save();
          c.fillStyle = 'white';

          const tX = cx + Math.cos(tA) * lr;
          const tY = cy + Math.sin(tA) * lr;

          labelLetters[i] = {
            x: tX,
            y: tY,
            rotation: tA + Math.PI / 2,
            text: title[i],
          };

          // update rA
          if (letterWidth === null) {
            // first letter
            letterWidth = c.measureText(title[i]).width;
          } else {
            // measure the width of the text with the current letter and subtract from previous letter width;
            letterWidth =
              c.measureText(title.slice(0, i + 1)).width -
              c.measureText(title.slice(0, i)).width;
          }
          rA += letterWidth / lr;
        }

        preCalculated.arc[groupId].label[valueId] = {
          letters: labelLetters,
          sa: textSa,
          ea: textEa,
          extraRadius,
        };

        cumVal = newCumVal;
      });
    });


    const textRowFont = `300 ${fontSize}px Oswald`;
    c.font = textRowFont;

    const selectedKeys = keys(data).filter((i) => selectedData[i]);
    /* will create a merged object of all the keys/titles of the selected data */
    const legends = selectedKeys.reduce((o, a) => assign({}, o,
      keys(data[a]).reduce((p, legendKey) => {
        const legendObject = {};
        legendObject[legendKey] = {
          title: data[a][legendKey].title,
          color: data[a][legendKey].color,
          width: c.measureText(data[a][legendKey].title).width,
        };
        return assign({}, p, legendObject);
      }, {})
    ), {});

    const legendsWidth = keys(legends).reduce((o, a) => o + legends[a].width, 0);

    const n1 = keys(legends).length;
    const n0 = n1 - 1;
    const legendRowWidth = legendsWidth + (n1 * 16 + n1 * 8 + n0 * 16) * scaling;

    preCalculated.selectedKeys = selectedKeys;
    preCalculated.legendRowWidth = legendRowWidth;
    preCalculated.textRowFont = textRowFont;
    preCalculated.legends = legends;

    return {
      preCalculated,
      canvasContext: c,
      data,
      radius,
      scaling,
      centerX: cx,
      centerY: cy,
      fontSize,
    };
  },

  draw(
    {
      preCalculated,
      canvasContext: c,
      data,
      radius,
      centerX: cx,
      centerY: cy,
      scaling,
      fontSize,
    },
    { width, height, bandWidth }
  ) {
    c.clearRect(0, 0, width, height);
    c.fillStyle = 'white';
    // c.fillRect(0, 0, 30, 30);
    const {
      selectedKeys,
      legendRowWidth,
      textRowFont,
      legends,
    } = preCalculated;

    const margin = 6;
    selectedKeys.forEach((groupId, i) => {
      const iRadius =
        radius -
        bandWidth +
        bandWidth * 1 / selectedKeys.length +
        bandWidth * (selectedKeys.length - i - 1) / selectedKeys.length -
        margin * i;

      const innerIRadius =
        radius -
        bandWidth +
        bandWidth * (selectedKeys.length - i - 1) / selectedKeys.length;
      c.save();
      c.beginPath();
      c.arc(cx, cy, iRadius, 0, Math.PI, true);
      c.lineTo(bandWidth, cy);
      c.arc(cx, cy, innerIRadius, -Math.PI, 0, false);
      c.lineTo(cx + radius, cy);
      // c.fill();
      c.clip();
      c.closePath();
      c.stroke();
      keys(data[groupId]).forEach((valueId) => {
        const { ea, sa } = preCalculated.arc[groupId].angles[valueId];
        c.fillStyle = data[groupId][valueId].color;
        c.beginPath();
        c.moveTo(cx, cy);
        c.arc(cx, cy, iRadius, sa, ea, false);
        c.closePath();
        c.fill();
      });
      c.restore();
    });

    const lKeys = keys(legends);
    c.font = textRowFont;
    const bottomMargin = 8 * scaling;
    const rectSize = 16 * scaling;
    const legendSpacing = 16 * scaling;
    const rectTextSpacing = 8 * scaling;
    const legendY = height - rectSize - bottomMargin;
    const textTopRectDiff = (rectSize - fontSize) / 2;
    lKeys.reduce((left, lKey) => {
      const { title, color, width: tw } = legends[lKey];
      c.fillStyle = color;
      c.fillRect(left, legendY, rectSize, rectSize);
      c.fillStyle = '#ffffff';
      c.fillText(title, left + rectSize + rectTextSpacing, legendY + fontSize + textTopRectDiff);
      return left + legendSpacing + tw + rectTextSpacing + rectSize;
    }, (width - legendRowWidth) / 2);
  },
};
