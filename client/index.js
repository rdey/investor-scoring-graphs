import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { fromJS } from 'immutable';
import scoresSample from '../api/scores-data';
import questionsSample from '../api/questions-data';
import PolarPie from './PolarPie';
import Arc from './Arc';
import ssrArc from '../lambda/ssrArc';
import ssrPolarPie from '../lambda/ssrPolarPie';
import { arcChartDataSelector, pieChartDataSelector } from '../api/selectors';
import testBlob from '../api/test-blob-data';

const store = fromJS({
  scores: scoresSample,
  questions: questionsSample,
});

const ssrFactory = ({
  id, width, height, renderer,
  scaling = 1
}) => {
  const buffer = document.getElementById(id);
  buffer.width = width;
  buffer.height = height;

  renderer({
    width,
    height,
    canvas: buffer,
    store,
    scaling,
  });
};

const scaling = 3;
ssrFactory({
  id: 'ssrPolarPie',
  width: 300 * scaling,
  height: 300 * scaling,
  renderer: ssrPolarPie,
  scaling,
});

ssrFactory({
  id: 'ssrArc',
  width: 600,
  height: 476.5,
  renderer: ssrArc,
});

const Header = styled.h2`
  font-family: Oswald;
  font-size: 24px;
  font-weight: normal;
  text-align: center;
`;
const Row = styled.div`
  text-align: center;
  @media (min-width: 768px) {
    display: flex;
  }
`;
const Col = styled.div`
  max-width: 400px;
  margin: auto;
  padding: 0 1.88em;
  margin-bottom: 2em;
  text-align: center;
  @media (min-width: 768px) {
    max-width: 50%;
    flex: 1;
    margin: 0;
  }
`;

const render = () => {
  const arcData = arcChartDataSelector(store);
  const pieData = pieChartDataSelector(store);

  ReactDOM.render(
    <Row>
      <Col>
        <Header>Company score</Header>
        <PolarPie
          scaling={2}
          data={pieData}
          dataAttributes={{
            score: {
              title: 'Company score',
              color: 'rgba(94, 194, 235, 0.75)',
            },
            reference: {
              title: 'Average Redeye score',
              color: 'rgba(94, 194, 235, 0.95)',
            },
          }}
          width={600}
          height={600}
          cx={300}
          cy={300}
          radius={240}
          extensionRadius={12}
          textCircleMargin={24}
          fontSize={24}
          selectedData={{
            score: true,
          }}
          scoreMax={100}
        />
      </Col>
      <Col>
        <Header>Investment Intentions</Header>
        <Arc
          data={arcData}
          dataAttributes={{
            company: {
              title: 'Company score',
              color: 'rgba(94, 194, 235, 1)',
            },
            reference: {
              title: 'Average Redeye score',
              color: 'rgba(94, 194, 235, 1)',
            },
          }}
          width={600}
          height={476.5}
          cx={300}
          cy={375}
          radius={300}
          textCircleMargin={24}
          fontSize={24}
          bandWidth={160}
          scaling={2}
          selectedData={{
            company: true,
          }}
        />
      </Col>
    </Row>,
    document.getElementById('app')
  );
};

render();

if (module.hot) {
  module.hot.accept();
}
