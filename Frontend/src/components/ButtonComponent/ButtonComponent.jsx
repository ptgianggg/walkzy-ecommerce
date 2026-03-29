import React from 'react'
import { Button } from 'antd'

const ButtonComponent = ({
  size,
  variant,
  styleButton,
  styletextbutton,
  styleTextButton,
  textbutton,
  textButton,
  disabled,
  ...rests
}) => {
  // Support both camelCase and lowercase prop names
  const textStyle = styleTextButton || styletextbutton || {};
  const buttonText = textButton || textbutton || '';

  // Define variant styles
  const variants = {
    auth: {
      width: '100%',
      height: 46,
      borderRadius: 999,
      border: 'none',
      background: 'linear-gradient(90deg, #1677ff 0%, #36a3ff 100%)',
      boxShadow: '0 10px 24px rgba(17, 99, 255, 0.12)',
      cursor: 'pointer',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }

  const defaultVariantText = {
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '18px',
    letterSpacing: '0.6px',
  }

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const variantStyles = variant && variants[variant] ? variants[variant] : {};

  const buttonStyles = {
    ...baseStyles,
    ...variantStyles,
    ...styleButton
  }

  // Disabled override
  if (disabled) {
    buttonStyles.background = styleButton?.background || 'rgba(255,255,255,0.12)';
    buttonStyles.cursor = 'not-allowed';
    buttonStyles.opacity = 0.9;
  }

  const finalTextStyle = {
    ...defaultVariantText,
    ...textStyle
  }

  return (
    <Button
      style={buttonStyles}
      size={size}
      disabled={disabled}
      {...rests}
    >
      <span style={{
        color: finalTextStyle.color || '#ffffff',
        fontWeight: finalTextStyle.fontWeight || '800',
        fontSize: finalTextStyle.fontSize || '18px',
        letterSpacing: finalTextStyle.letterSpacing || '0.8px',
        textShadow: finalTextStyle.textShadow || '0 2px 4px rgba(0, 0, 0, 0.08)',
        lineHeight: finalTextStyle.lineHeight || '1.5',
        ...finalTextStyle
      }}>
        {buttonText}
      </span>
    </Button>
  )
}

export default ButtonComponent
