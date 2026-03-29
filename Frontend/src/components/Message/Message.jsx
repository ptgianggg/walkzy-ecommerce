import { notification } from 'antd'
import './Message.css'

const DEFAULT_DURATION = 3
const DEDUPE_WINDOW = 1000 // ms

// Simple dedupe: avoid showing identical messages (same type+text) within DEDUPE_WINDOW
const recent = new Map()

const show = (type, title, mes = '', duration = DEFAULT_DURATION) => {
    try {
        const key = `${type}:${mes}`
        const now = Date.now()
        const last = recent.get(key) || 0
        if (now - last < DEDUPE_WINDOW) return
        recent.set(key, now)
        // cleanup after window
        setTimeout(() => recent.delete(key), DEDUPE_WINDOW + 200)

        notification[type]({
            message: title,
            description: mes,
            placement: 'topRight',
            duration
        })
    } catch (e) {
        // fallback to console - do not throw
        // console.error('Notification error', e)
    }
}

const success = (mes = 'Success', duration = DEFAULT_DURATION) => {
    show('success', 'Thành công', mes, duration)
}

const error = (mes = 'Error', duration = DEFAULT_DURATION) => {
    show('error', 'Lỗi', mes, duration)
}

const warning = (mes = 'Warning', duration = DEFAULT_DURATION) => {
    show('warning', 'Cảnh báo', mes, duration)
}

const info = (mes = 'Info', duration = DEFAULT_DURATION) => {
    show('info', 'Thông tin', mes, duration)
}

export { success, error, warning, info }
