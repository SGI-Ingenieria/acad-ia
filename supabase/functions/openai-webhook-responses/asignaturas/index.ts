import type { OpenAI } from "openai";
import { ResponseMetadata } from "../../_shared/utils.ts";
import { handleCrearAsignaturaResponse } from "./crear.ts";

export async function handleAsignaturasResponse(
  response: OpenAI.Responses.Response,
): Promise<void> {
  const metadata = response.metadata as ResponseMetadata | null;
  const accion = metadata?.accion;

  if (!accion) {
    console.warn("No se recibió metadata.accion para asignaturas");
    return;
  }

  switch (accion) {
    case "crear":
    case "actualizar":
      await handleCrearAsignaturaResponse(response);
      return;
    default:
      console.warn("Acción no reconocida para asignaturas:", accion);
      return;
  }
}
