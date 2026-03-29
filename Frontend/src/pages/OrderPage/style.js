import styled from 'styled-components'

const WALKZY_BLUE = '#1a94ff'

export const WrapperCartContainer = styled.div`
  background: linear-gradient(to bottom, #f8f9fa 0%, #f5f5f5 100%);
  width: 100%;
  min-height: 100vh;
  padding: 20px 0 32px;

  .cart-content {
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 4px;

    .cart-title {
      font-size: 26px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
      display: flex;
      align-items: center;
      letter-spacing: -0.3px;
    }

    .cart-count {
      font-size: 15px;
      color: #666;
      font-weight: 500;
      background: #fff;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1px solid #e8e8e8;
    }
  }

  .cart-body {
    display: grid;
    grid-template-columns: 280px minmax(0, 1.8fr) 360px;
    grid-template-areas: 'shipping cart summary';
    gap: 20px;
    align-items: start;

    @media (max-width: 1200px) {
      grid-template-columns: minmax(0, 1.8fr) 360px;
      grid-template-rows: auto auto;
      grid-template-areas:
        'cart summary'
        'shipping summary';
      gap: 16px;
    }

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
      grid-template-areas:
        'cart'
        'shipping'
        'summary';
      gap: 16px;
    }
  }
`

export const WrapperShippingColumn = styled.div`
  grid-area: shipping;
  display: flex;
  flex-direction: column;
  gap: 8px;

  @media (max-width: 1200px) {
    order: 3;
  }
`

export const WrapperShippingCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;

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
    color: #1a1a1a;

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
      color: #1a1a1a;
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

export const WrapperLeft = styled.div`
  grid-area: cart;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`

export const WrapperStyleHeader = styled.div`
  background: linear-gradient(to right, #fff 0%, #fafafa 100%);
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .select-all-section {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .select-all-text {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    white-space: nowrap;
    letter-spacing: -0.2px;
  }

  .delete-all-icon {
    cursor: pointer;
    color: #999;
    font-size: 18px;
    transition: all 0.3s ease;
    padding: 6px;
    border-radius: 6px;
    flex-shrink: 0;

    &:hover {
      color: ${WALKZY_BLUE};
      background: #f0f7ff;
      transform: scale(1.1);
    }
  }

  @media (max-width: 768px) {
    padding: 14px 16px;
    gap: 12px;
  }
`

export const WrapperListOrder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const WrapperItemOrder = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    border-color: #d9d9d9;
  }

  &.selected {
    border-color: ${WALKZY_BLUE};
    border-width: 2px;
    background: linear-gradient(135deg, #f0f8ff 0%, #eaf6ff 100%);
    box-shadow: 0 6px 20px rgba(26, 148, 255, 0.12);
    transform: translateY(-3px);

    .product-thumb {
      width: 100px;
      height: 100px;
      border-color: ${WALKZY_BLUE};
      box-shadow: 0 6px 16px rgba(26,148,255,0.08);
      transform: scale(1.03);
    }

    .product-name {
      font-size: 16px;
      color: ${WALKZY_BLUE};
    }

    .bottom-total-price {
      color: ${WALKZY_BLUE};
      font-weight: 800;
    }
  }

  &.out-of-stock {
    opacity: 0.65;
    background: #fafafa;
  }

  .item-main-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 14px;
    min-width: 0;
  }

  .item-main-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .product-checkbox {
    margin-top: 12px;
  }

  .product-thumb {
    width: 90px;
    height: 90px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid #f0f0f0;
    background: #f7f7f7;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      border-color: ${WALKZY_BLUE};
    }
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  .product-info {
    flex: 1;
    min-width: 0;
    padding-top: 2px;
  }

  .product-name {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 6px;
    cursor: pointer;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
    transition: color 0.2s ease;

    &:hover {
      color: ${WALKZY_BLUE};
    }
  }

  .product-variation {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
    width: fit-content;

    &:hover {
      background: #f8f8f8;
      
      .variation-badge {
        border-color: ${WALKZY_BLUE};
      }
      
      .variation-arrow {
        color: ${WALKZY_BLUE};
      }
    }

    .variation-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: #f5f5f5;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.4;
      transition: all 0.2s ease;

      .variation-label {
        color: #8c8c8c;
        font-weight: 500;
      }

      .variation-value {
        color: #1a1a1a;
        font-weight: 600;
      }
    }

    .variation-arrow {
      margin-left: 2px;
      color: #999;
      font-size: 10px;
      transition: color 0.2s;
    }
  }

  }


  .product-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4px;
  }

  .product-price-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-top: 4px;
    justify-content: flex-start;

    .current-price {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -0.2px;
    }

    .discount-percent {
      font-size: 13px;
      color: #ee4d2d;
      font-weight: 600;
      background: #fff0f0;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  .item-main-right {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    padding-top: 2px;
  }

  .delete-icon {
    cursor: pointer;
    color: #999;
    font-size: 20px;
    transition: all 0.3s ease;
    padding: 6px;
    border-radius: 6px;

    &:hover {
      color: #ee4d2d;
      background: #fff0f0;
      transform: scale(1.1) rotate(5deg);
    }
  }

  .item-bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    margin-top: 4px;
  }

  .bottom-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    flex: 1;
    justify-content: center;
    flex-shrink: 1;
  }

  .bottom-right {
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: flex-end;
    min-width: 180px;
    flex-shrink: 0;
  }

  .bottom-label {
    font-size: 14px;
    color: #666;
    font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .bottom-total-price {
    font-size: 18px;
    font-weight: 700;
    color: #ee4d2d;
    letter-spacing: -0.3px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .item-main-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .item-main-right {
      align-self: flex-end;
      position: absolute;
      top: 12px;
      right: 14px;
    }

    .item-main-left {
      width: 100%;
      padding-right: 30px;
    }

    .item-bottom-row {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .bottom-left,
    .bottom-right {
      width: 100%;
      justify-content: space-between;
    }
  }
`

export const VariationSelectionPopover = styled.div`
  width: 320px;
  padding: 4px;
  
  .variation-group {
    margin-bottom: 20px;
    
    &:last-of-type {
      margin-bottom: 0;
    }
    
    .group-label {
      font-size: 14px;
      font-weight: 500;
      color: #555;
      margin-bottom: 12px;
      display: block;
    }
    
    .options {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
  }
  
  .option-item {
    min-width: 60px;
    padding: 8px 16px;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    font-size: 13px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #fff;
    color: #333;
    
    &:hover:not(.disabled) {
      border-color: ${WALKZY_BLUE};
      color: ${WALKZY_BLUE};
      background: #f0faff;
    }
    
    &.selected {
      border-color: ${WALKZY_BLUE};
      color: ${WALKZY_BLUE};
      background: #e6f7ff;
      font-weight: 600;
    }
    
    &.disabled {
      background: #f5f5f5;
      color: #c0c0c0;
      cursor: not-allowed;
      border-color: #f0f0f0;
    }
  }
  
  .popover-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;

    .ant-btn {
      height: 36px;
      border-radius: 4px;
    }
  }
`;


export const WrapperCountOrder = styled.div`
  display: inline-flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;
  height: 36px;

  &:hover {
    border-color: ${WALKZY_BLUE};
    box-shadow: 0 2px 6px rgba(26, 148, 255, 0.12);
  }

  .qty-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    color: #595959;
    transition: all 0.2s ease;
    padding: 0;
    margin: 0;
    line-height: 1;

    &:hover:not(:disabled) {
      background: ${WALKZY_BLUE};
      color: #fff;
    }

    &:active:not(:disabled) {
      background: #0d7ae6;
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      background: #f5f5f5;
      color: #bfbfbf;
    }
  }

  .ant-input-number {
    border: none !important;
    border-left: 1px solid #e0e0e0 !important;
    border-right: 1px solid #e0e0e0 !important;
    height: 36px !important;
    width: 60px !important;
    background: #fff !important;
    box-shadow: none !important;

    &:hover {
      border-left-color: ${WALKZY_BLUE} !important;
      border-right-color: ${WALKZY_BLUE} !important;
    }

    &.ant-input-number-focused {
      border-left-color: ${WALKZY_BLUE} !important;
      border-right-color: ${WALKZY_BLUE} !important;
      box-shadow: none !important;
    }
  }

  .ant-input-number-input {
    padding: 0 8px !important;
    text-align: center !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    color: #1a1a1a !important;
    height: 36px !important;
    line-height: 36px !important;
  }

  .ant-input-number-handler-wrap {
    display: none !important;
  }
`

export const WrapperRight = styled.div`
  grid-area: summary;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;

  .order-summary-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e8e8e8;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
  }
`

export const WrapperInfo = styled.div`
  padding: 16px 18px;

  &.price-info {
    border-top: 1px solid #f0f0f0;
    padding: 14px 18px;
    background: #fafafa;

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-size: 14px;
      color: #555;

      &:last-child {
        margin-bottom: 0;
      }

      .price-value {
        font-weight: 700;
        color: #1a1a1a;
        font-size: 15px;
      }
    }
  }

  .delivery-info {
    display: flex;
    align-items: flex-start;
    gap: 12px;

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
      gap: 6px;
      min-width: 0;
    }

    .label {
      font-size: 13px;
      color: #888;
      font-weight: 500;
    }

    .value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      word-break: break-word;
      line-height: 1.4;
    }

    .change-address-link {
      font-size: 14px;
      color: ${WALKZY_BLUE};
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      margin-left: auto;
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
`

export const WrapperTotal = styled.div`
  padding: 18px 20px;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, #fff 0%, #fafafa 100%);

  .total-label {
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
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

export const WrapperEmptyCart = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  border: 1px solid #e4e4e4;
`

export const WrapperPriceDiscount = styled.span`
  color: #999;
  font-size: 12px;
  text-decoration: line-through;
`

export const StatusTag = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.2px;

  &.in-stock {
    background: #f0f9ff;
    color: #1890ff;
    border: 1px solid #bae7ff;
  }

  &.out-of-stock {
    background: #fff1f0;
    color: #ff4d4f;
    border: 1px solid #ffccc7;
  }

  &.sale {
    background: #fff7e6;
    color: #fa8c16;
    border: 1px solid #ffe7ba;
  }
`

export const BuyButtonWrapper = styled.div`
  .ant-btn {
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(26, 148, 255, 0.3);
    font-weight: 600;
    letter-spacing: 0.3px;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(26, 148, 255, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(26, 148, 255, 0.3);
    }
  }
`
