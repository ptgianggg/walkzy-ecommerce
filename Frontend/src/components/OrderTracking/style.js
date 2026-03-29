import styled from 'styled-components'

const WALKZY_BLUE = '#1a94ff'
const BORDER_COLOR = '#e8e8e8'
const TEXT_GRAY = '#666'
const TEXT_DARK = '#1a1a1a'

export const WrapperTrackingContainer = styled.div`
  width: 100%;
  margin-bottom: 20px;
`

export const TrackingCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid ${BORDER_COLOR};
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

export const TrackingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid ${BORDER_COLOR};

  .header-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .header-icon {
      font-size: 32px;
      color: ${WALKZY_BLUE};
      margin-top: 4px;
    }

    .header-title {
      font-size: 20px;
      font-weight: 700;
      color: ${TEXT_DARK};
      margin: 0 0 8px 0;
    }

    .tracking-number {
      font-size: 14px;
      color: ${TEXT_GRAY};

      strong {
        color: ${TEXT_DARK};
        font-weight: 600;
        font-family: 'Courier New', monospace;
        letter-spacing: 1px;
      }
    }
  }
`

export const TrackingInfo = styled.div`
  .ant-timeline {
    padding-left: 0;
  }

  .ant-timeline-item {
    padding-bottom: 24px;
  }

  .ant-timeline-item-last {
    padding-bottom: 0;
  }
`

export const TimelineItem = styled.div`
  .timeline-title {
    font-size: 16px;
    font-weight: 600;
    color: ${TEXT_DARK};
    margin-bottom: 4px;
  }

  .timeline-description {
    font-size: 14px;
    color: ${TEXT_GRAY};
    margin-bottom: 8px;
  }

  .timeline-time {
    font-size: 12px;
    color: ${TEXT_GRAY};
    font-style: italic;
  }
`

