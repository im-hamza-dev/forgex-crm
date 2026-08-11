// Framer Motion animation presets — import these, never write variants inline

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: 'easeOut' },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: 0.15 },
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
}

export const drawerPanel = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit:    { x: '100%' },
  transition: { type: 'spring', damping: 30, stiffness: 300 },
}

export const drawerOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
  transition: { duration: 0.2 },
}

export const modalScale = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.96 },
  transition: { duration: 0.15, ease: 'easeOut' },
}
