import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

// Shown until the site_settings row loads (or if the table hasn't been created yet).
export const DEFAULT_CONTACT = {
  address: '14 Ahmadu Bello Way, Lagos, Nigeria',
  email: 'hello@stitchesbyliyah.com',
  phone: '+234 800 000 0000',
}

export function useContact() {
  const [contact, setContact] = useState(DEFAULT_CONTACT)

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('address, email, phone')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => data && setContact({ ...DEFAULT_CONTACT, ...data }))
  }, [])

  return contact
}
