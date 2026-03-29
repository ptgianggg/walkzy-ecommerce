import styled from 'styled-components';

const PRIMARY = '#0A2540';           // --primary (màu chủ đạo)
const PRIMARY_DARK = '#163A5F';      // --primary-hover
const ACCENT = '#1447a5ff';            // --accent
const PRIMARY_LIGHT = '#cedbe6ff';     // subtle light background

const BORDER_TOP_COLOR = PRIMARY_DARK;      // thanh trên cùng
const BRAND_ORANGE = ACCENT;               // accent / màu logo / viền giỏ hàng
const TEXT_PRIMARY = '#222';
const BORDER_COLOR = '#e5e5e5';

const CONTAINER_MAX_WIDTH = '1270px';
const CONTAINER_PADDING_X = '20px';

export const WrapperHeaderContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 1000;
  background: ${PRIMARY_LIGHT};
  border-top: 4px solid ${BORDER_TOP_COLOR};
  border-bottom: 1px solid ${BORDER_COLOR};
`;

/* Nếu sau này cần top bar thì vẫn dùng được, hiện tại component không render */
export const WrapperTopBar = styled.div`
  display: none;
`;

/* Hàng chính: logo – search – action phải */
export const WrapperMainHeader = styled.div`
  background: transparent;

  > div {
    max-width: ${CONTAINER_MAX_WIDTH};
    margin: 0 auto;
    padding: 12px ${CONTAINER_PADDING_X};
    display: flex;
    align-items: center;
    gap: 20px;
  }

  @media (max-width: 992px) {
    > div {
      gap: 12px;
    }
  }

  @media (max-width: 768px) {
    > div {
      padding: 8px 12px;
      flex-wrap: wrap;
      justify-content: space-between;
    }
  }
`;

export const WrapperLogo = styled.div`
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;

  span {
    font-size: 26px;
    font-weight: 800;
    color: ${PRIMARY_DARK};
    letter-spacing: 1.5px;
  }

  @media (max-width: 768px) {
    order: 1;
    span {
      font-size: 20px;
    }
  }
`;

/* Ô search kiểu “Bạn cần tìm gì...” nền xám nhạt, bo tròn */
export const WrapperSearchContainer = styled.div`
  flex: 1;
  max-width: 650px;
  position: relative;

  @media (max-width: 768px) {
    order: 3;
    width: 100% !important;
    max-width: 100% !important;
    margin: 8px 0 0 0 !important;
    flex: none !important;
  }

  .ant-input-search {
    width: 100%;
  }

  .ant-input-group {
    border-radius: 999px;
    background: #f5f5f5;
    border: 1px solid rgba(10,37,64,0.06);
    overflow: hidden;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }

  .ant-input-group:hover {
    border-color: ${PRIMARY_DARK};
  }

  /* Focus state when input has focus */
  .ant-input-group:focus-within {
    border-color: ${ACCENT};
    box-shadow: 0 6px 18px rgba(10,37,64,0.06);
  }

  .ant-input {
    border: none;
    box-shadow: none;
    background: transparent;
    height: 40px;
    padding: 0 16px;
    font-size: 14px;
    color: ${TEXT_PRIMARY};
  }

  .ant-input::placeholder {
    color: rgba(0,0,0,0.45);
  }

  .ant-input:focus {
    outline: none;
    box-shadow: none;
  }

  .ant-input-group-addon {
    background: transparent;
    padding: 0 10px;
  }

  .ant-input-group-addon .ant-btn {
    border: none;
    background: transparent;
    box-shadow: none;
    height: 40px;
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    color: ${PRIMARY_DARK};
  }

  /* Ensure the search icon is visible and uses our theme colors */
  .ant-input-group-addon .ant-btn .anticon {
    color: ${PRIMARY_DARK};
    font-size: 18px;
  }

  .ant-input-group-addon .ant-btn:hover {
    background: transparent;
    color: ${ACCENT};
  }

  .ant-input-group-addon .ant-btn:hover .anticon {
    color: ${ACCENT};
  }

  @media (max-width: 1024px) {
    margin: 0 24px;
  }

  @media (max-width: 768px) {
    margin: 0 8px;
  }
`;

/* Hàng nav bên dưới (Flash Sale, Danh mục...) – giữ nguyên, chỉ làm gọn */
export const WrapperNavMenu = styled.nav`
  background: transparent;

  > div {
    max-width: ${CONTAINER_MAX_WIDTH};
    margin: 0 auto;
    padding: 6px ${CONTAINER_PADDING_X};
    display: flex;
    align-items: center;
    gap: 12px;
    overflow-x: auto;
  }

  @media (max-width: 768px) {
    border-top: 1px solid ${BORDER_COLOR};
  }
`;

export const WrapperNavItem = styled.div`
  position: relative;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 14px;
  color: ${TEXT_PRIMARY};
  white-space: nowrap;
  font-weight: 600;
  border: none;
  border-radius: 0;
  background: transparent;
  transition: color 0.18s ease, transform 0.18s ease;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 2px;
    height: 2px;
    background: linear-gradient(90deg, ${PRIMARY_DARK}, ${ACCENT});
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 0.2s ease;
    border-radius: 2px;
  }

  &:hover {
    color: ${BRAND_ORANGE};
    transform: translateY(-2px);
  }

  &:hover:after {
    transform: scaleX(1);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

/* Cụm link bên phải: Tài khoản – Yêu thích – Giỏ hàng */
export const WrapperActionBar = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 18px;

  @media (max-width: 768px) {
    margin-left: 0;
    order: 2;
    gap: 8px;
  }
`;

export const HeaderLink = styled.button`
  border: none;
  background: transparent;
  padding: 6px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 11px;
  color: #444;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${ACCENT};
  }

  .icon {
    font-size: 20px;
    margin-bottom: 2px;
  }

  span {
    font-weight: 500;
  }

  @media (max-width: 768px) {
    span {
      display: none; 
    }
    .icon {
      font-size: 22px;
    }
  }
`;

export const CartButton = styled(HeaderLink)`
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid ${BRAND_ORANGE};
  color: ${TEXT_PRIMARY};
  font-weight: 600;

  @media (max-width: 768px) {
    border: none;
    padding: 0;
  }
`;

/* Mobile nút “Danh mục” trong nav */
export const WrapperMobileMenuButton = styled.div`
  display: none;
  cursor: pointer;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 600;
  color: ${TEXT_PRIMARY};
  border-radius: 20px;
  border: 1px solid ${BORDER_COLOR};
  background: #fafafa;

  @media (max-width: 768px) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
`;

/* Cart dropdown + item (giữ như cũ) */
export const WrapperCartDropdown = styled.div`
  max-width: 400px;
  max-height: 500px;
  border-radius: 4px;
  overflow: hidden;
`;

export const WrapperCartItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid ${BORDER_COLOR};

  &:hover {
    background: #fafafa;
  }
`;

/* (Nếu cần dùng lại) – chỉ để không lỗi import cũ */
export const ActionChip = styled.div``;
export const WrapperSearchSuggestions = styled.div``;

/* Thin divider between header and page content */
export const HeaderDivider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(10,37,64,0.06);
  margin: 0;
`;
