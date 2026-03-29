import { Input } from 'antd'
import React from 'react'
import { WrapperInputStyle, ErrorText, InputWrapper } from './style'
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'

const InputForm = (props) => {
    const {
        placeholder = 'Nhập text',
        error,
        showSuccessIcon = false,
        errorText,
        onChange,
        onBlur,
        style,
        ...rests
    } = props
    
    const handleOnchangeInput = (e) => {
        if (onChange) {
            onChange(e.target.value)
        }
    }
    
    const handleBlur = (e) => {
        if (onBlur) {
            onBlur(e)
        }
    }
    
    const inputClassName = error ? 'error' : (showSuccessIcon && props.value && !error ? 'success' : '')
    
    return (
        <InputWrapper style={style}>
            <div className="input-container">
                <WrapperInputStyle
                    placeholder={placeholder}
                    value={props.value}
                    {...rests}
                    onChange={handleOnchangeInput}
                    onBlur={handleBlur}
                    className={inputClassName}
                />
                {error && (
                    <ExclamationCircleOutlined className="error-icon" />
                )}
                {showSuccessIcon && props.value && !error && (
                    <CheckCircleOutlined className="success-icon" />
                )}
            </div>
            {error && errorText && (
                <ErrorText>
                    <ExclamationCircleOutlined style={{ fontSize: '12px' }} />
                    {errorText}
                </ErrorText>
            )}
        </InputWrapper>
    )
}

export default InputForm