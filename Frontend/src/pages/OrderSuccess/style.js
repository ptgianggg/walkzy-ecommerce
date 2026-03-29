import styled from 'styled-components'

const WALKZY_BLUE = '#1a94ff'
const BORDER_COLOR = '#e8e8e8'
const TEXT_GRAY = '#666'
const TEXT_DARK = '#1a1a1a'
const SUCCESS_COLOR = '#52c41a'

export const WrapperSuccessContainer = styled.div`
  background: linear-gradient(to bottom, #f8f9fa 0%, #f5f5f5 100%);
  width: 100%;
  min-height: 100vh;
  padding: 40px 0 60px;

  .success-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
`

// Alias for backward compatibility with MyOrderPage
export const WrapperContainer = styled.div`
  background: #f5f5fa;
  width: 100%;
  min-height: 100vh;
  padding: 20px 0;
`

export const WrapperSuccessHeader = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  border: 1px solid ${BORDER_COLOR};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;

  .success-icon-wrapper {
    width: 100px;
    height: 100px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .success-icon {
      font-size: 60px;
      color: ${SUCCESS_COLOR};
      z-index: 1;
    }

    &::after {
      content: '';
      position: absolute;
      width: 80px;
      height: 80px;
      background: #fff;
      border-radius: 50%;
      z-index: 0;
    }
  }

  .success-title {
    font-size: 28px;
    font-weight: 700;
    color: ${TEXT_DARK};
    margin-bottom: 12px;
    letter-spacing: -0.5px;
  }

  .success-message {
    font-size: 16px;
    color: ${TEXT_GRAY};
    margin-bottom: 8px;
    line-height: 1.6;
  }

  .order-id {
    font-size: 14px;
    color: ${TEXT_GRAY};
    margin-top: 16px;
    padding: 8px 16px;
    background: #fafafa;
    border-radius: 8px;
    display: inline-block;

    .order-id-label {
      color: ${TEXT_DARK};
      font-weight: 600;
      margin-right: 8px;
    }
  }
`

export const WrapperTimeline = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  border: 1px solid ${BORDER_COLOR};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;

  .timeline-title {
    font-size: 18px;
    font-weight: 600;
    color: ${TEXT_DARK};
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 10px;

    .timeline-icon {
      color: ${WALKZY_BLUE};
      font-size: 20px;
    }
  }

  .timeline-steps {
    display: flex;
    justify-content: space-between;
    position: relative;
    padding: 0 20px;

    &::before {
      content: '';
      position: absolute;
      top: 20px;
      left: 60px;
      right: 60px;
      height: 2px;
      background: ${BORDER_COLOR};
      z-index: 0;
    }

    .timeline-step {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;

      .step-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f0f0f0;
        border: 2px solid ${BORDER_COLOR};
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        font-size: 18px;
        color: ${TEXT_GRAY};
        transition: all 0.3s ease;

        &.active {
          background: ${WALKZY_BLUE};
          border-color: ${WALKZY_BLUE};
          color: #fff;
          box-shadow: 0 4px 12px rgba(26, 148, 255, 0.3);
        }

        &.completed {
          background: ${SUCCESS_COLOR};
          border-color: ${SUCCESS_COLOR};
          color: #fff;
        }
      }

      .step-label {
        font-size: 13px;
        color: ${TEXT_DARK};
        font-weight: 500;
        text-align: center;
        margin-bottom: 4px;
      }

      .step-description {
        font-size: 12px;
        color: ${TEXT_GRAY};
        text-align: center;
        line-height: 1.4;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 24px 16px;

    .timeline-steps {
      flex-direction: column;
      gap: 20px;

      &::before {
        display: none;
      }

      .timeline-step {
        flex-direction: row;
        align-items: flex-start;
        text-align: left;
        width: 100%;

        .step-icon {
          margin-right: 16px;
          margin-bottom: 0;
        }
      }
    }
  }
`

export const WrapperOrderInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`

export const WrapperInfoCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${BORDER_COLOR};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    .card-icon {
      font-size: 20px;
      color: ${WALKZY_BLUE};
      background: #f0f7ff;
      padding: 10px;
      border-radius: 8px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: ${TEXT_DARK};
    }
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-size: 14px;
      color: ${TEXT_GRAY};
      font-weight: 400;
    }

    .info-value {
      font-size: 14px;
      color: ${TEXT_DARK};
      font-weight: 500;
      text-align: right;
      max-width: 60%;
      word-break: break-word;
    }
  }
`

export const WrapperProductsList = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${BORDER_COLOR};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;

  .products-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    .header-icon {
      font-size: 20px;
      color: ${WALKZY_BLUE};
      background: #f0f7ff;
      padding: 10px;
      border-radius: 8px;
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: ${TEXT_DARK};
    }

    .product-count {
      margin-left: auto;
      font-size: 14px;
      color: ${TEXT_GRAY};
    }
  }

  .products-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
`

export const WrapperProductItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: ${BORDER_COLOR};
  }

  .product-image {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid ${BORDER_COLOR};
    flex-shrink: 0;
  }

  .product-info {
    flex: 1;
    min-width: 0;

    .product-name {
      font-size: 15px;
      font-weight: 500;
      color: ${TEXT_DARK};
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.4;
    }

    .product-details {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 13px;
      color: ${TEXT_GRAY};

      .detail-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .product-price {
    text-align: right;
    flex-shrink: 0;

    .price-value {
      font-size: 16px;
      font-weight: 700;
      color: #ee4d2d;
      margin-bottom: 4px;
    }

    .price-quantity {
      font-size: 13px;
      color: ${TEXT_GRAY};
    }
  }
`

export const WrapperTotalCard = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${BORDER_COLOR};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;

  .total-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    .total-icon {
      font-size: 20px;
      color: ${WALKZY_BLUE};
      background: #f0f7ff;
      padding: 10px;
      border-radius: 8px;
    }

    .total-title {
      font-size: 16px;
      font-weight: 600;
      color: ${TEXT_DARK};
    }
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: ${TEXT_DARK};

    &:last-child {
      margin-bottom: 0;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
      margin-top: 12px;
    }

    .total-label {
      font-weight: 400;
      color: ${TEXT_GRAY};
    }

    .total-value {
      font-weight: 600;
      color: ${TEXT_DARK};
    }

    &.final-total {
      .total-label {
        font-size: 18px;
        font-weight: 600;
        color: ${TEXT_DARK};
      }

      .total-value {
        font-size: 24px;
        font-weight: 700;
        color: #ee4d2d;
        letter-spacing: -0.5px;
      }
    }
  }
`

export const WrapperActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;

  .action-button {
    min-width: 200px;
    height: 48px;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    &.primary {
      background: ${WALKZY_BLUE};
      color: #fff;
      border: none;
      box-shadow: 0 4px 12px rgba(26, 148, 255, 0.3);

      &:hover {
        background: #0d7ae6;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(26, 148, 255, 0.4);
      }
    }

    &.secondary {
      background: #fff;
      color: ${WALKZY_BLUE};
      border: 2px solid ${WALKZY_BLUE};

      &:hover {
        background: #f0f7ff;
        transform: translateY(-2px);
      }
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;

    .action-button {
      width: 100%;
    }
  }
`
