import { pgTable, uuid, text, char, integer, boolean, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const rewardTypeEnum = pgEnum('reward_type', ['free_product', 'discount_percent', 'two_for_one', 'custom'])

// ─── Tenants (negocios) ───────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  ownerId: uuid('owner_id').notNull(), // ref → auth.users
  collectCustomerData: boolean('collect_customer_data').notNull().default(false),
  // ── Multi-país (ver ADR-007) ──────────────────────────────────────────────
  // ISO 3166-1 alpha-2 del negocio; ancla la normalización de teléfono (E.164).
  countryCode: char('country_code', { length: 2 }).notNull().default('CO'),
  // Zona horaria IANA del negocio; usada para agrupar analytics por día local.
  timezone: text('timezone').notNull().default('America/Bogota'),
  // Idioma preferido del negocio (es | en | pt).
  locale: text('locale').notNull().default('es'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Loyalty programs (una por tenant en MVP) ─────────────────────────────────

export const loyaltyPrograms = pgTable('loyalty_programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(), // RLS anchor
  stampsRequired: integer('stamps_required').notNull().default(10),
  rewardType: rewardTypeEnum('reward_type').notNull().default('custom'),
  rewardDescription: text('reward_description').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Customers (clientes del negocio) ────────────────────────────────────────

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(), // RLS anchor
  phone: text('phone').notNull(),
  name: text('name'),
  email: text('email'),
  authUserId: uuid('auth_user_id'), // ref → auth.users (nullable: se asigna tras OTP)
  // ── Preferencias de notificaciones push (ver feat/web-push) ───────────────
  notifyReward: boolean('notify_reward').notNull().default(true), // avisar cuando la recompensa está lista
  notifyNewStamp: boolean('notify_new_stamp').notNull().default(true), // avisar cuando suma un sello
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Loyalty cards (una por cliente por programa) ─────────────────────────────

export const loyaltyCards = pgTable('loyalty_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(), // RLS anchor
  customerId: uuid('customer_id').notNull(),
  programId: uuid('program_id').notNull(),
  currentStamps: integer('current_stamps').notNull().default(0),
  totalRedeemed: integer('total_redeemed').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ─── Stamp events (auditoría de cada sello) ───────────────────────────────────

export const stampEvents = pgTable('stamp_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(), // RLS anchor
  cardId: uuid('card_id').notNull(),
  customerId: uuid('customer_id').notNull(),
  registeredById: uuid('registered_by_id').notNull(), // empleado que dio el sello
  eventType: text('event_type', { enum: ['stamp', 'redeem'] }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ─── Push subscriptions (suscripciones Web Push del cliente final) ────────────

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(), // RLS anchor
  customerId: uuid('customer_id').notNull(),
  endpoint: text('endpoint').notNull().unique(), // URL del push endpoint del navegador; única globalmente
  p256dh: text('p256dh').notNull(), // clave pública de la suscripción
  auth: text('auth').notNull(), // secreto de auth de la suscripción
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const walletPasses = pgTable(
  'wallet_passes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(), // RLS anchor
    customerId: uuid('customer_id').notNull(),
    cardId: uuid('card_id').notNull(), // la loyalty_card que el pase refleja
    channel: text('channel').notNull().default('google'), // 'google' (futuro: 'apple')
    objectId: text('object_id').notNull(), // id del Loyalty Object en Google (issuerId.suffix)
    classId: text('class_id').notNull(), // id de la Loyalty Class en Google
    status: text('status').notNull().default('active'), // 'active' | 'revoked'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqCardChannel: uniqueIndex('uniq_wallet_passes_card_channel').on(table.cardId, table.channel),
  }),
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert

export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect
export type NewLoyaltyProgram = typeof loyaltyPrograms.$inferInsert

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert

export type LoyaltyCard = typeof loyaltyCards.$inferSelect
export type NewLoyaltyCard = typeof loyaltyCards.$inferInsert

export type StampEvent = typeof stampEvents.$inferSelect
export type NewStampEvent = typeof stampEvents.$inferInsert

export type PushSubscription = typeof pushSubscriptions.$inferSelect
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert

export type WalletPass = typeof walletPasses.$inferSelect
export type NewWalletPass = typeof walletPasses.$inferInsert
