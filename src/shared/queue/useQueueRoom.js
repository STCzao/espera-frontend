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

    // `connect` fires again after the browser/OS drops and restores the
    // connection (e.g. phone screen locks and unlocks) — re-joining the room
    // alone would silently miss whatever happened while disconnected, so
    // refresh on every (re)connect too, not just the first one (HU-6.6).
    socket.on('connect', () => {
      socket.emit('queue:join', { queueId })
      onUpdateRef.current?.()
    })

    socket.on('queue:update', (payload) => onUpdateRef.current?.(payload))

    // Belt and suspenders: some mobile browsers suspend background tabs
    // aggressively enough that the socket's own reconnect isn't enough to
    // notice — refresh whenever the tab becomes visible again.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        onUpdateRef.current?.()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      socket.disconnect()
    }
  }, [queueId])
}
