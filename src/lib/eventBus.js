// Tiny event bus using CustomEvent on window

export const dispatchAppEvent = (name, detail) => {
  try {
    window.dispatchEvent(new CustomEvent(name, { detail }))
  } catch (e) {
    // no-op for SSR or missing window
  }
}

export const onAppEvent = (name, handler) => {
  const wrapped = (e) => handler?.(e.detail)
  window.addEventListener(name, wrapped)
  return () => window.removeEventListener(name, wrapped)
}
