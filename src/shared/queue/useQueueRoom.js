import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { env } from '../config/env.js'

// Keeps the latest onUpdate in a ref instead of the effect's dependency array
// so passing a fresh inline callback each render doesn't reconnect the socket.
export function useQueueRoom(queueId, onUpdate) {
  const onUpdateRef = useRef(onUpdate)

  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    if (!queueId) {
      return undefined
    }

    const socket = io(env.socketUrl, { transports: ['websocket'] })

    socket.on('connect', () => {
      socket.emit('queue:join', { queueId })
    })

    socket.on('queue:update', (payload) => onUpdateRef.current?.(payload))

    return () => {
      socket.disconnect()
    }
  }, [queueId])
}
