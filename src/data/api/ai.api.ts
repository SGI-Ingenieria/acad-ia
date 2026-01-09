import { invokeEdge } from "../supabase/invokeEdge";
import type { InteraccionIA, UUID } from "../types/domain";

const EDGE = {
  ai_plan_improve: "ai_plan_improve",
  ai_plan_chat: "ai_plan_chat",
  ai_subject_improve: "ai_subject_improve",
  ai_subject_chat: "ai_subject_chat",

  library_search: "library_search",
} as const;

export async function ai_plan_improve(payload: {
  planId: UUID;
  sectionKey: string; // ej: "perfil_de_egreso" o tu key interna
  prompt: string;
  context?: Record<string, any>;
  fuentes?: {
    archivosIds?: UUID[];
    vectorStoresIds?: UUID[];
    usarMCP?: boolean;
    conversacionId?: string;
  };
}): Promise<{ interaccion: InteraccionIA; propuesta: any }> {
  return invokeEdge<{ interaccion: InteraccionIA; propuesta: any }>(EDGE.ai_plan_improve, payload);
}

export async function ai_plan_chat(payload: {
  planId: UUID;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  fuentes?: {
    archivosIds?: UUID[];
    vectorStoresIds?: UUID[];
    usarMCP?: boolean;
    conversacionId?: string;
  };
}): Promise<{ interaccion: InteraccionIA; reply: string; meta?: any }> {
  return invokeEdge<{ interaccion: InteraccionIA; reply: string; meta?: any }>(EDGE.ai_plan_chat, payload);
}

export async function ai_subject_improve(payload: {
  subjectId: UUID;
  sectionKey: string;
  prompt: string;
  context?: Record<string, any>;
  fuentes?: {
    archivosIds?: UUID[];
    vectorStoresIds?: UUID[];
    usarMCP?: boolean;
    conversacionId?: string;
  };
}): Promise<{ interaccion: InteraccionIA; propuesta: any }> {
  return invokeEdge<{ interaccion: InteraccionIA; propuesta: any }>(EDGE.ai_subject_improve, payload);
}

export async function ai_subject_chat(payload: {
  subjectId: UUID;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  fuentes?: {
    archivosIds?: UUID[];
    vectorStoresIds?: UUID[];
    usarMCP?: boolean;
    conversacionId?: string;
  };
}): Promise<{ interaccion: InteraccionIA; reply: string; meta?: any }> {
  return invokeEdge<{ interaccion: InteraccionIA; reply: string; meta?: any }>(EDGE.ai_subject_chat, payload);
}

/** Biblioteca (Edge; adapta a tu API real) */
export type LibraryItem = {
  id: string;
  titulo: string;
  autor?: string;
  isbn?: string;
  citaSugerida?: string;
  disponibilidad?: string;
};

export async function library_search(payload: { query: string; limit?: number }): Promise<LibraryItem[]> {
  return invokeEdge<LibraryItem[]>(EDGE.library_search, payload);
}
