import styled from 'styled-components'

export const WrapperTrackingContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`

export const WrapperTrackingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 24px;
  color: white;

  .header-title {
    display: flex;
    align-items: center;
  }

  h3 {
    color: white;
  }

  p {
    color: rgba(255, 255, 255, 0.9);
  }
`

export const WrapperTrackingContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const WrapperTrackingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const StatusStep = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: ${props => props.active ? '#e6f7ff' : '#f5f5f5'};
  border: 1px solid ${props => props.active ? '#1890ff' : '#d9d9d9'};
  margin-bottom: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.active ? '#bae7ff' : '#f0f0f0'};
  }
`

export const TimelineItem = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`

