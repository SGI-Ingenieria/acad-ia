import { ResponseMetadata } from "../../_shared/utils.ts";
import type { OpenAI } from "openai";
import { handleCrearPlanEstudio } from "./crear.ts";

export async function handlePlanesEstudioResponse(
  response: OpenAI.Responses.Response,
): Promise<void> {
  const metadata = response.metadata as ResponseMetadata | null;
  if (!metadata || !metadata.accion) {
    console.warn("No se recibió acción en la metadata");
    return;
  }

  switch (metadata.accion) {
    case "crear":
      await handleCrearPlanEstudio(response);
      return;
    case "actualizar":
      // Lógica para actualizar un plan de estudio
      return;
    case "eliminar":
      // Lógica para eliminar un plan de estudio
      return;
    default:
      console.warn("Acción no reconocida:", metadata.accion);
  }
}
