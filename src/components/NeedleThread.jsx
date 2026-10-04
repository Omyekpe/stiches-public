import { motion } from 'framer-motion'
import { EASE_IN_OUT } from './Reveal'

// A seam sewn across the page: the needle leads, the dashed thread trails behind it.
// One element slides in from the left, so needle and stitches stay in sync.
export default function NeedleThread({ className = '' }) {
  return (
    <div aria-hidden className={`relative h-6 w-full overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 flex items-center"
        initial={{ transform: 'translateX(-100%)' }}
        whileInView={{ transform: 'translateX(0%)' }}
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        transition={{ duration: 1.4, ease: EASE_IN_OUT }}
      >
        <div className="h-0 flex-1 border-t-2 border-dashed border-thread" />
        <svg viewBox="0 0 48 12" className="h-3 w-12 shrink-0">
          <path d="M0 6 L40 4.8 L48 6 L40 7.2 Z" fill="#e6c65c" />
          <ellipse cx="6" cy="6" rx="3.2" ry="1.3" fill="#200406" />
        </svg>
      </motion.div>
    </div>
  )
}
