// Lets a signed-in admin list, add and remove other admins.
// Needs the service-role key, which Supabase injects here automatically and
// which must never be shipped to the browser — hence an Edge Function.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: userData, error: authError } = await caller.auth.getUser()
  if (authError || !userData.user) return json({ error: 'Not signed in' }, 401)
  const me = userData.user

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const body = await req.json().catch(() => ({}))

  if (body.action === 'list') {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 })
    if (error) return json({ error: error.message }, 500)
    return json({
      admins: data.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        isMe: u.id === me.id,
      })),
    })
  }

  if (body.action === 'create') {
    const email = String(body.email ?? '').trim()
    const password = String(body.password ?? '')
    if (!email || password.length < 8) {
      return json({ error: 'Email and a password of at least 8 characters are required' }, 400)
    }
    const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (body.action === 'delete') {
    if (body.id === me.id) return json({ error: "You can't remove yourself" }, 400)
    const { error } = await admin.auth.admin.deleteUser(String(body.id))
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  return json({ error: 'Unknown action' }, 400)
})
