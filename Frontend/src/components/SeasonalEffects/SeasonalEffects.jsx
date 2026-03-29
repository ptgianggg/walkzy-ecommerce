import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { usePublicSettings } from '../../hooks/useSettings'

/**
 * SeasonalEffects
 * - Render Canvas hiệu ứng mùa vụ / sự kiện
 * - Hỗ trợ preview trong admin
 * - Map nhiều event → 1 effect engine để tối ưu hiệu năng
 */
const SeasonalEffects = ({
  forceEnabled = false,
  overrideConfig = null,
  durationMs = null,
}) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const location = useLocation()
  const { settings, isLoading } = usePublicSettings()

  const path = location.pathname || ''
  const isAdminPage = path.startsWith('/system/admin')

  useEffect(() => {
    if (!settings || isLoading) return

    const baseCfg = {
      seasonalEffectsEnabled: settings.seasonalEffectsEnabled,
      seasonalEffectType: settings.seasonalEffectType || 'winter',
      seasonalEffectDensity: settings.seasonalEffectDensity ?? 80,
      seasonalEffectPages: settings.seasonalEffectPages || ['home'],
      seasonalEffectStart: settings.seasonalEffectStart,
      seasonalEffectEnd: settings.seasonalEffectEnd,
      seasonalEffectIcon: settings.seasonalEffectIcon
    }

    const cfg = overrideConfig ? { ...baseCfg, ...overrideConfig } : baseCfg

    const {
      seasonalEffectsEnabled,
      seasonalEffectType,
      seasonalEffectDensity,
      seasonalEffectPages,
      seasonalEffectStart,
      seasonalEffectEnd,
    } = cfg

    // ====== CHECK ENABLE ======
    if (!forceEnabled) {
      if (!seasonalEffectsEnabled) return
      if (isAdminPage) return
    }

    // ====== CHECK TIME RANGE ======
    if (!forceEnabled && seasonalEffectStart && seasonalEffectEnd) {
      const now = new Date()
      const start = new Date(seasonalEffectStart)
      const end = new Date(seasonalEffectEnd)
      if (now < start || now > end) return
    }

    // ====== CHECK PAGE ======
    const shouldShowOnPage = () => {
      if (!seasonalEffectPages?.length) return true
      if (seasonalEffectPages.includes('all')) return !isAdminPage
      if (path === '/' && seasonalEffectPages.includes('home')) return true
      if (path.startsWith('/product') && seasonalEffectPages.includes('product')) return true
      if (
        (path.startsWith('/category') || path.startsWith('/collection')) &&
        seasonalEffectPages.includes('category')
      )
        return true
      if (
        (path.startsWith('/cart') || path.startsWith('/checkout')) &&
        seasonalEffectPages.includes('cart')
      )
        return true
      return false
    }

    if (!forceEnabled && !shouldShowOnPage()) return

    // ====== CANVAS INIT ======
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    window.addEventListener('resize', onResize)

    // ====== EFFECT GROUP MAP ======
    const EFFECT_GROUP = {
      snow: ['winter', 'noel'],
      flower: ['spring', 'tet', 'women_day', 'teacher_day'],
      heart: ['valentine'],
      leaf: ['autumn'],
      summer: ['summer'],
      confetti: ['confetti', 'flash_sale', 'brand_birthday', 'new_year'],
      halloween: ['halloween'],
      custom: ['custom']
    }

    const getEffectGroup = (type) => {
      for (const key in EFFECT_GROUP) {
        if (EFFECT_GROUP[key].includes(type)) return key
      }
      return 'snow'
    }

    const effectGroup = getEffectGroup(seasonalEffectType)
    const customIconUrl = cfg.seasonalEffectIcon

    // ====== IMAGE PRE-LOADING (For Custom Icon) ======
    let customImg = null
    if (effectGroup === 'custom' && customIconUrl) {
      customImg = new Image()
      customImg.src = customIconUrl
    }

    // ====== PARTICLES ======
    const maxParticles = Math.min(Math.max(seasonalEffectDensity, 10), 250)
    const particles = []
    const rand = (min, max) => Math.random() * (max - min) + min

    // ====== INIT PARTICLES ======
    if (effectGroup === 'snow') {
      for (let i = 0; i < maxParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: rand(1.5, 4.5), // Tuyết to hơn chút
          vy: rand(0.5, 1.8),
          sway: Math.random() * Math.PI * 2,
          swaySpeed: rand(0.01, 0.03),
          opacity: rand(0.3, 0.9),
        })
      }
    } else {
      let colors = ['#ffffff']
      let particleQty = maxParticles

      if (effectGroup === 'flower') colors = ['#ffb7c5', '#ffd1dc', '#ffc0cb', '#f48fb1']
      if (effectGroup === 'heart') colors = ['#ff4d4f', '#ff7875', '#ff85c0', '#f759ab']
      if (effectGroup === 'leaf') colors = ['#f59e0b', '#d97706', '#92400e', '#78350f']
      if (effectGroup === 'summer') {
        colors = ['#facc15', '#fde68a', '#93c5fd', '#bae6fd']
        particleQty = Math.floor(maxParticles * 0.6) // Giảm số lượng bong bóng
      }
      if (effectGroup === 'confetti') colors = ['#ff3b30', '#34c759', '#0a84ff', '#ffd60a', '#ff9500', '#af52de']
      if (effectGroup === 'halloween') colors = ['#ff7a00', '#000000', '#ffb703', '#6200ea']
      if (effectGroup === 'custom') {
        particleQty = Math.min(maxParticles, 40)
      }

      for (let i = 0; i < particleQty; i++) {
        const isCustom = effectGroup === 'custom'
        const size = isCustom ? rand(15, 55) : rand(10, 20)

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height - height,
          w: size,
          h: size,
          vy: isCustom ? rand(0.6, 2.5) : rand(1.2, 3.5),
          vx: rand(-1.2, 1.2),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: isCustom ? rand(-0.03, 0.03) : rand(-0.05, 0.05),
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: isCustom ? rand(0.4, 1) : rand(0.7, 1),
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    // ====== DRAW & UPDATE ======
    const drawSnow = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach((p) => {
        ctx.beginPath()
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    const updateSnow = () => {
      particles.forEach((p) => {
        p.y += p.vy
        p.sway += p.swaySpeed
        p.x += Math.sin(p.sway) * 0.8
        if (p.y > height + p.r) {
          p.y = -p.r
          p.x = Math.random() * width
        }
      })
    }

    const drawFall = () => {
      ctx.clearRect(0, 0, width, height)
      particles.forEach((p) => {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color

        if (effectGroup === 'custom') {
          // Chỉ vẽ khi ảnh đã nạp xong, không vẽ ô vuông fallback
          if (customImg && customImg.complete && customImg.naturalWidth !== 0) {
            ctx.drawImage(customImg, -p.w / 2, -p.h / 2, p.w, p.h)
          }
        } else if (effectGroup === 'flower') {
          // Vẽ cánh hoa (hình oval nhọn 2 đầu)
          ctx.beginPath()
          ctx.moveTo(0, -p.h / 2)
          ctx.quadraticCurveTo(p.w, 0, 0, p.h / 2)
          ctx.quadraticCurveTo(-p.w, 0, 0, -p.h / 2)
          ctx.fill()
        } else if (effectGroup === 'leaf') {
          // Vẽ lá (hình thoi bo góc)
          ctx.beginPath()
          ctx.moveTo(0, -p.h / 2)
          ctx.lineTo(p.w / 2, 0)
          ctx.lineTo(0, p.h / 2)
          ctx.lineTo(-p.w / 2, 0)
          ctx.closePath()
          ctx.fill()
          // Thêm gân lá đơn giản
          ctx.strokeStyle = 'rgba(0,0,0,0.1)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, -p.h / 2)
          ctx.lineTo(0, p.h / 2)
          ctx.stroke()
        } else if (effectGroup === 'heart') {
          // Vẽ hình trái tim
          const s = p.w / 2
          ctx.beginPath()
          ctx.moveTo(0, s)
          ctx.bezierCurveTo(s, s / 2, s * 2, -s / 2, 0, -s)
          ctx.bezierCurveTo(-s * 2, -s / 2, -s, s / 2, 0, s)
          ctx.fill()
        } else if (effectGroup === 'summer') {
          // Vẽ bong bóng xà phòng
          ctx.beginPath()
          ctx.arc(0, 0, p.w, 0, Math.PI * 2)
          ctx.strokeStyle = p.color
          ctx.lineWidth = 1.5
          ctx.stroke()
          // Điểm sáng trên bong bóng
          ctx.beginPath()
          ctx.arc(-p.w / 3, -p.w / 3, p.w / 4, 0, Math.PI * 2)
          ctx.fillStyle = 'white'
          ctx.globalAlpha = 0.3
          ctx.fill()
        } else if (effectGroup === 'halloween') {
          // Vẽ hình thoi hoặc hình tròn tối (đại diện cho dơi/ma)
          ctx.beginPath()
          ctx.ellipse(0, 0, p.w, p.h / 2, 0, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Confetti mặc định - hình chữ nhật
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        }

        ctx.restore()
      })
    }

    const updateFall = () => {
      particles.forEach((p) => {
        p.y += p.vy
        p.phase += 0.02
        p.x += p.vx + Math.sin(p.phase) * 0.5
        p.rotation += p.rotationSpeed
        if (p.y > height + 20) {
          p.y = -20
          p.x = Math.random() * width
          p.vy = rand(1.2, 3.5)
        }
      })
    }

    const animate = () => {
      if (effectGroup === 'snow') {
        drawSnow()
        updateSnow()
      } else {
        drawFall()
        updateFall()
      }
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    let previewTimer = null
    if (forceEnabled && durationMs) {
      previewTimer = setTimeout(() => {
        cancelAnimationFrame(animationRef.current)
        ctx.clearRect(0, 0, width, height)
      }, durationMs)
    }

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', onResize)
      ctx.clearRect(0, 0, width, height)
      if (previewTimer) clearTimeout(previewTimer)
    }
  }, [settings, isLoading, location.pathname, forceEnabled, overrideConfig, durationMs])

  if (!settings || isLoading || (isAdminPage && !forceEnabled)) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  )
}

export default SeasonalEffects
