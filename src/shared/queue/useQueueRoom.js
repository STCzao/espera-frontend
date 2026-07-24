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

    // forceNew avoids socket.io-client's manager-sharing cache: without it,
    // StrictMode's mount→cleanup→mount in dev tears down the first socket
    // before it finishes connecting, and the second instance can silently
    // reuse a half-torn-down manager instead of opening a fresh connection.
    const socket = io(env.socketUrl, { forceNew: true, transports: ['websocket'] })

    socket.on('connect', () => {
      socket.emit('queue:join', { queueId })
    })

    socket.on('queue:update', (payload) => onUpdateRef.current?.(payload))

    return () => {
      socket.disconnect()
    }
  }, [queueId])
}
