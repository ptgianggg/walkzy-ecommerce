import styled from 'styled-components';

const PRIMARY = '#0A2540';           // --primary (footer background)
const PRIMARY_HOVER = '#163A5F';     // --primary-hover
const PRIMARY_DARK = PRIMARY_HOVER;  // legacy name kept for compatibility
const ACCENT = '#00C2FF';            // --accent (links, logo)
const TEXT_LIGHT = '#ffffff';
const BORDER_FAINT = 'rgba(255,255,255,0.06)';

export const WrapperFooter = styled.footer`
  background: ${PRIMARY};
  color: ${TEXT_LIGHT};
  margin-top: 60px;
  border-top: 1px solid ${BORDER_FAINT};
`;

export const WrapperFooterTop = styled.div`
  padding: 48px 0 30px;
  background: ${PRIMARY};
`;

export const WrapperFooterContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`;

export const WrapperFooterColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 40px 60px;

  @media (max-width: 992px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 40px;
  }

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 28px;
  }
`;

export const WrapperFooterColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

export const WrapperFooterTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 18px;
  color: ${TEXT_LIGHT};
  position: relative;
  padding-bottom: 6px;

  &::after {
    content: '';
    display: block;
    width: 80px;
    height: 2px;
    background: ${ACCENT};
    margin-top: 6px;
  }
`;

export const WrapperFooterLink = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  text-align: left;

  color: rgba(255,255,255,0.9);
  font-size: 14px;
  margin-bottom: 8px;
  cursor: pointer;
  line-height: 1.6;
  transition: color 0.25s ease, transform 0.2s ease;

  &:hover {
    color: ${ACCENT};
    transform: translateX(2px);
  }

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

export const WrapperFooterText = styled.p`
  color: #666;
  font-size: 13px;
  line-height: 1.7;
  margin: 0 0 12px;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const WrapperFooterSocial = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 18px;

  a {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.95);
    font-size: 18px;
    transition: all 0.22s cubic-bezier(.2,.9,.2,1);
    box-shadow: 0 2px 6px rgba(2,6,23,0.24);

    &:hover {
      transform: translateY(-3px) scale(1.02);
      filter: brightness(1.05);
      border-color: rgba(255,255,255,0.95);
    }
  }

  /* Ensure uploaded image/SVG icons render with their own colors
     (prevent SVGs using "currentColor" from inheriting the white color of the parent) */
  img {
    width: 22px;
    height: 22px;
    object-fit: contain;
    display: block;
    color: initial; /* reset color so SVGs don't inherit parent color */
    filter: none;
  }

  a.tiktok {
    background: linear-gradient(135deg, #69C9D0 0%, #EE1D52 100%);
    color: #ffffff;
    border: none;
  }

  a.tiktok:hover {
    filter: brightness(0.95);
    transform: translateY(-3px) scale(1.04);
  }
`;

export const WrapperFooterLogo = styled.div`
  margin-bottom: 10px;
  display: flex;
  justify-content: center;

  .logo-text {
    font-size: 26px;
    font-weight: 700;
    color: ${ACCENT};
    letter-spacing: 1.5px;
  }
`;

export const WrapperFooterBottom = styled.div`
  border-top: 1px solid ${BORDER_FAINT};
  padding: 18px 0 24px;
  background: ${PRIMARY};
`;

export const WrapperFooterBottomContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

export const WrapperContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;

  .icon {
    font-size: 16px;
    color: ${ACCENT};
    margin-top: 2px;
    flex-shrink: 0;
  }

  .text {
    font-size: 13px;
    color: #555;
    line-height: 1.6;
  }
`;
