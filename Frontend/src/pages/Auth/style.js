import styled from "styled-components";
import { motion } from 'framer-motion';

export const AuthFrame = styled.div`
  width: 100%;
  min-height: 640px;
  border-radius: 26px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 30px 90px rgba(0,0,0,0.18);
  background: #0b0964ff;
  display: grid;
  grid-template-columns: 1.35fr 0.85fr;

  /* Improve rendering performance during animations */
  will-change: transform;
  transform: translateZ(0);

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    min-height: 680px;
  }
`;

export const BrandSide = styled.div`
  position: relative;
  padding: 34px 34px;
  color: #fff;

  background:
    linear-gradient(90deg, rgba(11, 34, 87, 0.85) 0%, rgba(245, 245, 245, 0) 55%, rgba(255, 255, 255, 0) 100%),
    url('/images/auth-fashion.jpg');

  /* Hint the browser to composite this layer to avoid repaint glitches */
  will-change: transform, background-position;
  transform: translateZ(0);

  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  @media (max-width: 992px) {
    min-height: 280px;
  }
`;

export const BrandTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const BrandName = styled.div`
  font-family: ui-serif, Georgia, serif;
  font-weight: 600;
  letter-spacing: 0.2px;
  font-size: 20px;
  opacity: 0.95;
`;

export const CloseButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #1677ff 0%, #36a3ff 100%);
  color: #fff;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  box-shadow: 0 8px 20px rgba(17,99,255,0.12);

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 12px 28px rgba(17,99,255,0.16);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(22,119,255,0.12);
  }
`;

export const BrandMenu = styled.div`
  margin-top: 34px;
  max-width: 220px;
`;

export const BrandMenuTitle = styled.div`
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 12px;
  opacity: 0.95;
`;

export const BrandMenuItem = styled.div`
  font-size: 14px;
  opacity: 0.9;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.18);
`;

export const AuthSide = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 34px 30px;

  @media (max-width: 992px) {
    padding: 22px 18px 32px;
  }
`;

export const AuthCard = styled.div`
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  padding: 28px 26px;
  color: #fff;

  /* Semi-transparent glass card */
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);

  /* subtle shadow for contrast on various backgrounds */
  box-shadow: 0 12px 30px rgba(2,6,23,0.12);

  backdrop-filter: blur(6px);
`;

export const MotionAuthCard = styled(motion.div)`
  width: 100%;
  max-width: 420px;
  border-radius: 18px;
  padding: 28px 26px;
  color: #fff;

  /* Semi-transparent glass card */
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);

  /* subtle shadow for contrast on various backgrounds */
  box-shadow: 0 12px 30px rgba(2,6,23,0.12);

  backdrop-filter: blur(6px);

  /* Performance hints to keep animations smooth */
  will-change: transform;
  backface-visibility: hidden;
  transform: translateZ(0);
`;


export const AuthSmallTitle = styled.div`
  font-size: 12px;
  letter-spacing: 0.8px;
  opacity: 0.85;
  text-transform: uppercase;
`;

export const AuthTitle = styled.div`
  font-size: 22px;
  font-weight: 800;
  margin-top: 6px;
  margin-bottom: 18px;
`;

export const Muted = styled.div`
  font-size: 13px;
  opacity: 0.8;
`;

export const LinkText = styled.span`
  color: #fff;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 600;
  opacity: 0.95;

  &:hover {
    opacity: 1;
  }
`;

export const OrRow = styled.div`
  margin: 18px 0 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.85;

  span {
    font-size: 12px;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  i {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.18);
  }
`;

export const FormError = styled.div`
  background: rgba(255, 77, 79, 0.14);
  border: 1px solid rgba(255, 77, 79, 0.35);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 14px;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
`;
