import styled from 'styled-components'
import { Card } from 'antd'

export const WrapperContent = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 50%, #f9fafb 100%);
  border-radius: 18px;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 999px;
    filter: blur(60px);
    opacity: 0.6;
    z-index: 0;
  }

  &::before {
    width: 260px;
    height: 260px;
    background: rgba(99, 102, 241, 0.18);
    top: -60px;
    right: -40px;
  }

  &::after {
    width: 220px;
    height: 220px;
    background: rgba(14, 165, 233, 0.18);
    bottom: -80px;
    left: -60px;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`

export const WrapperHeader = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 45%, #7a415eff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

export const HeaderSubtitle = styled.p`
  margin: 6px 0 0;
  color: #4b5563;
  max-width: 720px;
  line-height: 1.5;
`

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
`

export const StatCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const StatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`

export const StatValue = styled.div`
  font-size: 24px;
  color: #0f172a;
  font-weight: 800;
`

export const StatTrend = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${(props) => (props.$negative ? '#dc2626' : '#059669')};
  background: ${(props) => (props.$negative ? '#fef2f2' : '#ecfdf3')};
  padding: 4px 10px;
  border-radius: 999px;
  display: inline-flex;
  width: fit-content;
`

export const ActionsBar = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(10px);
  border-image: linear-gradient(120deg, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.12)) 1;
`

export const FilterChip = styled.button`
  border: 1px solid ${(props) => (props.$active ? 'rgba(59, 130, 246, 0.55)' : '#d1d5db')};
  background: ${(props) =>
    props.$active
      ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(79,70,229,0.15))'
      : '#ffffff'};
  color: ${(props) => (props.$active ? '#1d4ed8' : '#374151')};

  padding: 12px 22px; /* TO HƠN, ĐẸP HƠN */
  border-radius: 14px; /* MỀM MẠI HƠN */
  cursor: pointer;
  font-weight: 600;
  font-size: 15px; /* TO HƠN 1 CHÚT */
  letter-spacing: 0.2px;

  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  
  box-shadow: ${(props) =>
    props.$active
      ? '0 12px 26px rgba(59,130,246,0.25)'
      : '0 6px 14px rgba(0,0,0,0.05)'};

  &:hover {
    border-color: #2563eb;
    color: #1d4ed8;
    background: rgba(59,130,246,0.12);
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(37, 99, 235, 0.22);
  }
`;


export const CardsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
`

export const CreateCard = styled(Card)`
  border: 1px dashed #c7d2fe !important;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #eef2ff, #f5f8ff);
  min-height: 150px;
  transition: all 0.2s ease;

  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #1d4ed8;
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 18px;
    margin-bottom: 10px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  .card-desc {
    margin-top: 6px;
    color: #4b5563;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 30px rgba(59, 130, 246, 0.15);
  }
`

export const PreviewCard = styled(Card)`
  border-radius: 16px !important;
  border: 1px solid #e5e7eb !important;
  background: #ffffff !important;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
  overflow: hidden;

  .preview-image {
    margin: 12px 0;
    width: 100%;
    height: 140px;
    border: 1px dashed #e5e7eb;
    border-radius: 12px;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: #f8fafc;
  }

  .preview-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    color: #94a3b8;
    font-weight: 600;
  }

  .preview-dates {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`

export const PreviewBadge = styled.span`
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: ${(props) => (props.$highlight ? 'rgba(37, 99, 235, 0.12)' : '#f1f5f9')};
  color: ${(props) => (props.$highlight ? '#1d4ed8' : '#475569')};
  font-weight: 700;
  font-size: 12px;
  width: fit-content;
`

export const PreviewTitle = styled.h3`
  margin: 10px 0 4px;
  font-size: 18px;
  color: #0f172a;
  font-weight: 800;
`

export const PreviewMeta = styled.div`
  color: #64748b;
  font-size: 13px;
  margin-bottom: 6px;
`

export const CollectionMeta = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  .meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .name {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
  }
`

export const InlineMuted = styled.span`
  color: #6b7280;
  font-size: 13px;
`

export const TrendPill = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12px;
  background: ${(props) =>
    props.$muted ? '#fef2f2' : props.$highlight ? 'rgba(37, 99, 235, 0.12)' : '#eef2ff'};
  color: ${(props) => (props.$muted ? '#dc2626' : props.$highlight ? '#1d4ed8' : '#475569')};
`

export const TableCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  padding: 16px;
  overflow: hidden;

  .collection-row-active {
    background: #f8fafc !important;
  }

  .collection-row-active td {
    border-color: #e2e8f0 !important;
  }
`

export const TableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;

  .table-title {
    font-weight: 800;
    font-size: 18px;
    color: #0f172a;
  }

  .table-subtitle {
    color: #6b7280;
    font-size: 13px;
  }
`
