import styled, { keyframes } from 'styled-components';

const popIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

/* ======================
   CONTAINER & BUTTON
====================== */

export const ChatContainer = styled.div`
  position: fixed;
  right: 24px;
  bottom: 52px; /* align closer to floating button */
  z-index: 1200;
  transition: transform 0.25s ease, opacity 0.25s ease;
`;

export const ChatButton = styled.button`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1250;

  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: radial-gradient(circle at 30% 30%, #38bdf8 0%, #2563eb 55%, #1d4ed8 100%);
  color: #fff;
  box-shadow: 0 18px 38px rgba(37, 99, 235, 0.45);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  cursor: pointer;

  /* hide gracefully when chat window is open */
  opacity: ${(p) => (p.isOpen ? 0 : 1)};
  visibility: ${(p) => (p.isOpen ? 'hidden' : 'visible')};
  pointer-events: ${(p) => (p.isOpen ? 'none' : 'auto')};
  transform: ${(p) => (p.isOpen ? 'translateY(12px) scale(0.96)' : 'none')};
  transition: opacity 0.22s ease, transform 0.22s ease, visibility 0.22s ease, box-shadow 0.22s ease;

  svg {
    transition: transform 0.2s ease;
  }

  &:hover {
    transform: translateY(-2px) scale(1.04);
    box-shadow: 0 22px 44px rgba(37, 99, 235, 0.55);
    svg {
      transform: translateY(-1px);
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

/* ======================
   CHAT WINDOW
====================== */

export const ChatWindow = styled.div`
  width: 420px;
  max-width: calc(100vw - 32px);
  height: 560px;
  max-height: calc(100vh - 32px);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 22px 52px rgba(15, 23, 42, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(8px);
  transform-origin: bottom right;
  animation: ${popIn} 0.28s ease;
`;

/* ======================
   HEADER
====================== */

export const ChatHeader = styled.div`
  padding: 14px 16px;
  background: linear-gradient(120deg, #0f172a 0%, #1d4ed8 55%, #0ea5e9 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.18);
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const HeaderAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 700;
  color: #1d4ed8;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
`;

export const HeaderMeta = styled.div`
  display: flex;
  flex-direction: column;

  .name {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
  }

  .status {
    font-size: 11px;
    opacity: 0.85;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

export const StatusDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
`;

export const HeaderClose = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
  }
`;

/* ======================
   BODY & MESSAGE LIST
====================== */

export const ChatBody = styled.div`
  flex: 1;
  background: radial-gradient(circle at 20% 20%, #f8fafc 0, #eef2ff 25%, transparent 35%),
    linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%);
  overflow-y: auto;
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex: 1;
`;

export const MessageItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  max-width: 100%;
  align-self: ${(p) => (p.isUser ? 'flex-end' : 'flex-start')};
  flex-direction: ${(p) => (p.isUser ? 'row-reverse' : 'row')};
`;

export const MessageAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(p) => (p.isUser ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : '#e2e8f0')};
  color: ${(p) => (p.isUser ? '#e0ecff' : '#1d4ed8')};
  border: 1px solid ${(p) => (p.isUser ? 'rgba(37, 99, 235, 0.35)' : '#e2e8f0')};
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
`;

export const MessageContent = styled.div`
  max-width: 90%;
  width: auto;
  min-width: 0;
  padding: 12px 14px;
  border-radius: ${(p) =>
    p.isUser ? '18px 18px 6px 18px' : '18px 18px 18px 6px'};
  background: ${(p) =>
    p.isUser
      ? 'linear-gradient(135deg, #1e3a8a, #2563eb 60%, #0ea5e9)'
      : '#ffffff'};
  color: ${(p) => (p.isUser ? '#f8fafc' : '#0f172a')};
  border: 1px solid ${(p) => (p.isUser ? 'rgba(37, 99, 235, 0.3)' : '#e2e8f0')};
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
  font-size: 13.5px;
  line-height: 1.6;
  white-space: pre-line;
  word-break: normal;
  overflow-wrap: break-word;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: ${(p) => (p.isUser ? 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent 45%)' : 'transparent')};
    opacity: 0.8;
  }

  ${(p) =>
    p.isError &&
    `
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
    box-shadow: 0 10px 22px rgba(248, 113, 113, 0.15);
  `}

  @media (max-width: 480px) {
    max-width: 95%;
  }
`;

export const MessageTime = styled.div`
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
  opacity: 0.85;
  text-align: ${(p) => (p.isUser ? 'right' : 'left')};
`;

export const FeedbackBar = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;

  button {
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    border-radius: 8px;
    padding: 4px 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s ease;
    font-size: 12px;
  }

  button:hover {
    border-color: #cbd5e1;
    color: #0f172a;
  }

  button.active {
    border-color: #16a34a;
    color: #16a34a;
    background: #dcfce7;
    font-weight: 600;
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .thanks {
    font-size: 11px;
    color: #94a3b8;
  }
`;

export const ContactButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #0f172a;
    text-decoration: none;
    font-size: 12px;
    transition: all 0.2s ease;
  }

  a:hover {
    border-color: #2563eb;
    color: #2563eb;
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.12);
  }
`;

export const InlineProductCard = styled.div`
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 10px;
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  align-items: center;
  margin-top: 6px;

  .thumb {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    overflow: hidden;
    background: #f1f5f9;
    display: grid;
    place-items: center;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .meta {
    display: grid;
    gap: 4px;
  }

  .name {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
  }

  .price {
    font-size: 12px;
    color: #1d4ed8;
    font-weight: 700;
  }

  .remove-btn {
    justify-self: start;
    font-size: 11px;
    color: #ef4444;
    background: transparent;
    border: none;
    cursor: pointer;
  }
`;

/* ======================
   FOOTER & INPUT
====================== */

export const ChatFooter = styled.div`
  padding: 12px 14px 14px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  box-shadow: 0 -8px 22px rgba(15, 23, 42, 0.06);
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 9px 12px;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #2563eb;
    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.12);
    background: #ffffff;
  }
`;

export const Input = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #0f172a;
  padding: 6px 0;

  &::placeholder {
    color: #94a3b8;
  }
`;

export const SendButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid #1d4ed8;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.35);

  svg {
    font-size: 18px;
  }

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 14px 28px rgba(37, 99, 235, 0.45);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ======================
   PRODUCT & PROMOTION
====================== */

export const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: ${(p) =>
    p.single ? 'repeat(1, minmax(140px, 220px))' : 'repeat(auto-fit, minmax(130px, 1fr))'};
  gap: 8px;
  justify-content: ${(p) => (p.single ? 'flex-start' : 'stretch')};
`;

export const ProductCard = styled.div`
  border-radius: 10px;
  padding: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  max-width: 220px;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 26px rgba(15, 23, 42, 0.12);
    border-color: #cbd5e1;
  }

  .product-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 9px;
    overflow: hidden;
    background: #f1f5f9;
    display: grid;
    place-items: center;
  }

  .product-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.25s ease;
  }

  &:hover .product-image-wrapper img {
    transform: scale(1.03);
  }

  .product-info {
    display: grid;
    gap: 5px;
    text-align: center;
    justify-items: center;
  }

  .product-name {
    font-size: 12px;
    font-weight: 700;
    line-height: 1.3;
    color: #0f172a;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-align: center;
  }

  .product-price {
    font-size: 11.5px;
    font-weight: 700;
    color: #2563eb;
    display: flex;
    align-items: baseline;
    gap: 6px;
    justify-content: center;
  }

  .original-price {
    text-decoration: line-through;
    color: #94a3b8;
    font-weight: 500;
  }

  .current-price {
    color: #1d4ed8;
    font-weight: 800;
    font-size: 12.5px;
  }

  .product-rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    border-radius: 8px;
    background: #eef2ff;
    color: #1d4ed8;
    font-weight: 600;
    font-size: 11.5px;
    width: fit-content;
    justify-content: center;
    margin: 0 auto;
  }
`;

export const PromotionList = styled.div`
  display: grid;
  gap: 8px;
`;

export const PromotionCard = styled.div`
  padding: 12px;
  border-radius: 12px;
  background: #eef2ff;
  border: 1px dashed #cbd5e1;
  font-size: 12px;
  display: grid;
  gap: 6px;

  .promotion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .promotion-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #1d4ed8;
  }

  .promotion-code {
    padding: 4px 8px;
    border-radius: 8px;
    border: 1px dashed #1d4ed8;
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.06);
    font-weight: 700;
  }

  .promotion-discount {
    color: #0f172a;
    font-weight: 700;
  }

  .promotion-description,
  .promotion-condition,
  .promotion-expiry {
    color: #475569;
    line-height: 1.45;
  }
`;

/* ======================
   LOADING
====================== */

const pulse = keyframes`
  0% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
`;

export const LoadingDots = styled.div`
  display: inline-flex;
  gap: 4px;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
    animation: ${pulse} 1.4s infinite;
  }

  span:nth-child(2) {
    animation-delay: 0.2s;
  }

  span:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
`;

export const InputHint = styled.div`
  font-size: 12px;
  color: #94a3b8;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.4;
`;

export const SuggestionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
  padding: 8px;
  border: 1px dashed #dbeafe;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  position: sticky;
  top: 0;
  z-index: 2;
  backdrop-filter: blur(6px);
`;

export const SuggestionChip = styled.button`
  border: 1px solid #bae6fd;
  background: #e0f2fe;
  color: #0f172a;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #dbeafe;
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(59, 130, 246, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

/* ======================
   ATTACHMENTS
====================== */

export const AttachmentBar = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 6px 0;
`;

export const AttachmentThumb = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  display: grid;
  place-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.72);
    color: #fff;
    display: grid;
    place-items: center;
    cursor: pointer;
    padding: 0;
  }
`;
