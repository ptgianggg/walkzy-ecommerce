import React from 'react';
import { motion } from 'framer-motion';

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  background: 'linear-gradient(135deg, #bed0ecff 0%, #9ba6b9ff 50%, #0d0f70ff 100%)'
};

const innerStyle = {
  width: '100%',
  maxWidth: '1180px',
};

const PageWrapper = ({ children, className, style, disableMotion = false }) => {
  if (disableMotion) {
    return (
      <div style={{ ...containerStyle, ...style }} className={className}>
        <div style={innerStyle}>{children}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      exit={{ y: -10 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      style={{ ...containerStyle, ...style }}
      className={className}
    >
      <div style={innerStyle}>{children}</div>
    </motion.div>
  );
};

export default PageWrapper;
