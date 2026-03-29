import styled from "styled-components";

const WALKZY_BLUE = '#1a94ff'
const BORDER_COLOR = '#e8e8e8'
const TEXT_GRAY = '#666'
const TEXT_DARK = '#1a1a1a'

export const WrapperHeaderUser = styled.div`
    background: #fff;
    padding: 24px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid ${BORDER_COLOR};
`;

export const WrapperInfoUser = styled.div`
    background: #fafafa;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #f0f0f0;
    transition: all 0.2s ease;

    &:hover {
        border-color: ${BORDER_COLOR};
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
`;

export const WrapperContentInfo = styled.div`
    margin-top: 12px;
    font-size: 14px;
    line-height: 1.6;
    color: ${TEXT_DARK};

    .name-info {
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 15px;
        color: ${TEXT_DARK};
    }
    
    .address-info, .phone-info, .delivery-fee {
        margin-bottom: 6px;
        color: ${TEXT_GRAY};
    }
    
    .delivery-info {
        margin-bottom: 8px;
        font-size: 15px;
        
        .name-delivery {
            font-weight: 700;
            color: ${WALKZY_BLUE};
            margin-right: 4px;
        }
    }
    
    .payment-info {
        margin-bottom: 8px;
        font-size: 15px;
        font-weight: 500;
    }
    
    .status-payment {
        margin-top: 4px;
    }
    
    span {
        font-weight: 600;
        color: ${TEXT_DARK};
    }
`;

export const WrapperStyleContent = styled.div`
    margin-top: 20px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid ${BORDER_COLOR};
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`;

export const WrapperItemLabel = styled.div`
    width: 14.28%;
    font-size: 14px;
    color: #555;
    text-align: center;
`;

export const WrapperProduct = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    &:hover {
        background: #fafafa;
    }
`;

export const WrapperNameProduct = styled.div`
    display: flex;
    align-items: center;
    flex: 2;
    min-width: 300px;
`;

export const WrapperItem = styled.div`
    flex: 1;
    text-align: center;
    font-size: 14px;
`;

export const WrapperAllPrice = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
`