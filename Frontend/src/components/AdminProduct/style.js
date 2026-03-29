import { Upload } from "antd";
import styled from "styled-components";

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
`;

export const WrapperHeader = styled.h1`
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.02em;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
`;

export const HeaderMeta = styled.div`
  color: #64748b;
  font-size: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 4px;
`;

export const ActionsGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 8px;
`;

export const StatCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
  }
`;

export const StatLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const StatValue = styled.div`
  font-size: 28px;
  color: #0f172a;
  font-weight: 800;
  display: flex;
  align-items: baseline;
  gap: 6px;
`;

export const StatTrend = styled.div`
  font-size: 13px;
  color: ${(props) => (props.negative ? "#ef4444" : "#10b981")};
  background: ${(props) => (props.negative ? "#fef2f2" : "#ecfdf5")};
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 600;
  display: inline-flex;
  width: fit-content;
`;

export const FiltersBar = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

export const TableCard = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;

  .ant-table-wrapper {
    .ant-table {
      background: transparent;
    }
    .ant-table-thead > tr > th {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      padding: 16px;
    }
    .ant-table-tbody > tr > td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    .ant-table-tbody > tr:hover > td {
      background: #f1f5f9 !important;
    }
  }
`;

export const TableHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const TableTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
`;

export const TableSubtitle = styled.p`
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0 0;
`;

export const WrapperUploadFile = styled(Upload)`
  & .ant-upload.ant-upload-select-picture-card {
    width: 60px;
    height: 60px;
    border-radius: 50%;
  }
`;
