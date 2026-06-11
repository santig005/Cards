'use server'

import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/drizzle/db'
import { tenants } from '@/lib/drizzle/schema'
import { buildLoginSchema, buildRegisterSchema } from '@/lib/validations/auth'

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

  const v = await getTranslations('validation')
  const schema = buildLoginSchema({
    emailInvalid: v('emailInvalid'),
    passwordMin: v('passwordMin'),
    nameMin2: v('nameMin2'),
    nameMax80: v('nameMax80'),
  })
  const result = schema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    const t = await getTranslations('errors')
    return { error: t('invalidCredentials') }
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const raw = {
    businessName: formData.get('businessName') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const v = await getTranslations('validation')
  const schema = buildRegisterSchema({
    emailInvalid: v('emailInvalid'),
    passwordMin: v('passwordMin'),
    nameMin2: v('nameMin2'),
    nameMax80: v('nameMax80'),
  })
  const result = schema.safeParse(raw)
  if (!result.success) {
    return { error: result.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  })

  if (error) return { error: error.message }

  const t = await getTranslations('errors')
  if (!data.user) return { error: t('accountCreationError') }

  // Crear el tenant en la DB
  const baseSlug = slugify(result.data.businessName)
  await db.insert(tenants).values({
    name: result.data.businessName,
    slug: `${baseSlug}-${data.user.id.slice(0, 6)}`,
    ownerId: data.user.id,
  })

  // Si hay sesión activa (email confirmation deshabilitado), ir al onboarding
  // Si no hay sesión, el usuario debe confirmar su email primero
  if (data.session) {
    redirect('/dashboard/onboarding')
  }

  const tAuth = await getTranslations('errors')
  return { success: tAuth('checkEmail') }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
