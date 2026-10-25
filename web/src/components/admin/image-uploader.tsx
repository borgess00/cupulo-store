"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { confirmImageUpload, prepareUpload, removeProductImage } from "@/app/admin/actions/products";
import { buttonClasses } from "@/components/ui/button";
import { uploadWithProgress } from "@/lib/upload-client";

export function ImageUploader({ productId, hasImage }: { productId: string; hasImage: boolean }) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setProgress(0);
    try {
      const prep = await prepareUpload({ productId, fileName: file.name, contentType: file.type, size: file.size, kind: "image" });
      if (!prep.ok) throw new Error(prep.error);
      await uploadWithProgress(prep.url, file, setProgress);
      const done = await confirmImageUpload({ productId, storageKey: prep.storageKey });
      if (!done?.ok) throw new Error(done?.error ?? "Falha ao salvar a imagem.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no envio.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <label className={buttonClasses("outline", "sm", `cursor-pointer ${progress !== null ? "pointer-events-none opacity-60" : ""}`)}>
          <ImagePlus className="h-4 w-4" />
          {progress !== null ? `Enviando… ${progress}%` : hasImage ? "Trocar imagem" : "Enviar imagem"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
        {hasImage && (
          <button
            type="button"
            className={buttonClasses("ghost", "sm")}
            onClick={async () => {
              await removeProductImage(productId);
              router.refresh();
            }}
          >
            <Trash2 className="h-4 w-4" /> Usar capa automática
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-smoke">PNG, JPG ou WEBP até 5 MB, de preferência 1600×1000.</p>
    </div>
  );
}
