import { useMemo, useRef } from 'react'

export default function useTouchInteractions({ onSwipeLeft, onSwipeRight, onLongPress, longPressMs = 500 } = {}) {
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const longPressTimer = useRef(null)

  const handlers = useMemo(
    () => ({
      onTouchStart: (event) => {
        const touch = event.touches[0]
        touchStartX.current = touch.clientX
        touchStartY.current = touch.clientY

        if (onLongPress) {
          longPressTimer.current = setTimeout(() => {
            onLongPress(event)
          }, longPressMs)
        }
      },
      onTouchMove: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
      },
      onTouchEnd: (event) => {
        const touch = event.changedTouches[0]
        const dx = touch.clientX - touchStartX.current
        const dy = touch.clientY - touchStartY.current

        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }

        const horizontalSwipe = Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)
        if (!horizontalSwipe) return

        if (dx < 0 && onSwipeLeft) onSwipeLeft(event)
        if (dx > 0 && onSwipeRight) onSwipeRight(event)
      },
    }),
    [onLongPress, onSwipeLeft, onSwipeRight, longPressMs],
  )

  return handlers
}
