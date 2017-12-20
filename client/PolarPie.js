import React from 'react';
import PropTypes from 'prop-types';

import Wrapper from './Wrapper';
import Checkbox from './Checkbox';
import Controls from './GraphControls';
import polarPie from '../api/polarPie';

const keys = (what) => Object.keys(what);
const dot = (a, b) => a.reduce((o, _, index) => o + a[index] * b[index], 0);

class PolarPie extends React.PureComponent {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    cx: PropTypes.number,
    cy: PropTypes.number,
    radius: PropTypes.number,
    extensionRadius: PropTypes.number,
    textCircleMargin: PropTypes.number,
    scoreMax: PropTypes.number,
    fontSize: PropTypes.number,
    data: PropTypes.object,
    dataAttributes: PropTypes.object,
    selectedData: PropTypes.object,
    scaling: PropTypes.number,
    hover: PropTypes.func,
    innerRef: PropTypes.func,
  };

  static defaultProps = {
    scaling: 1,
    width: 300,
    height: 300,
    cx: 150,
    cy: 150,
    radius: 120,
    extensionRadius: 6,
    textCircleMargin: 12,
    scoreMax: 100,
    fontSize: 12,
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
    this.buffer.addEventListener('mouseleave', this.mouseLeave);
    this.preCalculate();
    this.update();
  }
  componentWillUnmount() {
    this.buffer.removeEventListener('mousemove', this.mouseMove);
    this.buffer.removeEventListener('mouseleave', this.mouseLeave);
  }

  hoverId = null;
  hover = ({ id, rows, position }) => {
    if (id === this.hoverId) {
      return;
    }
    this.hoverId = id;
    if (this.props.hover) {
      if (id === null) {
        this.props.hover({ id: null });
      } else {
        this.props.hover({
          id,
          rows,
          position,
        });
      }
    }
  };

  mouseLeave = () => {
    this.hover({
      id: null,
    });
  };

  mouseMove = (ev) => {
    let x = null;
    let y = null;

    const rect = this.buffer.getBoundingClientRect();
    const scrollTop = document.documentElement.scrollTop
      ? document.documentElement.scrollTop
      : document.body.scrollTop;
    const scrollLeft = document.documentElement.scrollLeft
      ? document.documentElement.scrollLeft
      : document.body.scrollLeft;
    const elementLeft = rect.left + scrollLeft;
    const elementTop = rect.top + scrollTop;
    if (document.all || !ev) {
      // in IE
      x = window.event.clientX + scrollLeft - elementLeft; // event not ev because of IE
      y = window.event.clientY + scrollTop - elementTop;
    } else {
      x = ev.pageX - elementLeft;
      y = ev.pageY - elementTop;
    }

    this.update(x, y);
  };

  preCalculate() {
    this.preCalculated = polarPie.preCalculate({
      data: this.props.data,
      centerX: this.props.cx,
      centerY: this.props.cy,
      radius: this.props.radius,
      extensionRadius: this.props.extensionRadius,
      textCircleMargin: this.props.textCircleMargin,
      fontSize: this.props.fontSize,
      scaling: this.props.scaling,
      canvasContext: this.c,
      selectedData: this.state.selectedData,
      scoreMax: this.props.scoreMax,
    });
  }

  update(mouseX = null, mouseY = null) {
    polarPie.draw(this.preCalculated, {
      width: this.props.width,
      height: this.props.height,
      dataAttributes: this.props.dataAttributes,
      mouseX,
      mouseY,
      hover: this.hover,
    });
  }

  check = (key) => {
    const selected = keys(this.state.selectedData).filter(
      (ikey) => this.state.selectedData[ikey]
    );
    if (selected.length === 1 && selected[0] === key) return;
    this.setState((prevState) => ({
      selectedData: {
        ...prevState.selectedData,
        [key]: !prevState.selectedData[key],
      },
    }));
  };

  setRef = (el) => {
    this.buffer = el;
    if (this.props.innerRef) {
      this.props.innerRef(el);
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
          id="buffer"
          width={this.props.width}
          height={this.props.height}
          ref={this.setRef}
        />
      </Wrapper>
    );
  }
}

export default PolarPie;
