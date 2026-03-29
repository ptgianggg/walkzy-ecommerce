import styled from 'styled-components';
import { Menu } from 'antd';

export const AdminContainer = styled.div`
    display: flex;
    overflow: hidden;
    min-height: 100vh;
    background: #f0f2f5;
`;

export const Sidebar = styled.div`
    width: 280px;
    min-width: 280px;
    background: linear-gradient(180deg, #1890ff 0%, #0050b3 100%);
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;
    transition: all 0.2s;
`;

export const SidebarHeader = styled.div`
    padding: 24px 24px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    
    .logo {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #fff;
        font-size: 20px;
        font-weight: 700;
        cursor: pointer;
        
        .logo-icon {
            width: 32px;
            height: 32px;
            background: #fff;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1890ff;
            font-size: 18px;
        }
        
        .subtitle {
            color: rgba(255, 255, 255, 0.85);
            font-size: 11px;
            margin-top: 2px;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    }
`;

export const StyledMenu = styled(Menu)`
    background: transparent !important;
    border: none !important;
    flex: 1;
    overflow-y: auto;
    padding: 8px !important;

    /* Custom Scrollbar for Menu */
    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
    }

    /* === SubMenu Title Styling === */
    .ant-menu-submenu-title {
        color: rgba(255, 255, 255, 0.9) !important;
        margin: 4px 0 !important;
        border-radius: 8px !important;
        height: 44px !important;
        line-height: 44px !important;
        font-size: 14px !important;
        transition: all 0.3s !important;
        font-weight: 500;

        &:hover {
            color: #fff !important;
            background-color: rgba(255, 255, 255, 0.15) !important;
        }

        .anticon {
            font-size: 16px !important;
            color: rgba(255, 255, 255, 0.85);
            transition: color 0.3s;
        }
        
        &:hover .anticon {
            color: #fff;
        }
    }

    /* === SubMenu Arrow Styling === */
    .ant-menu-submenu-arrow {
        color: rgba(255, 255, 255, 0.7) !important;
    }
    .ant-menu-submenu-active > .ant-menu-submenu-title > .ant-menu-submenu-arrow {
        color: #fff !important;
    }

    /* === Menu Item Styling === */
    .ant-menu-item {
        margin: 4px 0 !important;
        border-radius: 8px !important;
        height: 44px !important;
        line-height: 44px !important;
        color: rgba(255, 255, 255, 0.9) !important;
        font-size: 14px !important;
        font-weight: 500;
        
        &:hover {
            color: #fff !important;
            background-color: rgba(255, 255, 255, 0.15) !important;
        }

        &.ant-menu-item-selected {
            background-color: #fff !important;
            color: #1890ff !important;
            font-weight: 700;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        &.ant-menu-item-selected .anticon {
             color: #1890ff !important;
        }

        /* Adjust icon size & color */
        .anticon {
            font-size: 16px !important;
            color: rgba(255, 255, 255, 0.9);
            transition: color 0.3s;
        }
    }

    /* === Nested SubMenu Background === */
    .ant-menu-sub.ant-menu-inline {
        background: rgba(0, 0, 0, 0.15) !important; /* Slightly darker for contrast */
        border-radius: 8px;
        padding: 4px !important;
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.1);
    }
    
    /* Ensure Icon Margin */
    .ant-menu-item .anticon, 
    .ant-menu-submenu-title .anticon {
        margin-right: 10px !important;
    }
`;

export const ContentArea = styled.div`
    flex: 1;
    height: 100vh;
    overflow-y: auto;
    background: #f0f2f5;
    padding: 24px;
    
    &::-webkit-scrollbar {
        width: 8px;
    }
    &::-webkit-scrollbar-track {
        background: transparent;
    }
    &::-webkit-scrollbar-thumb {
        background: #bfbfbf;
        border-radius: 4px;
        &:hover { background: #999; }
    }
`;

export const ContentCard = styled.div`
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
    min-height: 100%;
    padding: 24px;
`;

