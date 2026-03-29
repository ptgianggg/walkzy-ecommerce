import { Upload } from "antd";
import styled from "styled-components";

export const WrapperHeader = styled.h1`
  color: #111827;
  font-size: 28px;
  font-weight: 800;
 
  font-family: 'Inter', 'Inter var', 'Helvetica Neue', Arial, sans-serif;
`;

export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'Inter', 'Inter var', 'Helvetica Neue', Arial, sans-serif;
  color: #0f172a;
`;

export const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const HeaderMeta = styled.div`
  color: #6b7280;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const ActionsGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
`;

export const StatCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const StatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  letter-spacing: 0.3px;
  text-transform: uppercase;
`;

export const StatValue = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const StatHint = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

export const StatIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #fff;
  background: ${(props) => props.bg || '#4338ca'};
`;

export const FiltersBar = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
`;

export const TableCard = styled.div`
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 12px 34px rgba(15, 23, 42, 0.08);
  padding: 16px;
  position: relative;
`;

export const TableHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

export const TableTitle = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
`;

export const TableSubtitle = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

export const WrapperUploadFile = styled(Upload)`
  & .ant-upload.ant-upload-select.ant-upload-select-picture-card {
    width: 60px;
    height: 60px;
    border-radius: 50%;
  }
  & .ant-upload-list-item-container {
    display: none !important;
  }
  & .ant-upload-list-item {
    display: none !important;
  }
`;

export const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const AvatarCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #eef2ff;
  color: #4338ca;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 16px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.2;
`;

export const UserName = styled.div`
  font-weight: 700;
  color: #0f172a;
`;

export const UserEmail = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

export const BadgeRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
`;

export const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  .anticon {
    font-size: 18px !important;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    border: 1px solid #f1f5f9;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  .btn-edit {
    color: #0ea5e9 !important;
    &:hover {
      background: #e0f2fe;
      border-color: #7dd3fc;
    }
  }

  .btn-lock {
    color: #f43f5e !important;
    &:hover {
      background: #fff1f2;
      border-color: #fecdd3;
    }
  }

  .btn-unlock {
    color: #10b981 !important;
    &:hover {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }
  }

  .btn-delete {
    color: #ef4444 !important;
    &:hover {
      background: #fef2f2;
      border-color: #fecaca;
    }
  }

  .btn-disabled {
    color: #cbd5e1 !important;
    cursor: not-allowed;
    background: #f1f5f9;
    border-color: #e2e8f0;
    opacity: 0.6;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;
