// Root-admin-only management of admin accounts and their permissions.
// Needs the service-role key, which Supabase injects here automatically and
// which must never be shipped to the browser — hence an Edge Function.
import { createClient } from 'npm:@supabase/supabase-js@2'

const AREAS = ['products', 'inquiries', 'orders', 'ledger', 'contact']

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

// Keep only known areas, so a hand-crafted request can't invent permissions.
const cleanAreas = (value: unknown): string[] =>
  Array.isArray(value) ? AREAS.filter((a) => value.includes(a)) : []

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

  const { data: myProfile } = await admin
    .from('admin_profiles')
    .select('role')
    .eq('user_id', me.id)
    .maybeSingle()
  if (myProfile?.role !== 'root') return json({ error: 'Only the root admin can do this' }, 403)

  const body = await req.json().catch(() => ({}))

  if (body.action === 'list') {
    const [{ data: users, error }, { data: profiles }] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 200 }),
      admin.from('admin_profiles').select('user_id, role, permissions'),
    ])
    if (error) return json({ error: error.message }, 500)
    const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]))
    return json({
      admins: users.users.map((u) => ({
        id: u.id,
        email: u.email,
        isMe: u.id === me.id,
        role: byUser.get(u.id)?.role ?? 'none',
        permissions: byUser.get(u.id)?.permissions ?? [],
      })),
    })
  }

  if (body.action === 'create') {
    const email = String(body.email ?? '').trim()
    const password = String(body.password ?? '')
    if (!email || password.length < 8) {
      return json({ error: 'Email and a password of at least 8 characters are required' }, 400)
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) return json({ error: error.message }, 400)
    const makeRoot = body.role === 'root'
    const { error: profileError } = await admin.from('admin_profiles').insert({
      user_id: data.user.id,
      role: makeRoot ? 'root' : 'admin',
      permissions: makeRoot ? AREAS : cleanAreas(body.permissions),
    })
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id) // don't leave an account with no profile
      return json({ error: profileError.message }, 500)
    }
    return json({ ok: true })
  }

  if (body.action === 'setPermissions') {
    const id = String(body.id)
    const { data: target } = await admin
      .from('admin_profiles')
      .select('role')
      .eq('user_id', id)
      .maybeSingle()
    if (target?.role === 'root') return json({ error: "The root admin's access can't be changed" }, 400)
    const { error } = await admin
      .from('admin_profiles')
      .upsert({ user_id: id, role: 'admin', permissions: cleanAreas(body.permissions) })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (body.action === 'setRole') {
    const id = String(body.id)
    if (id === me.id) return json({ error: "You can't change your own role" }, 400)
    if (body.role !== 'root' && body.role !== 'admin') return json({ error: 'Unknown role' }, 400)
    const { data: target } = await admin
      .from('admin_profiles')
      .select('permissions')
      .eq('user_id', id)
      .maybeSingle()
    const { error } = await admin.from('admin_profiles').upsert({
      user_id: id,
      role: body.role,
      permissions: body.role === 'root' ? AREAS : (target?.permissions ?? []),
    })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  if (body.action === 'delete') {
    const id = String(body.id)
    if (id === me.id) return json({ error: "You can't remove yourself" }, 400)
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  }

  return json({ error: 'Unknown action' }, 400)
})
