import styled from 'styled-components'
import { Card } from 'antd'

export const WrapperContent = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 45%, #f9fafb 100%);
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
    width: 240px;
    height: 240px;
    background: rgba(99, 102, 241, 0.16);
    top: -70px;
    right: -50px;
  }

  &::after {
    width: 200px;
    height: 200px;
    background: rgba(14, 165, 233, 0.18);
    bottom: -90px;
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
  background: linear-gradient(135deg, #1d2022ff 0%, #111113ff 45%, #1d1f1eff 100%);
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
  gap: 14px;
`

export const StatCard = styled.div`
  background: linear-gradient(135deg, #ffffff, #f8fbff);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
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

  .actions-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 260px;
  }

  .actions-title {
    font-weight: 700;
    color: #0f172a;
  }
`

export const FilterChip = styled.button`
  border: 1px solid ${(props) => (props.$active ? '#2563eb' : '#e5e7eb')};
  background: ${(props) => (props.$active ? '#eff6ff' : '#ffffff')};
  color: #2563eb;
  padding: 10px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  box-shadow: ${(props) =>
    props.$active ? '0 10px 24px rgba(37, 99, 235, 0.16)' : '0 4px 12px rgba(15, 23, 42, 0.06)'};

  &:hover {
    border-color: #2563eb;
    box-shadow: 0 12px 26px rgba(37, 99, 235, 0.18);
    transform: translateY(-1px);
  }

  .chip-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: ${(props) => (props.$active ? '#2563eb' : '#e0edff')};
    color: ${(props) => (props.$active ? '#ffffff' : '#2563eb')};
    display: grid;
    place-items: center;
    font-size: 18px;
  }
`

export const CardsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
`

export const CreateCard = styled(Card)`
  border: 1px dashed #c7d2fe !important;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #eef2ff, #f5f8ff);
  min-height: 140px;
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

  .card-eyebrow {
    font-size: 12px;
    color: #64748b;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .card-desc {
    margin-top: 6px;
    color: #4b5563;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 12px;
    color: #475569;
    font-weight: 600;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 30px rgba(59, 130, 246, 0.15);
  }
`

export const TableCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  padding: 16px;
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
    padding: 12px 12px;
    vertical-align: middle;
  }

  .ant-table-tbody > tr:hover > td {
    background: #f1f5f9 !important;
  }

  .attribute-row-active {
    background: #f8fafc !important;
  }

  .attribute-row-active td {
    border-color: #e2e8f0 !important;
  }
`

export const AttributePreview = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px dashed #dbeafe;
  border-radius: 14px;
  background: #f8fbff;

  .preview-title {
    font-weight: 700;
    color: #0f172a;
  }

  .preview-desc {
    font-size: 12px;
    color: #6b7280;
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

export const CellStack = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`

export const ColorSwatch = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  display: inline-block;
`

export const TypePill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: ${(props) => `${props.$tone || '#e2e8f0'}24`};
  color: #0f172a;
  border: 1px solid ${(props) => `${props.$tone || '#e2e8f0'}60`};

  .pill-icon {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: #fff;
    color: ${(props) => props.$tone || '#2563eb'};
  }

  .pill-label {
    font-weight: 600;
  }
`
