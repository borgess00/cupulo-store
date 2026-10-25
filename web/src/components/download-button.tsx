"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

/** Pede um link assinado (válido por poucos minutos) e inicia o download. */
export function DownloadButton({ fileId }: { fileId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/download/${fileId}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.message ?? "Não foi possível baixar agora.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Sem conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={download} disabled={loading} className={buttonClasses("primary", "sm")}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Baixar
      </button>
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
}
