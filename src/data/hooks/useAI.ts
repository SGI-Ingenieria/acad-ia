import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  ai_plan_chat_v2,
  ai_plan_improve,
  ai_subject_improve,
  create_conversation,
  get_chat_history,
  getConversationByPlan,
  library_search,
  update_conversation_status,
  update_recommendation_applied_status,
  update_conversation_title,
  getMessagesByConversation,
  update_subject_conversation_status,
  update_subject_recommendation_applied,
  getMessagesBySubjectConversation,
  getConversationBySubject,
  ai_subject_chat_v2,
  create_subject_conversation,
} from '../api/ai.api'

// eslint-disable-next-line node/prefer-node-protocol
import type { UUID } from 'crypto'

export function useAIPlanImprove() {
  return useMutation({ mutationFn: ai_plan_improve })
}

export function useAIPlanChat() {
  return useMutation({
    mutationFn: async (payload: {
      planId: UUID
      content: string
      campos?: Array<string>
      conversacionId?: string
    }) => {
      let currentId = payload.conversacionId

      // 1. Si no hay ID, creamos la conversación
      if (!currentId) {
        const response = await create_conversation(payload.planId)

        // CAMBIO AQUÍ: Accedemos a la estructura correcta según tu consola
        currentId = response.conversation_plan.id
      }

      // 2. Ahora enviamos el mensaje con el ID garantizado
      const result = await ai_plan_chat_v2({
        conversacionId: currentId!,
        content: payload.content,
        campos: payload.campos,
      })

      // Retornamos el resultado del chat y el ID para el estado del componente
      return { ...result, conversacionId: currentId }
    },
  })
}

export function useChatHistory(conversacionId?: string) {
  return useQuery({
    queryKey: ['chat-history', conversacionId],
    queryFn: async () => {
      return get_chat_history(conversacionId!)
    },
    enabled: Boolean(conversacionId),
  })
}

export function useUpdateConversationStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      estado,
    }: {
      id: string
      estado: 'ARCHIVADA' | 'ACTIVA'
    }) => update_conversation_status(id, estado),
    onSuccess: () => {
      // Esto refresca las listas automáticamente
      qc.invalidateQueries({ queryKey: ['conversation-by-plan'] })
    },
  })
}

export function useConversationByPlan(planId: string | null) {
  return useQuery({
    queryKey: ['conversation-by-plan', planId],
    queryFn: () => getConversationByPlan(planId!),
    enabled: !!planId, // solo ejecuta si existe planId
  })
}

export function useMessagesByChat(conversationId: string | null) {
  return useQuery({
    // La queryKey debe ser única; incluimos el ID para que se refresque al cambiar de chat
    queryKey: ['conversation-messages', conversationId],

    // Solo ejecutamos la función si el ID no es null o undefined
    queryFn: () => {
      if (!conversationId) throw new Error('Conversation ID is required')
      return getMessagesByConversation(conversationId)
    },

    // Importante: 'enabled' controla que no se dispare la petición si no hay ID
    enabled: !!conversationId,

    // Opcional: Mantener los datos previos mientras se carga la nueva conversación
    placeholderData: (previousData) => previousData,
  })
}

export function useUpdateRecommendationApplied() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      conversacionId,
      campoAfectado,
    }: {
      conversacionId: string
      campoAfectado: string
    }) => update_recommendation_applied_status(conversacionId, campoAfectado),

    onSuccess: (_, variables) => {
      // Invalidamos la query para que useConversationByPlan refresque el JSON
      qc.invalidateQueries({ queryKey: ['conversation-by-plan'] })
      console.log(
        `Recomendación ${variables.campoAfectado} marcada como aplicada.`,
      )
    },
    onError: (error) => {
      console.error('Error al actualizar el estado de la recomendación:', error)
    },
  })
}

export function useAISubjectImprove() {
  return useMutation({ mutationFn: ai_subject_improve })
}

export function useLibrarySearch() {
  return useMutation({ mutationFn: library_search })
}

export function useUpdateConversationTitle() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, nombre }: { id: string; nombre: string }) =>
      update_conversation_title(id, nombre),
    onSuccess: (_, variables) => {
      // Invalidamos para que la lista de chats se refresque
      qc.invalidateQueries({ queryKey: ['conversation-by-plan'] })
    },
  })
}

// Asignaturas

export function useAISubjectChat() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      subjectId: UUID
      content: string
      campos?: Array<string>
      conversacionId?: string
    }) => {
      let currentId = payload.conversacionId

      // 1. Si no hay ID, creamos la conversación de asignatura
      if (!currentId) {
        const response = await create_subject_conversation(payload.subjectId)
        currentId = response.conversation_asignatura.id
      }

      // 2. Enviamos mensaje al endpoint de asignatura
      const result = await ai_subject_chat_v2({
        conversacionId: currentId!,
        content: payload.content,
        campos: payload.campos,
      })

      return { ...result, conversacionId: currentId }
    },
    onSuccess: (data) => {
      // Invalidamos mensajes para que se refresque el chat
      qc.invalidateQueries({
        queryKey: ['subject-messages', data.conversacionId],
      })
    },
  })
}

export function useConversationBySubject(subjectId: string | null) {
  return useQuery({
    queryKey: ['conversation-by-subject', subjectId],
    queryFn: () => getConversationBySubject(subjectId!),
    enabled: !!subjectId,
  })
}

export function useMessagesBySubjectChat(conversationId: string | null) {
  return useQuery({
    queryKey: ['subject-messages', conversationId],
    queryFn: () => {
      if (!conversationId) throw new Error('Conversation ID is required')
      return getMessagesBySubjectConversation(conversationId)
    },
    enabled: !!conversationId,
    placeholderData: (previousData) => previousData,
  })
}

export function useUpdateSubjectRecommendation() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: { mensajeId: string; campoAfectado: string }) =>
      update_subject_recommendation_applied(
        payload.mensajeId,
        payload.campoAfectado,
      ),
    onSuccess: () => {
      // Refrescamos los mensajes para ver el check de "aplicado"
      qc.invalidateQueries({ queryKey: ['subject-messages'] })
    },
  })
}

export function useUpdateSubjectConversationStatus() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (payload: { id: string; estado: 'ARCHIVADA' | 'ACTIVA' }) =>
      update_subject_conversation_status(payload.id, payload.estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation-by-subject'] })
    },
  })
}
