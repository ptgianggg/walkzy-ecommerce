import styled from "styled-components";
import { Tabs } from "antd";

const WALKZY_BLUE = '#1a94ff'
const BORDER_COLOR = '#e8e8e8'
const TEXT_GRAY = '#666'
const TEXT_DARK = '#1a1a1a'
const SUCCESS_COLOR = '#52c41a'
const WARNING_COLOR = '#faad14'
const ERROR_COLOR = '#ff4d4f'

export const WrapperMyOrderContainer = styled.div`
  background: linear-gradient(to bottom, #f8f9fa 0%, #f5f5f5 100%);
  width: 100%;
  min-height: 100vh;
  padding: 20px 0 40px;

  .my-order-content {
    max-width: 1320px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 0 4px;

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: ${TEXT_DARK};
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      letter-spacing: -0.3px;

      @media (max-width: 768px) {
        font-size: 20px;
        gap: 8px;
      }
    }
  }
`

export const WrapperTabs = styled(Tabs)`
  .ant-tabs-nav {
    background: #fff;
    padding: 0 20px;
    border-radius: 12px 12px 0 0;
    border: 1px solid ${BORDER_COLOR};
    border-bottom: none;
    margin-bottom: 0;
  }

  .ant-tabs-tab {
    padding: 16px 24px;
    font-size: 15px;
    font-weight: 500;
    color: ${TEXT_GRAY};
    transition: all 0.2s ease;

    &:hover {
      color: ${WALKZY_BLUE};
    }

    &.ant-tabs-tab-active {
      .ant-tabs-tab-btn {
        color: ${WALKZY_BLUE};
        font-weight: 600;
      }
    }

    @media (max-width: 768px) {
      padding: 12px 14px;
      font-size: 14px;
    }
  }

  .ant-tabs-ink-bar {
    background: ${WALKZY_BLUE};
    height: 3px;
  }

  .ant-tabs-content-holder {
    background: #fff;
    border: 1px solid ${BORDER_COLOR};
    border-top: none;
    border-radius: 0 0 12px 12px;
    padding: 24px;
    min-height: 400px;
  }
`

export const WrapperListOrder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const WrapperItemOrder = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid ${BORDER_COLOR};
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`

export const WrapperOrderHeader = styled.div`
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid ${BORDER_COLOR};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  .order-info {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .order-id {
      font-size: 14px;
      color: ${TEXT_GRAY};
      
      .order-id-label {
        color: ${TEXT_DARK};
        font-weight: 600;
        margin-right: 8px;
      }
    }

    .order-date {
      font-size: 13px;
      color: ${TEXT_GRAY};
    }
  }

  .order-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

export const StatusBadge = styled.span`
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  &.pending {
    background: #fff7e6;
    color: #d46b08;
    border: 1px solid #ffd591;
  }

  &.confirmed {
    background: #e6f7ff;
    color: #1890ff;
    border: 1px solid #91d5ff;
  }

  &.shipped {
    background: #fffbe6;
    color: #d4b106;
    border: 1px solid #ffe58f;
  }

  &.in_transit,
  &.out_for_delivery,
  &.shipping,
  &.picked_up {
    background: #e6f7ff;
    color: #096dd9;
    border: 1px solid #91d5ff;
  }

  &.ready_to_pick,
  &.waiting_pickup,
  &.processing {
    background: #fffbe6;
    color: #d48806;
    border: 1px solid #ffe58f;
  }

  &.delivered {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }

  &.completed {
    background: #f6ffed;
    color: #52c41a;
    border: 1px solid #b7eb8f;
  }

  &.cancelled {
    background: #fff1f0;
    color: #ff4d4f;
    border: 1px solid #ffccc7;
  }

  &.returned {
    background: #fff7e6;
    color: #d46b08;
    border: 1px solid #ffd591;
  }
`

export const WrapperProductsList = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }
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
      cursor: pointer;

      &:hover {
        color: ${WALKZY_BLUE};
      }
    }

    .product-variation {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 13px;
      color: ${TEXT_GRAY};
      margin-bottom: 6px;

      .variation-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .product-quantity {
      font-size: 13px;
      color: ${TEXT_GRAY};
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

    .price-unit {
      font-size: 13px;
      color: ${TEXT_GRAY};
    }
  }
`

export const WrapperOrderFooter = styled.div`
  padding: 20px;
  background: #fafafa;
  border-top: 1px solid ${BORDER_COLOR};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  .total-section {
    display: flex;
    align-items: center;
    gap: 8px;

    .total-label {
      font-size: 15px;
      color: ${TEXT_GRAY};
      font-weight: 500;
    }

    .total-price {
      font-size: 20px;
      font-weight: 700;
      color: #ee4d2d;
      letter-spacing: -0.3px;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
`

export const ActionButton = styled.button`
  padding: 10px 18px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 160ms cubic-bezier(.2,.9,.3,1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  min-width: 120px;
  justify-content: center;

  &.primary {
    background: ${WALKZY_BLUE};
    color: #fff;
    box-shadow: 0 6px 18px rgba(26, 148, 255, 0.12);

    &:hover:not(:disabled) {
      background: #218be8;
      transform: translateY(-1px);
      box-shadow: 0 10px 30px rgba(26, 148, 255, 0.14);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 6px 20px rgba(26, 148, 255, 0.12);
    }
  }

  &.secondary {
    background: #ffffff;
    color: ${WALKZY_BLUE};
    border: 1px solid rgba(26, 148, 255, 0.16);
    box-shadow: 0 2px 8px rgba(10, 28, 64, 0.04);

    &:hover:not(:disabled) {
      background: #f7fbff;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }

  &.danger {
    background: #fff;
    color: ${ERROR_COLOR};
    border: 1px solid rgba(255, 77, 79, 0.16);

    &:hover:not(:disabled) {
      background: #fff7f7;
      transform: translateY(-1px);
    }
  }

  &.success {
    background: ${SUCCESS_COLOR};
    color: #fff;
    box-shadow: 0 6px 18px rgba(82, 196, 26, 0.12);

    &:hover:not(:disabled) {
      background: #5db11b;
      transform: translateY(-1px);
      box-shadow: 0 10px 30px rgba(82, 196, 26, 0.12);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
`

export const WrapperEmptyState = styled.div`
  text-align: center;
  padding: 80px 20px;
  color: ${TEXT_GRAY};

  .empty-icon {
    font-size: 80px;
    color: #d9d9d9;
    margin-bottom: 16px;
  }

  .empty-text {
    font-size: 16px;
    color: ${TEXT_GRAY};
    margin-bottom: 24px;
  }
`

// Backward compatibility
export const WrapperContainer = styled.div`
  background: #f5f5fa;
  width: 100%;
  min-height: 100vh;
  padding: 20px 0;
`

export const WrapperStatus = styled.div`
  padding: 12px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const WrapperHeaderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
`

export const WrapperFooterItem = styled.div`
  border-top: 1px dashed #e0e0e0;
  padding: 16px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
`
