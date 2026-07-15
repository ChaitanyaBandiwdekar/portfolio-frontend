const raw = import.meta.env.VITE_CHAT_API_URL as string | undefined

export const CHAT_API_URL = raw ? raw.replace(/\/$/, '') : undefined
