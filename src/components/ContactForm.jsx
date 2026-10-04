import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { EASE_OUT } from './Reveal'

const field =
  'w-full rounded-md border border-oxblood-600 bg-oxblood-900/80 px-4 py-3 text-cream placeholder:text-cream-dim/60 transition-[border-color,box-shadow] duration-200 focus:border-thread focus:shadow-[0_0_0_3px_rgb(201_162_39/0.18)] focus:outline-none'

export default function ContactForm() {
  const [searchParams] = useSearchParams()
  const product = searchParams.get('product')
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (product) {
      setForm((f) => ({ ...f, message: `I'm interested in: ${product}` }))
    }
  }, [product])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase
      .from('inquiries')
      .insert([{ ...form, product_name: product || null }])
    if (error) {
      setStatus('error')
      setErrorMessage(error.message)
      return
    }
    setStatus('sent')
    setForm({ name: '', email: '', message: '' })
  }

  if (status === 'sent') {
    return (
      <motion.div
        initial={{ opacity: 0, transform: 'scale(0.96)' }}
        animate={{ opacity: 1, transform: 'scale(1)' }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
        className="flex flex-col items-center rounded-lg border-2 border-dashed border-thread/70 p-8 text-center"
      >
        {/* The check is stitched in, then the message follows */}
        <svg viewBox="0 0 52 52" className="h-16 w-16" fill="none" stroke="#e6c65c" strokeWidth="2.5">
          <circle cx="26" cy="26" r="23" strokeDasharray="5 5" strokeOpacity="0.7" />
          <motion.path
            d="M15 27 l8 8 l14 -16"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
          />
        </svg>
        <p className="mt-4 text-thread-light">
          Thank you — your message has been stitched into our inbox. We'll reply soon.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-oxblood-700 bg-oxblood-900/50 p-6">
      {product && (
        <p className="text-sm text-thread">
          Regarding: <span className="text-thread-light">{product}</span>
        </p>
      )}
      <input
        required
        aria-label="Your name"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={field}
      />
      <input
        required
        type="email"
        aria-label="Your email"
        placeholder="Your email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className={field}
      />
      <textarea
        required
        rows={4}
        aria-label="Message"
        placeholder="What are you looking to have made?"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={field}
      />
      <button type="submit" disabled={status === 'sending'} className="btn-thread">
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
      {status === 'error' && (
        <motion.p
          initial={{ opacity: 0, transform: 'translateY(-4px)' }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          transition={{ duration: 0.2, ease: EASE_OUT }}
          role="alert"
          className="text-sm text-oxblood-400"
        >
          Something went wrong: {errorMessage}
        </motion.p>
      )}
    </form>
  )
}
