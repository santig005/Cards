'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants } from '@/lib/drizzle/schema'
import { loginSchema, registerSchema } from '@/lib/validations/auth'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function login(formData: FormData) {
  const raw = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const result = loginSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) return { error: 'Email o contraseña incorrectos' }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const raw = {
    businessName: formData.get('businessName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const result = registerSchema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) return { error: error.message }
  if (!data.user) return { error: 'Error al crear la cuenta' }

  // Crear el tenant en la DB
  const baseSlug = slugify(result.data.businessName)
  await db.insert(tenants).values({
    name: result.data.businessName,
    slug: `${baseSlug}-${data.user.id.slice(0, 6)}`,
    ownerId: data.user.id,
  })

  // Si hay sesión activa (email confirmation deshabilitado), ir al dashboard
  // Si no hay sesión, el usuario debe confirmar su email primero
  if (data.session) {
    redirect('/dashboard')
  }

  return { success: 'Revisá tu email para confirmar tu cuenta antes de ingresar.' }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
