import styled, { css, keyframes } from 'styled-components'
import { Button } from 'antd'

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const rowPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.25); }
  100% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
`

const tone = {
  blue: {
    bg: '#e0f2fe',
    color: '#0ea5e9',
    border: '#bae6fd'
  },
  green: {
    bg: '#e0fdf4',
    color: '#0f9f6e',
    border: '#bbf7d0'
  }
}

export const Page = styled.div`
  font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding: 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #f4f6fb 45%, #f8fafc 100%);
  color: #0f172a;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`

export const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Title = styled.h1`
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
`

export const Subtitle = styled.div`
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
`

export const ActionsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`

export const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  .ant-btn {
    height: 40px;
    border-radius: 10px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    .anticon {
      font-size: 16px;
    }
    padding: 0 16px;
  }
  .ant-btn-primary {
    background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.25);
  }
  .ant-btn.ghost {
    background: #eef2ff;
    color: #1d4ed8;
    border-color: #c7d2fe;
    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.15);
  }
`

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
`

export const StatCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
`

export const StatIcon = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-size: 20px;
  ${({ $tone }) => {
    const c = tone[$tone] || tone.blue
    return css`
      background: ${c.bg};
      color: ${c.color};
      border: 1px solid ${c.border};
    `
  }}
`

export const StatLabel = styled.div`
  color: #6b7280;
  font-weight: 600;
  font-size: 13px;
`

export const StatValue = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
`

export const CreateCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
    border-color: #d4d4d8;
  }
`

export const CreateIcon = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: #e0e7ff;
  color: #1d4ed8;
  display: grid;
  place-items: center;
  font-size: 22px;
  box-shadow: inset 0 0 0 1px #c7d2fe;
`

export const CreateTitle = styled.div`
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
`

export const CreateSubtitle = styled.div`
  color: #6b7280;
  font-size: 14px;
`

export const TabWrap = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 8px 12px;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);

  .ant-tabs-nav {
    margin: 0;
  }

  .ant-tabs-nav-list {
    gap: 10px;
  }

  .ant-tabs-tab {
    padding: 10px 16px;
    border-radius: 12px;
    font-weight: 700;
    color: #475569;
    transition: all 0.2s ease;
    height: 46px;
    align-items: center;
  }

  .ant-tabs-tab:hover {
    color: #1d4ed8;
    background: #f8fafc;
  }

  .ant-tabs-tab-active {
    background: #e0ecff;
    color: #1d4ed8;
    box-shadow: inset 0 -2px 0 #2563eb;
  }

  .ant-tabs-ink-bar {
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, #2563eb, #1d4ed8);
  }
`

export const FadeWrap = styled.div`
  animation: ${fadeIn} 0.35s ease;
`

export const TableShell = styled.div`
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
  padding: 14px 16px;
  overflow: hidden;

  .ant-table {
    border-radius: 12px;
  }

  .ant-table-thead > tr > th {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 700;
    border-bottom: 1px solid #e2e8f0;
  }

  .ant-table-tbody > tr > td {
    padding: 12px;
  }

  .ant-table-tbody > tr.banner-row:hover > td {
    background: #f9fafb !important;
  }

  .ant-table-tbody > tr.banner-row.is-active > td {
    background: #e8f0ff !important;
    box-shadow: inset 3px 0 0 #2563eb;
  }

  .ant-table-tbody > tr.banner-row.row-just-added > td {
    animation: ${rowPulse} 1.2s ease-out;
  }
`

export const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;

  .title {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
  }

  .subtitle {
    color: #64748b;
    font-size: 13px;
  }
`

export const EmptyWrap = styled.div`
  padding: 32px;
  text-align: center;
  color: #94a3b8;
  font-size: 16px;
  line-height: 1.6;
  font-weight: 600;
`

export const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
`

export const NameCell = styled.span`
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
  transition: color 0.2s ease, text-decoration-color 0.2s ease;

  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
    text-decoration-color: #cbd5e1;
  }
`

export const TypePill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
`

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  ${({ $active }) =>
    $active
      ? css`
          background: #ecfdf3;
          color: #0f9f6e;
          border: 1px solid #bbf7d0;
        `
      : css`
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        `}
`

export const ActionIconButton = styled(Button)`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);

  ${({ $variant }) =>
    $variant === 'edit'
      ? css`
          color: #2563eb;
          background: #e0ecff;
        `
      : css`
          color: #ef4444;
          background: #fee2e2;
        `}

  &:hover {
    ${({ $variant }) =>
      $variant === 'edit'
        ? css`
            color: #1d4ed8 !important;
            background: #dbeafe !important;
          `
        : css`
            color: #dc2626 !important;
            background: #fecdd3 !important;
          `}
  }
`
