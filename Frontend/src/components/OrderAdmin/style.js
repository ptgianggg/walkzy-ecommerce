import { Upload } from "antd";
import styled from "styled-components";

const fontFamily = "'Inter', 'Roboto', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";

// Keyframes for animations
const slideInDown = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

export const WrapperHeader = styled.div`
  ${slideInDown}
  background: linear-gradient(135deg, #1890ff 0%, #001a33 100%);
  color: white;
  padding: 40px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(24, 144, 255, 0.15);
  animation: slideInDown 0.5s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(100px, -100px);
  }
  
  h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    font-family: ${fontFamily};
    position: relative;
    z-index: 1;
    letter-spacing: -0.5px;
  }
  
  p {
    margin: 12px 0 0 0;
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    font-family: ${fontFamily};
    position: relative;
    z-index: 1;
  }

  @media (max-width: 1024px) {
    padding: 32px 20px;
    h1 {
      font-size: 28px;
    }
    p {
      font-size: 13px;
    }
  }

  @media (max-width: 768px) {
    padding: 24px 16px;
    margin-bottom: 16px;
    h1 {
      font-size: 24px;
    }
    p {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    padding: 16px 12px;
    margin-bottom: 12px;
    border-radius: 8px;
    h1 {
      font-size: 18px;
    }
    p {
      font-size: 11px;
      margin-top: 8px;
    }
  }
`;

export const WrapperContainer = styled.div`
  ${fadeIn}
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: fadeIn 0.4s ease-out;
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 768px) {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 8px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    margin-bottom: 12px;
    border-radius: 6px;
  }
`;

export const WrapperSearchSection = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  font-family: ${fontFamily};
  
  .search-input-wrapper {
    flex: 1;
    min-width: 200px;

    .ant-input-affix-wrapper {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      transition: all 0.3s ease;
      font-size: 14px;

      &:hover {
        border-color: #1890ff;
      }

      &:focus-within {
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
      }
    }
  }
  
  .ant-input,
  .ant-select,
  .ant-btn {
    font-family: ${fontFamily};
    transition: all 0.3s ease;
    border-radius: 8px;
  }

  .ant-select-selector {
    border-radius: 8px !important;
    border: 1px solid #e0e0e0 !important;
    transition: all 0.3s ease;

    &:hover {
      border-color: #1890ff !important;
    }
  }

  .ant-btn {
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  @media (max-width: 1024px) {
    gap: 8px;
    
    .search-input-wrapper {
      min-width: 150px;
    }

    .ant-select {
      min-width: 100px !important;
    }

    .ant-btn {
      padding: 0 10px !important;
      font-size: 13px;
    }
  }

  @media (max-width: 768px) {
    gap: 8px;
    
    .search-input-wrapper {
      flex: 1;
      min-width: 100%;
      order: 1;
    }

    .ant-select {
      flex: 1;
      min-width: calc(50% - 4px);
      order: 2;
    }

    .ant-btn {
      flex: 1;
      min-width: calc(50% - 4px);
      order: 3;
      padding: 0 8px !important;
      font-size: 12px;
    }

    .ant-btn:nth-child(4) {
      order: 3;
    }

    .ant-btn:nth-child(5) {
      order: 4;
    }
  }

  @media (max-width: 480px) {
    gap: 6px;
    
    .search-input-wrapper {
      min-width: 100%;
      order: 1;

      .ant-input-affix-wrapper {
        font-size: 13px;
      }
    }

    .ant-select {
      flex: 1 0 calc(50% - 3px);
      min-width: 0 !important;
      order: 2;
      font-size: 12px;
    }

    .ant-btn {
      flex: 1 0 calc(50% - 3px);
      min-width: 0;
      order: 3;
      padding: 0 4px !important;
      font-size: 11px;
      height: 32px;
    }
  }
`;

export const WrapperTableSection = styled.div`
  ${fadeIn}
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  animation: fadeIn 0.4s ease-out;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  font-family: ${fontFamily};

  .ant-table-wrapper {
    min-width: clamp(1200px, 92vw, 1400px);
  }

  .ant-table-container {
    overflow-x: auto;
  }

  .ant-table-content {
    min-width: clamp(1200px, 92vw, 1400px);
  }

  .ant-table-content table {
    min-width: clamp(1200px, 92vw, 1400px);
    width: max-content;
  }

  .ant-table {
    background: white;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .ant-table-thead > tr > th {
    background: #fafafa;
    color: #262626;
    font-weight: 600;
    border-bottom: 2px solid #f0f0f0;
    font-family: ${fontFamily};
    padding: 16px 12px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ant-table-tbody > tr {
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      background: #f8f9ff;
      box-shadow: inset 0 0 0 1px #e6f2ff;
    }

    > td {
      padding: 14px 12px;
      font-family: ${fontFamily};
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .ant-table-cell {
    font-family: ${fontFamily};
    vertical-align: middle;
  }

  .ant-pagination {
    margin-top: 16px;
    text-align: right;
    font-family: ${fontFamily};
  }

  @media (max-width: 1024px) {
    .ant-table-thead > tr > th {
      padding: 12px 8px;
      font-size: 12px;
    }

    .ant-table-tbody > tr > td {
      padding: 10px 8px;
      font-size: 13px;
    }
  }

  @media (max-width: 768px) {
    padding: 12px;
    overflow-x: auto;

    .ant-table {
      font-size: 12px;
    }

    .ant-table-thead > tr > th {
      padding: 8px 6px;
      font-size: 11px;
      white-space: nowrap;
    }

    .ant-table-cell {
      padding: 8px 4px !important;
      font-size: 12px;
    }

    .ant-table-tbody > tr > td {
      padding: 8px 4px !important;
    }

    .ant-btn {
      font-size: 12px !important;
      padding: 4px 8px !important;
      height: auto !important;
    }

    .ant-pagination-item,
    .ant-pagination-prev,
    .ant-pagination-next {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    padding: 8px;

    .ant-table {
      font-size: 11px;
    }

    .ant-table-thead > tr > th {
      padding: 6px 3px;
      font-size: 10px;
      white-space: nowrap;
    }

    .ant-table-cell {
      padding: 6px 2px !important;
      font-size: 11px;
    }

    .ant-table-tbody > tr > td {
      padding: 6px 2px !important;
    }

    .ant-btn {
      font-size: 11px !important;
      padding: 2px 4px !important;
      height: auto !important;
      min-width: auto !important;
    }

    .ant-tag {
      font-size: 10px;
      padding: 2px 6px;
    }

    .ant-pagination-item,
    .ant-pagination-prev,
    .ant-pagination-next {
      font-size: 11px;
      min-width: 24px;
      height: 24px;
      line-height: 24px;
    }
  }
`;

export const WrapperDrawerContent = styled.div`
  ${fadeIn}
  font-family: ${fontFamily};
  animation: fadeIn 0.3s ease-out;
  
  .ant-drawer-body {
    padding: 24px;
    background: #fafafa;
  }

  .ant-descriptions {
    font-family: ${fontFamily};
    background: white;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }
  
  .ant-descriptions-item-label {
    font-weight: 600;
    color: #262626;
    font-family: ${fontFamily};
    background: #fafafa;
  }

  .ant-descriptions-item-content {
    color: #595959;
  }

  .ant-timeline {
    padding: 20px 0;
  }

  .ant-timeline-item {
    padding-bottom: 20px;
  }

  .ant-tabs {
    font-family: ${fontFamily};
  }

  .ant-tabs-tab {
    font-weight: 500;
    padding: 12px 16px !important;
  }

  .ant-card {
    border: none;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    border-radius: 8px;
  }

  .ant-card-head {
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    padding: 12px 16px;
  }

  .ant-card-body {
    padding: 16px;
  }

  @media (max-width: 768px) {
    .ant-drawer-body {
      padding: 16px;
    }

    .ant-descriptions {
      padding: 16px;
      margin-bottom: 16px;
    }

    .ant-descriptions-item-label {
      font-size: 12px;
      font-weight: 600;
    }

    .ant-descriptions-item-content {
      font-size: 13px;
    }

    .ant-tabs-tab {
      padding: 10px 12px !important;
      font-size: 13px;
    }

    .ant-card {
      margin-bottom: 12px;
    }

    .ant-card-head {
      padding: 10px 12px;
      font-size: 13px;
    }

    .ant-card-body {
      padding: 12px;
      font-size: 12px;
    }

    .ant-timeline-item {
      padding-bottom: 16px;
    }
  }

  @media (max-width: 480px) {
    .ant-drawer-body {
      padding: 12px;
    }

    .ant-descriptions {
      padding: 12px;
      margin-bottom: 12px;
    }

    .ant-descriptions-item-label {
      font-size: 11px;
      font-weight: 600;
      width: 100% !important;
    }

    .ant-descriptions-item-content {
      font-size: 12px;
      width: 100% !important;
    }

    .ant-tabs-tab {
      padding: 8px 10px !important;
      font-size: 12px;
    }

    .ant-card {
      margin-bottom: 8px;
    }

    .ant-card-head {
      padding: 8px 10px;
      font-size: 12px;
    }

    .ant-card-body {
      padding: 8px 10px;
      font-size: 11px;
    }

    .ant-btn {
      font-size: 12px !important;
      padding: 4px 8px !important;
      height: 28px !important;
    }

    .ant-form-item {
      margin-bottom: 12px;
    }

    .ant-form-item-label > label {
      font-size: 12px;
    }

    .ant-timeline-item {
      padding-bottom: 12px;
    }
  }
`;

export const WrapperProductCard = styled.div`
  ${fadeIn}
display: flex;
gap: 16px;
padding: 16px;
border: 1px solid #f0f0f0;
border - radius: 8px;
margin - bottom: 12px;
background: white;
font - family: ${fontFamily};
transition: all 0.3s ease;
animation: fadeIn 0.3s ease - out;
box - shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
  border - color: #1890ff;
  box - shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
  transform: translateY(-2px);
}
  
  img {
  width: 90px;
  height: 90px;
  object - fit: cover;
  border - radius: 6px;
  border: 1px solid #f0f0f0;
  flex - shrink: 0;
}

  > div {
  flex: 1;

    > div: first - child {
    font - weight: 600;
    color: #262626;
    margin - bottom: 8px;
    font - size: 15px;
  }
}
`;

export const WrapperModalContent = styled.div`
  ${fadeIn}
font - family: ${fontFamily};
animation: fadeIn 0.3s ease - out;
  
  .ant - form {
  font - family: ${fontFamily};
}
  
  .ant - form - item - label > label {
  font - family: ${fontFamily};
  font - weight: 600;
  color: #262626;
}

  .ant - input,
  .ant - input - number,
  .ant - select - selector,
  .ant - picker {
  border - radius: 6px!important;
  border: 1px solid #d9d9d9!important;
  transition: all 0.3s ease;

    &:hover {
    border - color: #1890ff!important;
  }

    &: focus,
    &: focus - within {
    border - color: #1890ff!important;
    box - shadow: 0 0 0 2px rgba(24, 144, 255, 0.1)!important;
  }
}
`;

export const WrapperStatusBadge = styled.div`
display: inline - flex;
align - items: center;
gap: 6px;
padding: 6px 12px;
border - radius: 20px;
font - size: 12px;
font - weight: 600;
font - family: ${fontFamily};
text - transform: uppercase;
letter - spacing: 0.5px;

  &.pending {
  background: #fff7e6;
  color: #d46b08;
}

  &.confirmed {
  background: #e6f7ff;
  color: #0050b3;
}

  &.processing {
  background: #f6f8fb;
  color: #0050b3;
}

  &.shipped {
  background: #f9f0ff;
  color: #531dab;
}

  &.delivered,
  &.completed {
  background: #f6ffed;
  color: #274d0e;
}

  &.cancelled {
  background: #fff1f0;
  color: #d32f2f;
}

  &.refunded {
  background: #fff7e6;
  color: #d46b08;
}
`;

export const WrapperActionButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;

  .ant-btn {
    border: none;
    background: none;
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
    font-family: ${fontFamily};
  }

  .ant-btn .anticon {
    font-size: 18px;
  }

  .ant-btn:hover {
    transform: scale(1.05);
    background: rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 1024px) {
    gap: 6px;

    .ant-btn {
      padding: 6px 8px;
      border-radius: 8px;
    }

    .ant-btn .anticon {
      font-size: 17px;
    }
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
    gap: 6px;

    .ant-btn {
      padding: 4px 8px;
    }

    .ant-btn .anticon {
      font-size: 16px;
    }
  }

  @media (max-width: 640px) {
    gap: 4px;

    .ant-btn {
      padding: 4px 6px;
      border-radius: 6px;
    }

    .ant-btn .anticon {
      font-size: 15px;
    }
  }

  @media (max-width: 480px) {
    flex: 1;
    justify-content: flex-start;
    gap: 4px;

    .ant-btn {
      padding: 4px 6px;
      min-width: 32px;
    }

    .ant-btn .anticon {
      font-size: 14px;
    }
  }
`;

export const WrapperActionDropdown = styled.div`
display: none;

@media(max - width: 480px) {
  display: flex;
  align - items: center;
  justify - content: center;
  width: 100 %;

    .ant - dropdown {
    width: 100 %;
  }
}
`;

export const WrapperUploadFile = styled(Upload)`
  & .ant - upload.ant - upload - select.ant - upload - select - picture - card {
  width: 60px;
  height: 60px;
  border - radius: 50 %;
}
    & .ant - upload - list - item - container {
  display: none!important;
}
    & .ant - upload - list - item{
  display: none!important;
}
`;
