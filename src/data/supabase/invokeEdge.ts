import { supabaseBrowser } from "./client";

import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export type EdgeInvokeOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
};

export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public readonly functionName: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "EdgeFunctionError";
  }
}

export async function invokeEdge<TOut>(
  functionName: string,
  body?:
    | string
    | File
    | Blob
    | ArrayBuffer
    | FormData
    | ReadableStream<Uint8Array<ArrayBufferLike>>
    | Record<string, unknown>
    | undefined,
  opts: EdgeInvokeOptions = {},
  client?: SupabaseClient<Database>,
): Promise<TOut> {
  const supabase = client ?? supabaseBrowser();

  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    method: opts.method ?? "POST",
    headers: opts.headers,
  });

  if (error) {
    const anyErr = error;
    throw new EdgeFunctionError(
      anyErr.message ?? "Error en Edge Function",
      functionName,
      anyErr.status,
      anyErr,
    );
  }

  return data as TOut;
}
