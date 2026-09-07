import * as React from "react"

const MOBILE_BREAKPOINT = 768

function getIsMobile() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
}

function subscribeToViewport(cb: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", cb)
  return () => mql.removeEventListener("change", cb)
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribeToViewport, getIsMobile, () => false)
}
