import styled from 'styled-components'
import { InputNumber } from 'antd'

// Standalone styled wrapper used by both Product detail and Order page.
// OrderPage crashed because this export was accidentally removed in a previous refactor.
export const WrapperInputNumber = styled(InputNumber)`
  && {
    width: 64px;
    height: 36px;
    border: none;
    border-left: 1px solid #e0e0e0;
    border-right: 1px solid #e0e0e0;
    box-shadow: none;
    background: transparent;
  }

  && .ant-input-number-input {
    padding: 0 8px;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
  }

  && .ant-input-number-handler-wrap {
    display: none;
  }
`
