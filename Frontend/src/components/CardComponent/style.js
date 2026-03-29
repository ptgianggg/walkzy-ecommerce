import styled from "styled-components";
import { Card } from "antd";

export const WrapperCardStyle = styled(Card)`
    width:200px ;
    
    & img{
        height:200px;
        width :200px;
    }
    position:relative;
    background-color :${props => props.disabled ? '#ccc' : '#fff'};
    cursor :${props => props.disabled ? 'not-allowed' : 'pointer'};
`
export const WrapperImageStyle = styled.img`
    top: -1px;
    left: -1px;
    border-top-left-radius: 3px;
    position: absolute; 
    height:15px !important;
    width:50px !important;
`
export const StyleNameProduct = styled.div`
    font-weight:400;
    font-size:12px;
    line-height:16px;
    color:rgb(56,56,61)

`
export const WrapperReportText = styled.div`
    font-size :11px;
    color:rgb(128,128,  137);
    display:flex;
    align-items:center;
    margin:6px 0 0  px;

`
export const WrapperPriceText = styled.div`
    color:rgb(255,66,78);
    font-size:16px;
    font-weight:500;
`
export const WrapperDiscountText = styled.span`
    color:rgb(255,66,78);
    font-size:12px;
    font-weight:500;
`
export const WrapperStyleTextSell = styled.span`
     font-size:15px;
     line-height:24px;
     color:rgb(120,12,120);
`