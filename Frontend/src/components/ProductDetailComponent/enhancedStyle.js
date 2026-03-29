import styled from 'styled-components';

export const WrapperProductContainer = styled.div`
    padding: 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

    @media (max-width: 768px) {
        padding: 16px;
    }
`;

export const WrapperImageGallery = styled.div`
    .main-image {
        position: relative;
        background: #f8f9fa;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 20px;
        border: 1px solid #f0f0f0;
        
        .discount-badge {
            position: absolute;
            top: 16px;
            left: 16px;
            background: #ff4d4f;
            color: #fff;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 14px;
            z-index: 2;
            box-shadow: 0 2px 8px rgba(255, 77, 79, 0.3);
        }

        .image-preview-mask {
            border-radius: 12px;
        }
    }

    .thumbnail-list {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding: 4px;
        scrollbar-width: thin;
        
        &::-webkit-scrollbar {
            height: 4px;
        }
        
        .thumbnail {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
            cursor: pointer;
            border-radius: 8px;
            border: 2px solid #f0f0f0;
            overflow: hidden;
            transition: all 0.2s ease;
            
            img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                padding: 4px;
            }
            
            &.active {
                border-color: #1890ff;
                box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
            }
            
            &:hover:not(.active) {
                border-color: #d9d9d9;
            }
        }
    }
`;

export const WrapperProductInfo = styled.div`
    .product-title {
        font-size: 28px;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 16px;
        line-height: 1.3;
    }

    .rating-section {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;

        .sold-count, .review-count {
            color: #666;
            font-size: 14px;
        }

        .separator {
            color: #ddd;
        }
    }

    .price-section {
        background: #fdf2f2;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 24px;
        display: flex;
        align-items: baseline;
        gap: 16px;

        .current-price {
            font-size: 36px;
            font-weight: 700;
            color: #d70018;

            @media (max-width: 768px) {
                font-size: 28px;
            }
        }

        .original-price {
            font-size: 18px;
            color: #999;
            text-decoration: line-through;
        }
    }

    .delivery-section {
        display: flex;
        align-items: center;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 24px;
        font-size: 14px;
        color: #444;

        .address {
            font-weight: 600;
            color: #1a1a1a;
            margin: 0 8px;
        }

        .change-address {
            color: #1890ff;
            font-weight: 500;
            transition: opacity 0.2s;
            &:hover { opacity: 0.8; }
        }
    }

    .stock-info {
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 500;
    }

    .social-actions {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #f0f0f0;

        .social-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: #fff;
            border: 1px solid #e8e8e8;
            cursor: pointer;
            font-size: 15px;
            font-weight: 500;
            color: #595959;
            transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            padding: 10px 24px;
            border-radius: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            min-width: 140px;

            &:hover {
                background: #fff;
                border-color: #d9d9d9;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(0,0,0,0.1);
                color: #262626;
            }

            .anticon {
                font-size: 20px;
            }

            &.favorite-active {
                background: #fff1f0;
                border-color: #ffccc7;
                color: #ff4d4f;
                box-shadow: 0 2px 8px rgba(255, 77, 79, 0.1);
                
                &:hover {
                    background: #ffccc7;
                    border-color: #ff7875;
                    box-shadow: 0 6px 16px rgba(255, 77, 79, 0.2);
                }
            }

            &.share-btn {
                &:hover {
                    background: #e6f7ff;
                    border-color: #91d5ff;
                    color: #1890ff;
                    box-shadow: 0 6px 16px rgba(24, 144, 255, 0.15);
                }
            }
        }
    }
`;

export const WrapperVariationSelector = styled.div`
    margin-bottom: 24px;

    .variation-label {
        font-size: 15px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
        
        .selected-value {
            color: #1890ff;
            margin-left: 8px;
        }
    }

    .variation-options {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        /* Color Options */
        .color-option {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            position: relative;

            &:hover {
                transform: scale(1.1);
            }

            &.selected {
                transform: scale(1.1);
                box-shadow: 0 0 0 2px #fff, 0 0 0 4px #1890ff;
            }

            &.disabled {
                opacity: 0.3;
                cursor: not-allowed;
                filter: grayscale(1);
            }

            .check-icon {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #fff;
                font-weight: bold;
                text-shadow: 0 1px 4px rgba(0,0,0,0.3);
            }

            .unavailable-slash {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, transparent 45%, #ff4d4f 45%, #ff4d4f 55%, transparent 55%);
                pointer-events: none;
            }
        }

        /* Size / Material Options */
        .size-option, .material-option {
            min-width: 60px;
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
            position: relative;

            &:hover:not(.disabled) {
                border-color: #1890ff;
                color: #1890ff;
            }

            &.selected {
                background: #e6f7ff;
                border-color: #1890ff;
                color: #1890ff;
            }

            &.disabled {
                background: #f5f5f5;
                color: #ccc;
                border-style: dashed;
                cursor: not-allowed;
            }

            &.not-available-for-selection {
                opacity: 0.6;
                background: #fafafa;
                border-color: #eee;
                text-decoration: line-through;
            }

            .out-of-stock-badge, .not-avail-badge {
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ff4d4f;
                color: #fff;
                font-size: 10px;
                padding: 1px 4px;
                border-radius: 4px;
                line-height: 1;
            }
        }
    }
`;

export const WrapperQuantityControl = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 32px;

    .quantity-label {
        font-size: 15px;
        font-weight: 600;
        color: #333;
    }

    .quantity-input-wrapper {
        display: flex;
        align-items: center;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;

        .quantity-btn {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            border: none;
            cursor: pointer;
            transition: background 0.2s;

            &:hover {
                background: #f0f0f0;
            }

            &:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
        }

        .quantity-input {
            width: 60px;
            height: 40px;
            border: none;
            border-left: 1px solid #ddd;
            border-right: 1px solid #ddd;
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            
            &::-webkit-inner-spin-button {
                display: none;
            }
        }
    }
`;

export const WrapperActionButtons = styled.div`
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    .ant-btn {
        height: 54px;
        padding: 0 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex: 1;
        min-width: 140px;
    }

    .add-to-cart-btn {
        background: #fff;
        border: 1px solid #d70018;
        color: #d70018;
        &:hover {
            background: #fff2f2;
            border-color: #d70018;
            color: #d70018;
        }
    }

    .buy-now-btn {
        background: #d70018;
        border-color: #d70018;
        color: #fff;
        &:hover {
            background: #bc0015;
            border-color: #bc0015;
            color: #fff;
        }
    }

    .chat-btn, .fav-btn {
        flex: 0 0 54px;
        min-width: 54px;
        padding: 0;
        background: #f8f9fa;
        border: 1px solid #ddd;
        color: #666;
        
        &:hover {
            background: #f0f0f0;
            border-color: #ccc;
            color: #1a1a1a;
        }

        &.active {
            color: #ff4d4f;
            border-color: #ff4d4f;
            background: #fff2f2;
        }
    }
`;
