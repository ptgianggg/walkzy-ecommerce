import styled from 'styled-components'

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #f8fafc;
  padding: 12px 0;
`

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
`

export const QuickCard = styled.div`
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  padding: 16px;
  min-height: 140px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 8px;

  &:hover {
    border-color: #0ea5e9;
    box-shadow: 0 14px 28px rgba(14, 165, 233, 0.16);
    transform: translateY(-2px);
  }

  .eyebrow {
    font-size: 12px;
    color: #94a3b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .title {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
  }

  .desc {
    color: #64748b;
    margin-top: 6px;
    max-width: 260px;
  }

  .icon-pill {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: #e0f2fe;
    color: #0284c7;
    display: grid;
    place-items: center;
    font-size: 22px;
    box-shadow: inset 0 0 0 1px #bae6fd;
  }
`

export const TabWrap = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);

  .ant-tabs-tab {
    transition: all 0.2s ease;
    border-radius: 10px;
    padding: 8px 12px;
  }

  .ant-tabs-tab:hover {
    background: #f8fafc;
    transform: translateY(-1px);
  }

  .ant-tabs-tab-active {
    background: #e0f2fe;
    box-shadow: 0 10px 24px rgba(14, 165, 233, 0.15);
    transform: translateY(-1px);
  }

  .ant-tabs-ink-bar {
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, #0ea5e9, #2563eb);
  }
`

export const TableShell = styled.div`
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.06);
  padding: 14px 16px;
  overflow: hidden;

  .ant-table {
    border-radius: 10px;
  }

  .ant-table-thead > tr > th {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 700;
  }

  .ant-table-tbody > tr > td {
    padding: 12px;
  }

  .ant-table-tbody > tr:hover > td {
    background: #f1f5f9 !important;
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
