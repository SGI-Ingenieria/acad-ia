import { supabaseBrowser } from '../supabase/client'
import { invokeEdge } from '../supabase/invokeEdge'

import type { InteraccionIA, UUID } from '../types/domain'

const EDGE = {
  ai_plan_improve: 'ai_plan_improve',
  ai_plan_chat: 'ai_plan_chat',
  ai_subject_improve: 'ai_subject_improve',
  ai_subject_chat: 'ai_subject_chat',

  library_search: 'library_search',
} as const

export async function ai_plan_improve(payload: {
  planId: UUID
  sectionKey: string // ej: "perfil_de_egreso" o tu key interna
  prompt: string
  context?: Record<string, any>
  fuentes?: {
    archivosIds?: Array<UUID>
    vectorStoresIds?: Array<UUID>
    usarMCP?: boolean
    conversacionId?: string
  }
}): Promise<{ interaccion: InteraccionIA; propuesta: any }> {
  return invokeEdge<{ interaccion: InteraccionIA; propuesta: any }>(
    EDGE.ai_plan_improve,
    payload,
  )
}

export async function ai_plan_chat(payload: {
  planId: UUID
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  fuentes?: {
    archivosIds?: Array<UUID>
    vectorStoresIds?: Array<UUID>
    usarMCP?: boolean
    conversacionId?: string
  }
}): Promise<{ interaccion: InteraccionIA; reply: string; meta?: any }> {
  return invokeEdge<{ interaccion: InteraccionIA; reply: string; meta?: any }>(
    EDGE.ai_plan_chat,
    payload,
  )
}

export async function ai_subject_improve(payload: {
  subjectId: UUID
  sectionKey: string
  prompt: string
  context?: Record<string, any>
  fuentes?: {
    archivosIds?: Array<UUID>
    vectorStoresIds?: Array<UUID>
    usarMCP?: boolean
    conversacionId?: string
  }
}): Promise<{ interaccion: InteraccionIA; propuesta: any }> {
  return invokeEdge<{ interaccion: InteraccionIA; propuesta: any }>(
    EDGE.ai_subject_improve,
    payload,
  )
}

export async function ai_subject_chat(payload: {
  subjectId: UUID
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  fuentes?: {
    archivosIds?: Array<UUID>
    vectorStoresIds?: Array<UUID>
    usarMCP?: boolean
    conversacionId?: string
  }
}): Promise<{ interaccion: InteraccionIA; reply: string; meta?: any }> {
  return invokeEdge<{ interaccion: InteraccionIA; reply: string; meta?: any }>(
    EDGE.ai_subject_chat,
    payload,
  )
}

/** Biblioteca (Edge; adapta a tu API real) */
export type LibraryItem = {
  id: string
  titulo: string
  autor?: string
  isbn?: string
  citaSugerida?: string
  disponibilidad?: string
}

export async function library_search(payload: {
  query: string
  limit?: number
}): Promise<Array<LibraryItem>> {
  return invokeEdge<Array<LibraryItem>>(EDGE.library_search, payload)
}

export async function create_conversation(planId: string) {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase.functions.invoke(
    'create-chat-conversation/conversations',
    {
      method: 'POST',
      body: {
        plan_estudio_id: planId, // O el nombre que confirmamos que funciona
        instanciador: 'alex',
      },
    },
  )

  if (error) throw error

  // LOG de depuración: Mira qué estructura trae 'data'
  console.log('Respuesta creación conv:', data)

  // Si data es { id: "..." }, devolvemos data.
  // Si data viene envuelto, asegúrate de retornar el objeto con el id.
  return data
}

export async function get_chat_history(conversacionId: string) {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase.functions.invoke(
    `create-chat-conversation/conversations/${conversacionId}/messages`,
    { method: 'GET' },
  )
  if (error) throw error
  return data // Retorna Array de mensajes
}

export async function archive_conversation(conversacionId: string) {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase.functions.invoke(
    `create-chat-conversation/conversations/${conversacionId}/archive`,
    { method: 'DELETE' },
  )
  if (error) throw error
  return data
}

// Modificamos la función de chat para que use la ruta de mensajes
export async function ai_plan_chat_v2(payload: {
  conversacionId: string
  content: string
  campos?: Array<string>
}): Promise<{ reply: string; meta?: any }> {
  const supabase = supabaseBrowser()
  const { data, error } = await supabase.functions.invoke(
    `create-chat-conversation/conversations/${payload.conversacionId}/messages`,
    {
      method: 'POST',
      body: {
        content: payload.content,
        campos: payload.campos || [],
      },
    },
  )
  if (error) throw error
  return data
}

export async function getConversationByPlan(planId: string) {
  const supabase = supabaseBrowser()

  const { data, error } = await supabase
    .from('conversaciones_plan')
    .select('*')
    .eq('plan_estudio_id', planId)
    .order('creado_en', { ascending: true })
  if (error) throw error

  return data ?? []
}
