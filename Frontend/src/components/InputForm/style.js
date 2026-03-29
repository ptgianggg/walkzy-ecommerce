import { Input } from "antd";
import styled from "styled-components";

export const WrapperInputStyle = styled(Input)`
    border-top:none;
    border-left:none;
    border-right:none;
    outline:none;
    transition: all 0.3s ease;
    
    &:focus{
        background-color:rgb(232,240,254);
    }

    &.error {
        border-bottom: 1px solid #ff4d4f !important;
        border-bottom-width: 2px !important;
        
        &:focus {
            background-color: transparent !important;
            border-bottom-color: #ff4d4f !important;
        }
    }

    &.success {
        border-bottom-color: #52c41a !important;
    }
`

export const ErrorText = styled.div`
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 18px;
`

export const InputWrapper = styled.div`
    position: relative;
    
    .input-container {
        position: relative;
        display: flex;
        align-items: center;
        
        .error-icon {
            position: absolute;
            right: 32px;
            color: #ff4d4f;
            font-size: 16px;
            pointer-events: none;
            z-index: 1;
        }
        
        .success-icon {
            position: absolute;
            right: 32px;
            color: #52c41a;
            font-size: 16px;
            pointer-events: none;
            z-index: 1;
        }
    }
`