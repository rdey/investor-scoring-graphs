import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import arc from '../api/arc';
import Wrapper from './Wrapper';
import Controls from './GraphControls';
import Checkbox from './Checkbox';

const keys = (what) => Object.keys(what);


class Arc extends React.PureComponent {
  static propTypes = {
    data: PropTypes.object,
    dataAttributes: PropTypes.object,
    selectedData: PropTypes.object,
    width: PropTypes.number,
    height: PropTypes.number,
    cx: PropTypes.number,
    cy: PropTypes.number,
    radius: PropTypes.number,
    textCircleMargin: PropTypes.number,
    fontSize: PropTypes.number,
    bandWidth: PropTypes.number,
    scaling: PropTypes.number,
    onClick: PropTypes.func,
  };
  static defaultProps = {
    scaling: 1,
    width: 300,
    height: 300,
    cx: 150,
    cy: 187.5,
    radius: 108,
    textCircleMargin: 12,
    fontSize: 12,
    bandWidth: 70,
    data: {},
    selectedData: {},
  };
  constructor(props) {
    super(props);

    this.state = {
      selectedData: props.selectedData || {},
    };
  }
  componentDidMount() {
    this.c = this.buffer.getContext('2d');
    this.buffer.addEventListener('mousemove', this.mouseMove);
    this.preCalculate();
    this.update();
  }
  check = (key) => {
    const selected = keys(this.state.selectedData).filter((ikey) => this.state.selectedData[ikey]);
    if (selected.length === 1 && selected[0] === key) return;
    this.setState((prevState) => ({
      selectedData: {
        ...prevState.selectedData,
        [key]: !prevState.selectedData[key],
      },
    }));
  }
  preCalculate() {
    this.preCalculated = arc.preCalculate({
      radius: this.props.radius,
      textCircleMargin: this.props.textCircleMargin,
      data: this.props.data,
      fontSize: this.props.fontSize,
      canvasContext: this.c,
      centerX: this.props.cx,
      centerY: this.props.cy,
      selectedData: this.state.selectedData,
      scaling: this.props.scaling,
    });
  }

  update() {
    arc.draw(this.preCalculated, {
      width: this.props.width,
      height: this.props.height,
      bandWidth: this.props.bandWidth,
    });
  }

  onClick = (ev) => {
    if (this.props.onClick) {
      this.props.onClick(ev);
    }
  };

  render() {
    if (this.preCalculated) {
      this.preCalculate();
      this.update();
    }

    return (
      <Wrapper width={this.props.width / this.props.scaling}>
        <Controls>
          {keys(this.props.dataAttributes).map((key) => (
            <Checkbox
              color={this.props.dataAttributes[key].color}
              title={this.props.dataAttributes[key].title}
              checked={!!this.state.selectedData[key]}
              onClick={this.check}
              id={key}
              key={key}
            />
          ))}
        </Controls>
        <canvas
          onClick={this.onClick}
          id="buffer"
          width={this.props.width}
          height={this.props.height}
          ref={(el) => {
            this.buffer = el;
          }}
        />
      </Wrapper>
    );
  }
}


export default Arc;
