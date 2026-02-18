import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  ai_plan_chat_v2,
  ai_plan_improve,
  ai_subject_chat,
  ai_subject_improve,
  create_conversation,
  get_chat_history,
  getConversationByPlan,
  library_search,
  update_conversation_status,
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

        console.log('Nuevo ID extraído:', currentId)
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
      console.log('--- EJECUTANDO QUERY FN ---')
      console.log('ID RECIBIDO:', conversacionId)
      return get_chat_history(conversacionId!)
    },
    // Simplificamos el enabled para probar
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

export function useAISubjectImprove() {
  return useMutation({ mutationFn: ai_subject_improve })
}

export function useAISubjectChat() {
  return useMutation({ mutationFn: ai_subject_chat })
}

export function useLibrarySearch() {
  return useMutation({ mutationFn: library_search })
}
