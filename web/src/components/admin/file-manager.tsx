"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Trash2, Upload } from "lucide-react";
import { confirmFileUpload, deleteProductFile, prepareUpload } from "@/app/admin/actions/products";
import { fieldCls, labelCls } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { formatBytes, formatDate } from "@/lib/format";
import { uploadWithProgress } from "@/lib/upload-client";

type FileRow = { id: string; name: string; sizeBytes: string; version: string | null; createdAt: string; downloads: number };

export function FileManager({ productId, files }: { productId: string; files: FileRow[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function upload(file: File) {
    setError(null);
    setProgress(0);
    try {
      const prep = await prepareUpload({
        productId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        kind: "file",
      });
      if (!prep.ok) throw new Error(prep.error);
      await uploadWithProgress(prep.url, file, setProgress);
      const done = await confirmFileUpload({
        productId,
        storageKey: prep.storageKey,
        name: file.name,
        version,
        mimeType: file.type,
      });
      if (!done?.ok) throw new Error(done?.error ?? "Falha ao registrar o arquivo.");
      setVersion("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string, name: string) {
    if (!confirm(`Excluir "${name}"? Os clientes não poderão mais baixar este arquivo.`)) return;
    startTransition(async () => {
      const r = await deleteProductFile(id);
      if (!r?.ok) setError(r?.error ?? "Falha ao excluir.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <p className="text-sm text-ash">Nenhum arquivo ainda.</p>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold">{f.name}</p>
                <p className="text-xs text-smoke">
                  {formatBytes(BigInt(f.sizeBytes))}
                  {f.version && ` · v${f.version}`} · {formatDate(f.createdAt)} · {f.downloads} download(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(f.id, f.name)}
                disabled={pending}
                aria-label={`Excluir ${f.name}`}
                className={buttonClasses("danger", "sm")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-[8rem_1fr] sm:items-end">
        <div>
          <label htmlFor="file-version" className={labelCls}>Versão</label>
          <input id="file-version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0" className={fieldCls} />
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            id="file-input"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            disabled={progress !== null}
          />
          <label htmlFor="file-input" className={buttonClasses("outline", "md", `w-full cursor-pointer ${progress !== null ? "pointer-events-none opacity-60" : ""}`)}>
            <Upload className="h-4 w-4" /> {progress !== null ? `Enviando… ${progress}%` : "Enviar arquivo"}
          </label>
        </div>
      </div>
      {progress !== null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-paper transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-smoke">
        O arquivo vai direto para o bucket privado. No plano gratuito do Supabase o limite é 50 MB por arquivo.
      </p>
    </div>
  );
}
