import { Upload } from "antd";
import styled from "styled-components";

export const WrapperHeader = styled.h1`
    color: #1a1a1a;
    font-size: 32px;
    font-weight: 700;
    margin: 0 0 32px 0;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #1a94ff 0%, #0d7ae8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (max-width: 768px) {
        font-size: 24px;
        margin-bottom: 20px;
    }
`

export const WrapperContentProfile = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 8px;
`

export const WrapperSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`

export const WrapperLabel = styled.label`
    color: #333;
    font-size: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    margin-bottom: 4px;
`

export const WrapperInput = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
`

export const WrapperUploadFile = styled(Upload)`
    & .ant-upload.ant-upload-select.ant-upload-select-picture-card {
        width: 60px;
        height: 60px;
        border-radius: 50%;
    }
    & .ant-upload-list-item-container {
        display: none !important;
    }
`

export const WrapperAvatarSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
`

export const WrapperButtonGroup = styled.div`
    margin-top: 8px;
    display: flex;
    gap: 12px;
    
    button {
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(26, 148, 255, 0.4) !important;
        }
        
        &:active {
            transform: translateY(0);
        }
    }
`