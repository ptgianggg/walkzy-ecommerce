import React from 'react'
import EnhancedHeaderComponent from '../HeaderComponent/EnhancedHeaderComponent'

import FooterComponent from '../FooterComponent/FooterComponent'

const DefaultComponent = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <EnhancedHeaderComponent />
      <div style={{ flex: 1 }}>
        {children}
      </div>
      <FooterComponent />
    </div>
  )
}

export default DefaultComponent