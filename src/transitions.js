// One place to tune every page/sidebar transition.
export const BLUR = 'blur(10px)'

export const blurFade = {
  initial: { opacity: 0, filter: BLUR },
  animate: { opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
  exit: { opacity: 0, filter: BLUR },
  transition: { duration: 0.25, ease: 'easeInOut' },
}