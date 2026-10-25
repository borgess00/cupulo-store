"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Vídeo leve: mostra a miniatura e só carrega o player do YouTube ao tocar
 * (economiza dados no celular). Usa youtube-nocookie.
 */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-line bg-ink-3">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0" aria-label={`Assistir: ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover opacity-70 grayscale transition group-hover:opacity-90 group-hover:grayscale-0"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper text-ink shadow-[4px_4px_0_0_rgb(255_255_255/0.25)] transition group-hover:scale-105">
              <Play className="ml-1 h-7 w-7" fill="currentColor" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
