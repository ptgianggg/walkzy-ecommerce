import styled from 'styled-components'
import { Card } from 'antd'
import { WrapperUploadFile as BaseUpload } from '../AdminProduct/style'

export const WrapperContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 45%, #f9fafb 100%);
  border-radius: 18px;
`

export const WrapperHeader = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #14b8a6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const HeaderSubtitle = styled.p`
  margin: 6px 0 0;
  color: #4b5563;
  max-width: 720px;
  line-height: 1.5;
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
`

export const FilterChip = styled.button`
  border: 1.8px solid ${(props) => (props.$active ? '#2563eb' : '#d1d5db')};
  background: ${(props) =>
    props.$active ? 'rgba(37, 99, 235, 0.12)' : '#ffffff'};
  color: ${(props) => (props.$active ? '#1d4ed8' : '#374151')};

  padding: 12px 20px; /* NÚT TO – DỄ BẤM */
  border-radius: 14px; /* Bo mềm, không quá tròn */
  font-size: 15px; /* CHỮ TO HƠN */
  font-weight: 600;
  cursor: pointer;

  display: inline-flex;
  align-items: center;
  gap: 10px;

  transition: all 0.22s ease;

  box-shadow: ${(props) =>
    props.$active
      ? '0 6px 16px rgba(37, 99, 235, 0.20)'
      : '0 3px 12px rgba(0, 0, 0, 0.04)'};

  &:hover {
    border-color: #2563eb;
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.10);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.97);
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
  min-height: 160px;
  transition: all 0.2s ease;

  .card-icon {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: #1d4ed8;
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 18px;
    margin-bottom: 12px;
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

export const TableCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  padding: 16px;

  > button {
    margin-bottom: 12px;
    border-radius: 10px;
    border: 1px solid #d6e0ff;
    background: #eef2ff;
    color: #1d4ed8;
    padding: 9px 14px;
    font-weight: 600;
  }

  > button:hover {
    background: #e0e7ff;
  }

  .brand-row-active {
    background: #f1f5f9 !important;
  }

  .brand-row-active td {
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

export const BrandCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

export const BrandName = styled.div`
  font-weight: 700;
  color: #0f172a;
  font-size: 15px;
`

export const BrandMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: #6b7280;
`

export const InlineMuted = styled.span`
  color: #6b7280;
  font-size: 13px;
`

export const PreviewCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;

  .preview-head {
    font-weight: 700;
    color: #0f172a;
  }

  .preview-body {
    display: flex;
    align-items: center;
    gap: 12px;
  }
`

export const WrapperActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
`

export const BrandUpload = styled(BaseUpload)`
  & .ant-upload.ant-upload-select-picture-card {
    width: 80px;
    height: 80px;
    border-radius: 16px;
  }
`
