import styled from 'styled-components'

export const WrapperHeader = styled.h1`
    color: #1e3c72;
    font-size: 28px;
    font-weight: 700;
    margin: 0 0 32px 0;
    padding-bottom: 20px;
    border-bottom: 3px solid #e8e8e8;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`

export const PageContainer = styled.div`
  background: radial-gradient(circle at 20% 20%, #f5f7ff 0, #ffffff 25%), #f9fbff;
  min-height: 100vh;
  padding: 16px 20px 32px;
`

export const SectionCard = styled.div`
  background: #fff;
  border: 1px solid #edf0f7;
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 10px 30px rgba(20, 34, 74, 0.05);
  margin-bottom: 18px;
`

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`

export const SectionTitle = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: #1f2937;
`

export const ActionGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`

export const SubtleText = styled.span`
  color: #6b7280;
  font-size: 13px;
`

