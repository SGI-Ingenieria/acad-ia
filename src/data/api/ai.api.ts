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

export async function update_conversation_status(
  conversacionId: string,
  nuevoEstado: 'ARCHIVADA' | 'ACTIVA',
) {
  const supabase = supabaseBrowser()

  const { data, error } = await supabase
    .from('conversaciones_plan') // Asegúrate que el nombre de la tabla sea exacto
    .update({ estado: nuevoEstado })
    .eq('id', conversacionId)
    .select()
    .single()

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
    .order('creado_en', { ascending: false })
  if (error) throw error

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return data ?? []
}

export async function update_conversation_title(
  conversacionId: string,
  nuevoTitulo: string,
) {
  const supabase = supabaseBrowser()

  const { data, error } = await supabase
    .from('conversaciones_plan')
    .update({ nombre: nuevoTitulo }) // Asegúrate que la columna se llame 'title' o 'nombre'
    .eq('id', conversacionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function update_recommendation_applied_status(
  conversacionId: string,
  campoAfectado: string,
) {
  const supabase = supabaseBrowser()

  // 1. Obtener el estado actual del JSON
  const { data: conv, error: fetchError } = await supabase
    .from('conversaciones_plan')
    .select('conversacion_json')
    .eq('id', conversacionId)
    .single()

  if (fetchError) throw fetchError
  if (!conv?.conversacion_json)
    throw new Error('No se encontró la conversación')

  // 2. Transformar el JSON para marcar como aplicada la recomendación específica
  // Usamos una transformación inmutable para evitar efectos secundarios
  const nuevoJson = (conv.conversacion_json as Array<any>).map((msg) => {
    if (msg.user === 'assistant' && Array.isArray(msg.recommendations)) {
      return {
        ...msg,
        recommendations: msg.recommendations.map((rec: any) =>
          rec.campo_afectado === campoAfectado
            ? { ...rec, aplicada: true }
            : rec,
        ),
      }
    }
    return msg
  })

  // 3. Actualizar la base de datos con el nuevo JSON
  const { data, error: updateError } = await supabase
    .from('conversaciones_plan')
    .update({ conversacion_json: nuevoJson })
    .eq('id', conversacionId)
    .select()
    .single()

  if (updateError) throw updateError
  return data
}
