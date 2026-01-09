import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { files_get_signed_url, files_list } from "../api/files.api";
import { openai_files_delete, openai_files_upload } from "../api/openaiFiles.api";

const qkFiles = {
  list: (filters: any) => ["files", "list", filters] as const,
};

export function useFilesList(filters?: { temporal?: boolean; search?: string; limit?: number }) {
  return useQuery({
    queryKey: qkFiles.list(filters ?? {}),
    queryFn: () => files_list(filters),
    staleTime: 15_000,
  });
}

export function useUploadOpenAIFile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: openai_files_upload,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useDeleteOpenAIFile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: openai_files_delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
    },
  });
}

export function useFileSignedUrl() {
  return useMutation({
    mutationFn: files_get_signed_url,
  });
}
