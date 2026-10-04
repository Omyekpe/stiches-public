import { Mail, MapPin, Phone } from 'lucide-react'
import { useContact } from '../lib/useContact'
import NeedleThread from './NeedleThread'

export default function Footer() {
  const CONTACT = useContact()
  return (
    <footer className="mt-24 border-t border-oxblood-700 bg-oxblood-900">
      <NeedleThread />
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-lg text-thread-light">Stitches by Liyah</h3>
          <p className="mt-2 text-sm text-cream-dim">
            Bespoke tailoring, stitched with care.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-cream-dim">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-thread" /> {CONTACT.address}
          </span>
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-thread" /> {CONTACT.email}
          </span>
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-thread" /> {CONTACT.phone}
          </span>
        </div>
        <p className="text-sm text-cream-dim sm:text-right">
          &copy; {new Date().getFullYear()} Stitches by Liyah. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
