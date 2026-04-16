// supabase/functions/_shared/openai-service.ts
/// <reference lib="deno.window" />
import OpenAI from "npm:openai@6.16.0"
import type * as OpenAITypes from "npm:openai@6.16.0";
// Use non-streaming params to ensure `responses.create` returns a typed Response
export type StructuredResponseOptions =
    OpenAITypes.OpenAI.Responses.ResponseCreateParamsNonStreaming;
export type StructuredResponseSuccess<TOutput = unknown> = {
    ok: true;
    output?: TOutput; // parsed JSON when available
    outputText?: string; // raw text when parsing is not possible
    model: string;
    usage?: OpenAITypes.OpenAI.Responses.Response["usage"] | null;
    responseId: string;
    conversationId?: string | null;
    references: {
        openaiFileIds: string[]; // file ids in OpenAI
    };
    openaiRaw: OpenAITypes.OpenAI.Responses.Response; // keep for advanced consumers
};
export type StructuredResponseFailure = {
    ok: false;
    code:
        | "MissingEnv"
        | "OpenAIFileUploadFailed"
        | "OpenAIRequestFailed";
    message: string;
    cause?: unknown;
};
export type StructuredResponseResult<TOutput = unknown> =
    | StructuredResponseSuccess<TOutput>
    | StructuredResponseFailure;
export interface OpenAIServiceConfig {
    openAIApiKey: string;
}
export class OpenAIService {
    private readonly openai: OpenAI;
    private constructor(openai: OpenAI) {
        this.openai = openai;
    }
    static fromEnv(): StructuredResponseFailure | OpenAIService {
        const openAIApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
        if (!openAIApiKey) {
            return {
                ok: false,
                code: "MissingEnv",
                message: "Required env vars missing: OPENAI_API_KEY",
            };
        }
        const openai = new OpenAI({ apiKey: openAIApiKey });
        return new OpenAIService(openai);
    }
    async createConversation(metadata?: Record<string, string>) {
        const conversation = await this.openai.conversations.create({
            metadata,
        });
        return conversation;
    }
    async createStructuredResponse<TOutput = unknown>(
        options: StructuredResponseOptions,
        files?: File[],
    ): Promise<StructuredResponseResult<TOutput>> {
        try {
            const openaiFileIds = await this.uploadFilesToOpenAI(files ?? []);

            const newOptions = { ...options };
            // Attach file references to the request as an extra user message
            if (openaiFileIds.length > 0) {
                const fileParts:
                    OpenAITypes.OpenAI.Responses.ResponseInputFile[] =
                        openaiFileIds.map((id) => ({
                            type: "input_file",
                            file_id: id,
                        }));
                const arr = Array.isArray(options.input) ? options.input : [];
                arr.push({
                    role: "user",
                    content: [
                        ...fileParts,
                        {
                            type: "input_text",
                            text: "Usa estos archivos como referencia",
                        },
                    ],
                });
                newOptions.input = arr;
            }

            // Narrow to non-streaming response 
            const openaiRaw = (await this.openai.responses.create(
                newOptions as OpenAITypes.OpenAI.Responses.ResponseCreateParamsNonStreaming,
            )) as OpenAITypes.OpenAI.Responses.Response;

            const isBackground =
                (newOptions as unknown as { background?: boolean })
                    .background ===
                    true;
            const { model, id: responseId } = openaiRaw;
            const usage = openaiRaw?.usage ?? null;
            const conversationId = (
                openaiRaw as OpenAITypes.OpenAI.Responses.Response & {
                    conversation_id?: string | null;
                }
            ).conversation_id ?? null;

            if (isBackground) {
                return {
                    ok: true,
                    output: undefined,
                    outputText: undefined,
                    model: String(model),
                    usage,
                    responseId: String(responseId),
                    conversationId: conversationId
                        ? String(conversationId)
                        : null,
                    references: { openaiFileIds },
                    openaiRaw,
                };
            }
            // Try to read structured JSON output
            let output: TOutput | undefined = undefined;
            let outputText: string | undefined = undefined;
            // Prefer `output_text` if present (SDK convenience)
            const maybeOutputText = openaiRaw.output_text;
            if (
                typeof maybeOutputText === "string" &&
                maybeOutputText.length > 0
            ) {
                outputText = maybeOutputText;
                try {
                    output = JSON.parse(maybeOutputText) as TOutput;
                } catch {
                    /* non-JSON text, keep as text only */
                }
            } else {
                // Fallback: attempt to serialize `openaiRaw.output` into text
                const maybeOutput = openaiRaw.output as unknown;
                if (typeof maybeOutput === "object" && maybeOutput != null) {
                    try {
                        outputText = JSON.stringify(maybeOutput);
                        output = maybeOutput as TOutput;
                    } catch {
                        /* ignore */
                    }
                }
            }
            return {
                ok: true,
                output,
                outputText,
                model: String(model),
                usage,
                responseId: String(responseId),
                conversationId: conversationId ? String(conversationId) : null,
                references: { openaiFileIds },
                openaiRaw,
            };
        } catch (err) {
            const e = err as Error;
            const message = e?.message ?? "Unknown error";
            const code = message.includes("OpenAI file upload failed")
                ? "OpenAIFileUploadFailed"
                : "OpenAIRequestFailed";
            return { ok: false, code, message, cause: err };
        }
    }
    private async uploadFilesToOpenAI(files: File[]): Promise<string[]> {
        const ids: string[] = [];
        for (const file of files) {
            try {
                const created = await this.openai.files.create({
                    file,
                    purpose: "user_data",
                });
                ids.push(created.id);
            } catch (e) {
                throw new Error(
                    `OpenAI file upload failed: ${
                        (e as Error)?.message ?? String(e)
                    }`,
                );
            }
        }
        return ids;
    }
    private sanitizeFilename(name: string): string {
        return name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9.-]/g, "_");
    }
}
