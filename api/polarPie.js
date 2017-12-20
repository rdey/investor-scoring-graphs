/* eslint-disable no-restricted-properties */
const keys = require('lodash/keys');
const dot = (a, b) => a.reduce((o, _, index) => o + a[index] * b[index], 0);

const drawArc = ({
  groupId,
  valueId,
  c,
  cx,
  cy,
  scoreMax,
  circRadius,
  preCalculated,
  data,
  width,
  height,
}) => {
  const {
    arcCenterX, arcCenterY, sa, ea,
  } = preCalculated.arc[groupId];

  const {
    angleOffset, ax, ay, bx, by,
  } = preCalculated.arc[groupId].values[
    valueId
  ];

  const score = data[groupId].values[valueId];

  c.beginPath();
  c.moveTo(arcCenterX, arcCenterY);

  c.lineTo(ax, ay);
  c.lineTo(bx, by);
  c.arc(
    cx,
    cy,
    circRadius * score / scoreMax,
    sa + angleOffset,
    ea - angleOffset,
    false
  );
  c.save();
  c.clip();
  c.fillRect(0, 0, width, height);
  c.restore();
};

module.exports = {
  preCalculate({
    data,
    centerX: cx,
    centerY: cy,
    radius,
    extensionRadius,
    textCircleMargin,
    fontSize,
    scaling,
    canvasContext: c,
    selectedData,
    scoreMax,
  }) {
    const gKeys = keys(data);
    const circRadius = radius + extensionRadius;
    const labelRadius = radius + extensionRadius + textCircleMargin;

    const preCalculated = {
      circRadius,
      labelRadius,
      arc: {},
    };

    gKeys.forEach((groupId, index) => {
      const { title } = data[groupId];
      const sa = index * 2 * Math.PI / gKeys.length - Math.PI / 2;
      const ea = (index + 1) * 2 * Math.PI / gKeys.length - Math.PI / 2;

      const midAngle = (sa + ea) / 2;

      const offsetX = extensionRadius * Math.cos(midAngle);

      const offsetY = extensionRadius * Math.sin(midAngle);

      const megaRadius = circRadius * 2;
      const v0 = [
        (cx + Math.cos(sa) * megaRadius - cx) / scaling,
        (cy + Math.sin(sa) * megaRadius - cy) / scaling,
      ]; // C - A;
      const v1 = [
        (cx + Math.cos(ea) * megaRadius - cx) / scaling,
        (cy + Math.sin(ea) * megaRadius - cy) / scaling,
      ]; // B - A

      const dot00 = dot(v0, v0);
      const dot01 = dot(v0, v1);
      const dot11 = dot(v1, v1);
      const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

      const vKeys = keys(data[groupId].values);
      const values = {};

      vKeys.forEach((valueId) => {
        const score = data[groupId].values[valueId];

        // approximation of the angle which forms the extensionRadius margin between the arcs
        const angleOffset = Math.atan2(
          extensionRadius / 2,
          radius * score / 100
        );
        const ax = cx + circRadius * Math.cos(sa + angleOffset) * score / 100;

        const ay = cy + circRadius * Math.sin(sa + angleOffset) * score / 100;
        const bx = cx + circRadius * Math.cos(ea - angleOffset) * score / 100;

        const by = cy + circRadius * Math.sin(ea - angleOffset) * score / 100;

        const circPercentage = score / scoreMax;

        const arcHoverPoint = [
          cx + offsetX + Math.cos(midAngle) * circRadius * circPercentage / 2,
          cy + offsetY + Math.sin(midAngle) * circRadius * circPercentage / 2,
        ];

        values[valueId] = {
          angleOffset,
          ax,
          ay,
          bx,
          by,
          arcHoverPoint,
        };
      });

      /* only used for the hover effect to e.g. highlight
         the arc with the highest value when
         hovering far out on the arc.
      */
      const sortedValuesKeys = keys(data[groupId].values)
        .filter((key) => selectedData[key])
        .sort((a, b) => data[groupId].values[b] - data[groupId].values[a]);

      // label calculation
      c.font = `${fontSize}px Libre Franklin`;
      const { width: textWidth } = c.measureText(title);
      const textCoverAngle = textWidth / labelRadius;

      let pm = 1;
      if ((midAngle >= -Math.PI / 2 && midAngle < 0) || midAngle >= Math.PI) {
        pm = -1;
      }
      const textSa = midAngle + pm * textCoverAngle / 2;

      const labelLetters = [];

      let rA = textSa;
      let letterWidth = null;
      for (let i = 0; i < title.length; i += 1) {
        let tA = rA;

        c.save();
        c.fillStyle = 'white';

        let tX = cx + Math.cos(tA) * labelRadius;
        let tY = cy + Math.sin(tA) * labelRadius;

        if (midAngle > 0 && midAngle < Math.PI) {
          tA += Math.PI;
          // compensate for text height when flipping the text upside down
          tX -= fontSize / 2 * Math.cos(tA);
          tY -= fontSize / 2 * Math.sin(tA);
        }

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
        rA -= pm * (letterWidth / labelRadius);
      }
      preCalculated.arc[groupId] = {
        arcCenterX: cx + offsetX,
        arcCenterY: cy + offsetY,

        arcOffsetX: offsetX,
        arcOffsetY: offsetY,
        midAngle,
        sa,
        ea,
        labelLetters,
        // arc - mouse collision detection
        hover: {
          v0,
          v1,
          dot00,
          dot01,
          dot11,
          invDenom,
        },
        values,
        sortedValuesKeys,
      };
    });

    return {
      preCalculated,
      data,
      canvasContext: c,
      centerX: cx,
      centerY: cy,
      radius,
      extensionRadius,
      selectedData,
      scaling,
      fontSize,
      scoreMax,
    };
  },
  draw(
    {
      preCalculated,
      data,
      canvasContext: c,
      centerX: cx,
      centerY: cy,
      radius,
      extensionRadius,
      selectedData,
      scaling,
      fontSize,
      scoreMax,
    },
    {
      width, height, mouseX, mouseY, dataAttributes, hover = false,
    }
  ) {
    const { circRadius } = preCalculated;

    c.clearRect(0, 0, width, height);

    c.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    c.fillStyle = '#191919';
    c.beginPath();
    c.arc(cx, cy, radius + extensionRadius, 0, Math.PI * 2, false);
    c.closePath();
    c.fill();

    const hovering =
      mouseX &&
      Math.sqrt(
        Math.pow(mouseX - cx / scaling, 2) + Math.pow(mouseY - cy / scaling, 2)
      ) <=
        (radius + extensionRadius) / scaling;

    const gKeys = keys(data);
    const arcHovering = {};

    let isHoveringSomething = false;

    gKeys.forEach((groupId) => {
      arcHovering[groupId] = false;

      const { sortedValuesKeys } = preCalculated.arc[groupId];

      if (hovering) {
        const {
          v0, v1, dot00, dot01, dot11, invDenom,
        } = preCalculated.arc[
          groupId
        ].hover;

        const v2 = [mouseX - cx / scaling, mouseY - cy / scaling]; // P - A;

        const dot02 = dot(v0, v2);
        const dot12 = dot(v1, v2);
        const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
        // Check if point is in triangle
        if (u >= 0 && v >= 0 && u + v < 1) {
          arcHovering[groupId] = {};
        }
      }

      const { values } = data[groupId];
      const highLightKeys = arcHovering[groupId];
      if (highLightKeys) {
        sortedValuesKeys.forEach((valueId) => {
          if (
            arcHovering[groupId] &&
            Math.sqrt(
              Math.pow(mouseX - cx / scaling, 2) +
                Math.pow(mouseY - cy / scaling, 2)
            ) <=
              circRadius * values[valueId] / (scoreMax * scaling)
          ) {
            highLightKeys[valueId] = true;
            isHoveringSomething = true;
          } else {
            highLightKeys[valueId] = false;
          }
        });
      }

      keys(data[groupId].values).forEach((valueId) => {
        if (!selectedData[valueId]) {
          return;
        }
        c.save();
        c.globalAlpha = 0.8;

        c.fillStyle = dataAttributes[valueId].color;
        if (arcHovering[groupId] && highLightKeys[valueId]) {
          c.globalAlpha = 1;
        }
        drawArc({
          width,
          height,
          groupId,
          valueId,
          c,
          cx,
          cy,
          scoreMax,
          circRadius,
          preCalculated,
          data,
        });
        c.restore();
      });

      const { labelLetters } = preCalculated.arc[groupId];
      const { title } = data[groupId];

      for (let i = 0; i < title.length; i += 1) {
        const {
          x, y, rotation, text,
        } = labelLetters[i];

        c.save();
        c.fillStyle = 'white';

        c.translate(x, y);
        c.rotate(rotation);
        c.fillText(text, 0, 0);
        c.restore();
      }

      // c.fillText(title, 0, 0);
    });
    if (!hover) {
      return;
    }
    /* does not seem to work for now
    if (!isHoveringSomething) {
      hover({
        id: null,
      });
      return;
    }
    */
    if (!arcHovering.length) {
      gKeys.forEach((groupId) => {
        keys(data[groupId].values).forEach((valueId) => {
          if (arcHovering[groupId] && arcHovering[groupId][valueId]) {
            const dKeys = keys(data[groupId].values.details);
            const { arcHoverPoint } = preCalculated.arc[groupId].values[valueId];
            const rows = dKeys.map((id) => {
              const { title, score } = data[groupId].values.details[id];
              return {
                content: `${title}: ${score}%`,
                id,
              };
            });
            hover({
              id: groupId,
              rows,
              position: arcHoverPoint,
            });
          }
        });
      });
    }
  },
};
