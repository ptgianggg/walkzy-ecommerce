import { Button } from 'antd'
import React from 'react'
import { SearchOutlined } from '@ant-design/icons';
import Inputcomponent from '../Inputcomponent/Inputcomponent';
import ButtonComponent from '../ButtonComponent/ButtonComponent';


const ButtonInputSearch = (props) => {
  const {
    size, placeholder, textbutton,
    bordered = '#fff', backgroundColorButton = 'rgb(13,92,182)',
    colorButton = '#fff',
    ...restProps
  }
    = props
  return (
    <div style={{ display: 'flex' }}>
      <Inputcomponent
        size={size}
        placeholder={placeholder}
        bordered={bordered}
        style={{ backgroundColor: "backgroundColorInput", borderRadius: 0 }}
        {...restProps}
      />

      <ButtonComponent
        size={size}
        styleButton={{ background: backgroundColorButton, border: 'none', boxShadow: 'none', borderRadius: 'unset' }}
        icon={<SearchOutlined color={colorButton} style={{ color: '#fff' }} />}
        textbutton={textbutton}
        styletextbutton={{ color: colorButton }}

      />

    </div>
  )
}

export default ButtonInputSearch