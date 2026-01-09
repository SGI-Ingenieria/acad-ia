import { useMutation } from "@tanstack/react-query";

import {
  ai_plan_chat,
  ai_plan_improve,
  ai_subject_chat,
  ai_subject_improve,
  library_search,
} from "../api/ai.api";

export function useAIPlanImprove() {
  return useMutation({ mutationFn: ai_plan_improve });
}

export function useAIPlanChat() {
  return useMutation({ mutationFn: ai_plan_chat });
}

export function useAISubjectImprove() {
  return useMutation({ mutationFn: ai_subject_improve });
}

export function useAISubjectChat() {
  return useMutation({ mutationFn: ai_subject_chat });
}

export function useLibrarySearch() {
  return useMutation({ mutationFn: library_search });
}
