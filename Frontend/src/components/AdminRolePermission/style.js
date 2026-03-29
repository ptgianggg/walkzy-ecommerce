import styled from 'styled-components'

export const WrapperContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #f8fbff;
  border-radius: 18px;
`

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const WrapperHeader = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #1d4ed8;
  letter-spacing: -0.02em;
`

export const HeaderSubtitle = styled.p`
  margin: 6px 0 0;
  color: #4b5563;
  max-width: 840px;
  line-height: 1.5;
`

export const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
`

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 16px;
  }
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
`

export const TableCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  padding: 16px;
`

export const TableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`

export const TableTitle = styled.div`
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
`

export const TableSubtitle = styled.div`
  font-size: 13px;
  color: #6b7280;
`

export const InlineMuted = styled.span`
  color: #6b7280;
  font-size: 12px;
`
