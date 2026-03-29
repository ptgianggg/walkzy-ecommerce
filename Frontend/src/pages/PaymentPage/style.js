import { Radio } from "antd";
import styled from "styled-components";

const WALKZY_BLUE = '#1a94ff'
const BORDER_COLOR = '#e8e8e8'
const TEXT_GRAY = '#666'
const TEXT_DARK = '#1a1a1a'

export const WrapperPaymentContainer = styled.div`
  background: linear-gradient(to bottom, #f8f9fa 0%, #f5f5f5 100%);
  width: 100%;
  min-height: 100vh;
  padding: 20px 0 32px;

  .payment-content {
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .payment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 0 4px;

    .payment-title {
      font-size: 26px;
      font-weight: 700;
      color: ${TEXT_DARK};
      margin: 0;
      display: flex;
      align-items: center;
      letter-spacing: -0.3px;
    }
  }

  .payment-body {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 20px;
    align-items: start;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
`

export const WrapperLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`

export const WrapperInfo = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid ${BORDER_COLOR};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &.delivery-info {
    .delivery-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;

      .info-icon {
        font-size: 20px;
        color: ${WALKZY_BLUE};
        margin-top: 2px;
        flex-shrink: 0;
        background: #f0f7ff;
        padding: 8px;
        border-radius: 8px;
      }

      .delivery-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;

        .label {
          font-size: 13px;
          color: #888;
          font-weight: 500;
        }

        .value {
          font-size: 14px;
          font-weight: 600;
          color: ${TEXT_DARK};
          word-break: break-word;
          line-height: 1.4;
        }
      }

      .change-address-link {
        font-size: 14px;
        color: ${WALKZY_BLUE};
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        padding: 6px 12px;
        border-radius: 6px;
        transition: all 0.2s ease;
        font-weight: 500;

        &:hover {
          background: #f0f7ff;
          text-decoration: none;
        }
      }
    }
  }
`

export const Lable = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${TEXT_DARK};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.2px;

  .label-icon {
    color: ${WALKZY_BLUE};
    font-size: 18px;
  }
`

export const WrapperRadio = styled(Radio.Group)`
  margin-top: 0;
  background: #fff;
  border: 1px solid ${BORDER_COLOR};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #d9d9d9;
  }

  .ant-radio-wrapper {
    padding: 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    font-size: 14px;
    color: ${TEXT_DARK};

    &:hover {
      background: #fafafa;
      border-color: ${BORDER_COLOR};
    }

    .ant-radio-checked .ant-radio-inner {
      border-color: ${WALKZY_BLUE};
      background-color: ${WALKZY_BLUE};
    }

    span {
      font-weight: 400;
      
      span {
        color: ${WALKZY_BLUE};
        font-weight: 600;
        margin-right: 4px;
      }
    }
  }
`

export const WrapperRight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  height: fit-content;
  position: sticky;
  top: 20px;

  @media (max-width: 1200px) {
    position: static;
  }
`

export const WrapperTotal = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid ${BORDER_COLOR};
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
`

export const WrapperPriceInfo = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;

  .price-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: #555;

    &:last-child {
      margin-bottom: 0;
    }

    .price-value {
      font-weight: 700;
      color: ${TEXT_DARK};
      font-size: 15px;
    }
  }
`

export const WrapperTotalPrice = styled.div`
  padding: 18px 20px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, #fff 0%, #fafafa 100%);

  .total-label {
    font-size: 16px;
    font-weight: 700;
    color: ${TEXT_DARK};
    letter-spacing: -0.2px;
  }

  .total-price-wrapper {
    text-align: right;

    .total-price-large {
      font-size: 24px;
      font-weight: 700;
      color: #ee4d2d;
      letter-spacing: -0.5px;
      display: block;
      margin-bottom: 4px;
    }

    .total-note {
      font-size: 12px;
      color: #888;
      font-weight: 400;
    }
  }
`

export const WrapperButton = styled.div`
  width: 100%;
  margin-top: 12px;

  .ant-btn {
    height: 52px !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    border-radius: 12px !important;
    box-shadow: 0 4px 12px rgba(26, 148, 255, 0.3) !important;
    transition: all 0.3s ease !important;
    letter-spacing: 0.3px !important;

    &:hover:not(:disabled) {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(26, 148, 255, 0.4) !important;
    }

    &:active:not(:disabled) {
      transform: translateY(0) !important;
      box-shadow: 0 2px 8px rgba(26, 148, 255, 0.3) !important;
    }

    &:disabled {
      background: #d9d9d9 !important;
      cursor: not-allowed !important;
    }
  }
`

export const WrapperPayPal = styled.div`
  width: 100%;
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  border: 1px solid ${BORDER_COLOR};
  padding: 16px;
`

export const WrapperShippingCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  border: 1px solid ${BORDER_COLOR};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;
  margin-top: 20px;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .shipping-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: ${TEXT_DARK};

    .icon {
      color: ${WALKZY_BLUE};
      font-size: 20px;
    }
  }

  .shipping-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .shipping-option-card {
    display: flex;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    border: 2px solid #e8e8e8;
    background: #fafafa;
    cursor: default;
    gap: 12px;
    transition: all 0.3s ease;

    &.selected {
      border-color: ${WALKZY_BLUE};
      background: linear-gradient(135deg, #e6f4ff 0%, #d4e9ff 100%);
      box-shadow: 0 2px 8px rgba(26, 148, 255, 0.15);
      transform: translateY(-1px);
    }
  }

  .option-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: #fff;
    border: 2px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 16px;
    transition: all 0.3s ease;

    &.selected {
      border-color: ${WALKZY_BLUE};
      color: ${WALKZY_BLUE};
      background: #fff;
      box-shadow: 0 2px 4px rgba(26, 148, 255, 0.2);
    }
  }

  .option-content {
    flex: 1;
    min-width: 0;

    .option-price {
      font-size: 16px;
      font-weight: 700;
      color: ${TEXT_DARK};
      margin-bottom: 2px;
    }

    .option-description {
      font-size: 12px;
      color: #666;
      line-height: 1.4;
    }
  }

  .check-icon {
    color: ${WALKZY_BLUE};
    font-size: 20px;
    flex-shrink: 0;
  }
`

export const WrapperItemOrder = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 16px;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }

  .item-img {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid #f0f0f0;
    flex-shrink: 0;
  }

  .item-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .item-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }

    .item-variation {
      font-size: 12px;
      color: #888;
      display: flex;
      gap: 8px;
      
      span {
        background: #f5f5f5;
        padding: 2px 8px;
        border-radius: 4px;
      }
    }
  }

  .item-price-qty {
    text-align: right;
    
    .item-price {
      font-weight: 600;
      color: #1a94ff;
      font-size: 15px;
    }

    .item-qty {
      font-size: 13px;
      color: #888;
      margin-top: 2px;
    }
  }
`
