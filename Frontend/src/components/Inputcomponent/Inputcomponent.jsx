import { Input } from 'antd'
import React from 'react'

const Inputcomponent = ({ size, placeholder, bordered, style, ...rests }) => {
  if ('textbutton' in rests) delete rests.textbutton
  return (
    <Input
      size={size}
      placeholder={placeholder}
      bordered={bordered}
      style={style}
      {...rests}
    />

  )
}

export default Inputcomponent