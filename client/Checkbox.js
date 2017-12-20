import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';


const CheckboxContainer = styled.div`
  flex: 1;
  text-align: center;
  cursor: pointer;
`;

const Check = styled.div`
  padding: 0;
  cursor: pointer;
  display: inline-block;
  border-bottom: 3px solid transparent;
  padding-bottom: 0.5em;
  ${({ checked, color }) => checked && `
    border-bottom-color: white;
  `}
`;
const CheckboxTitle = styled.div`
  font-size: 12px;
  font-family: Libre Franklin;
`;

class Checkbox extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    color: PropTypes.string,
    id: PropTypes.string,
    checked: PropTypes.bool,
    onClick: PropTypes.func,
  };

  onClick = () => {
    this.props.onClick(this.props.id);
  };

  render() {
    return (
      <CheckboxContainer onClick={this.onClick}>
        <Check checked={this.props.checked} color={this.props.color}>
          <CheckboxTitle>{this.props.title}</CheckboxTitle>
        </Check>
      </CheckboxContainer>
    );
  }
}

export default Checkbox;
