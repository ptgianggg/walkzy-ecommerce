import React from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { Button } from 'antd'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
  position: relative;
`

const BackgroundShape = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.6;
`

const ContentWrapper = styled(motion.div)`
  z-index: 1;
  text-align: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
  max-width: 600px;
  width: 90%;
`

const ErrorCode = styled(motion.h1)`
  font-size: 120px;
  margin: 0;
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);

  @media (max-width: 768px) {
    font-size: 80px;
  }
`

const Title = styled(motion.h2)`
  font-size: 32px;
  color: #1e293b;
  margin: 20px 0 10px;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`

const Description = styled(motion.p)`
  font-size: 16px;
  color: #64748b;
  margin-bottom: 40px;
  line-height: 1.6;
`

const HomeButton = styled(Button)`
  height: 50px;
  padding: 0 40px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 25px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  color: white;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
  }
`

// Floating animation for background shapes
const floatAnimation = {
  animate: {
    y: [0, -20, 0],
    rotate: [0, 5, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

function NotFoundPage() {
  const navigate = useNavigate()

  const handleBackHome = () => {
    navigate('/')
  }

  return (
    <Container>
      {/* Abstract Background Shapes */}
      <BackgroundShape
        style={{ width: 400, height: 400, background: '#bfdbfe', top: '-10%', left: '-10%' }}
        animate={{
          x: [0, 30, 0],
          y: [0, 40, 0],
          transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }}
      />
      <BackgroundShape
        style={{ width: 300, height: 300, background: '#ddd6fe', bottom: '-5%', right: '-5%' }}
        animate={{
          x: [0, -40, 0],
          y: [0, -30, 0],
          transition: { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }}
      />

      <ContentWrapper
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <ErrorCode
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          404
        </ErrorCode>

        <Title
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Oops! Page Not Available
        </Title>

        <Description
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          <br />
          If you are trying to access an Admin area, you may not have permission.
        </Description>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <HomeButton type="primary" size="large" onClick={handleBackHome}>
            Back to Home
          </HomeButton>
        </motion.div>
      </ContentWrapper>
    </Container>
  )
}

export default NotFoundPage