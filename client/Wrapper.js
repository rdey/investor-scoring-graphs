import styled from 'styled-components';

export default styled.div`
  canvas {
    width: ${({ width }) => width}px;
  }
  margin: auto;
  width: ${({ width }) => width}px;
`;
