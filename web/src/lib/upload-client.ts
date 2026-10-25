// Envio de arquivo do navegador direto para a URL assinada (PUT), com progresso.
export function uploadWithProgress(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else if (xhr.status === 413) reject(new Error("Arquivo maior que o limite do bucket."));
      else reject(new Error(`O storage recusou o envio (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Falha de conexão durante o envio."));
    xhr.send(file);
  });
}
