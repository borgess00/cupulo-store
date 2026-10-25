"use client";

import { useActionState, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { type ActionState, saveProduct } from "@/app/admin/actions/products";
import { fieldCls, labelCls } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { submitWithoutReset } from "@/lib/form";
import { slugify } from "@/lib/slug";

type ProductValues = {
  id?: string;
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  category: string;
  platform: string;
  type: string;
  youtubeUrl: string | null;
  tutorialMd: string | null;
  sortOrder: number;
  active: boolean;
};

const EMPTY: ProductValues = {
  name: "",
  slug: "",
  shortDesc: "",
  description: "",
  category: "Packs",
  platform: "ANDROID",
  type: "PACK",
  youtubeUrl: "",
  tutorialMd: "",
  sortOrder: 0,
  active: true,
};

export function ProductForm({ product }: { product?: ProductValues }) {
  const v = product ?? EMPTY;
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProduct, null);
  const [name, setName] = useState(v.name);
  const [slug, setSlug] = useState(v.slug);
  const [slugTouched, setSlugTouched] = useState(!!product);

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-5">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>Nome</label>
          <input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className={fieldCls}
          />
        </div>
        <div>
          <label htmlFor="slug" className={labelCls}>Slug (endereço)</label>
          <input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className={fieldCls}
          />
          <p className="mt-1 text-xs text-smoke">/produto/{slug || "…"}</p>
        </div>
      </div>

      <div>
        <label htmlFor="shortDesc" className={labelCls}>Descrição curta (card)</label>
        <input id="shortDesc" name="shortDesc" required maxLength={160} defaultValue={v.shortDesc} className={fieldCls} />
      </div>

      <div>
        <label htmlFor="description" className={labelCls}>Descrição (markdown)</label>
        <textarea id="description" name="description" required rows={4} defaultValue={v.description} className={`${fieldCls} h-auto py-2`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="category" className={labelCls}>Categoria</label>
          <input id="category" name="category" required list="categorias" defaultValue={v.category} className={fieldCls} />
          <datalist id="categorias">
            {["Packs", "Auxílios", "Boneco Lento", "Otimização", "Ferramentas"].map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="platform" className={labelCls}>Plataforma</label>
          <select id="platform" name="platform" defaultValue={v.platform} className={fieldCls}>
            <option value="ANDROID">Android</option>
            <option value="IOS">iPhone / iOS</option>
            <option value="EMULADOR">Emulador</option>
            <option value="MOBILADOR">Mobilador</option>
            <option value="MULTI">Multiplataforma</option>
          </select>
        </div>
        <div>
          <label htmlFor="type" className={labelCls}>Tipo</label>
          <select id="type" name="type" defaultValue={v.type} className={fieldCls}>
            <option value="PACK">Pack</option>
            <option value="TOOL">Ferramenta</option>
          </select>
        </div>
        <div>
          <label htmlFor="sortOrder" className={labelCls}>Ordem</label>
          <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={v.sortOrder} className={fieldCls} />
        </div>
      </div>

      <div>
        <label htmlFor="youtubeUrl" className={labelCls}>Vídeo do YouTube (link)</label>
        <input id="youtubeUrl" name="youtubeUrl" placeholder="https://youtu.be/…" defaultValue={v.youtubeUrl ?? ""} className={fieldCls} />
      </div>

      <div>
        <label htmlFor="tutorialMd" className={labelCls}>Tutorial (markdown)</label>
        <textarea id="tutorialMd" name="tutorialMd" rows={10} defaultValue={v.tutorialMd ?? ""} className={`${fieldCls} h-auto py-2 font-mono text-xs`} />
        <p className="mt-1 text-xs text-smoke">Use ## para títulos, **negrito**, listas com - ou 1. e links [texto](https://…).</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={v.active} className="h-4 w-4 accent-white" />
        Ativo (aparece na vitrine)
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClasses("primary", "md")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {v.id ? "Salvar alterações" : "Criar produto"}
        </button>
        {state?.error && <p role="alert" className="text-sm text-danger">{state.error}</p>}
        {state?.ok && state.message && <p role="status" className="text-sm text-ok">{state.message}</p>}
      </div>
    </form>
  );
}
