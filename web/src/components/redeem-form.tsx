"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, KeyRound, Loader2 } from "lucide-react";
import { Splatter } from "@/components/brand/splatter";
import { buttonClasses } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";

const ALPHABET = /[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/;
const BODY_LEN = 12;

/** Limpa o que foi digitado/colado e devolve só os 12 caracteres da key. */
function toBody(input: string): { body: string; hadInvalid: boolean } {
  let s = input.toUpperCase().replace(/[\s-]/g, "");
  if (s.startsWith("CUPULO")) s = s.slice(6);
  let body = "";
  let hadInvalid = false;
  for (const ch of s) {
    if (ALPHABET.test(ch)) body += ch;
    else hadInvalid = true;
  }
  return { body: body.slice(0, BODY_LEN), hadInvalid };
}

const formatBody = (b: string) => b.match(/.{1,4}/g)?.join("-") ?? "";

type Success = { product: { name: string; slug: string }; duration: string; lifetime: boolean; expiresAt: string | null };

export function RedeemForm() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState(() => toBody(params.get("key") ?? "").body);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<Success | null>(null);

  // Link da DM do bot (/resgatar?key=…): preenche e tira a key da barra de endereço.
  useEffect(() => {
    if (params.get("key")) window.history.replaceState(null, "", "/resgatar");
  }, [params]);

  function onChange(value: string) {
    const r = toBody(value);
    setBody(r.body);
    setError(null);
    setHint(r.hadInvalid ? "A key não usa as letras O e I nem os números 0 e 1." : null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.length !== BODY_LEN || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: `CUPULO-${formatBody(body)}` }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.push("/login?callbackUrl=/resgatar");
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Não foi possível resgatar agora. Tente de novo.");
        return;
      }
      setSuccess(data);
      router.refresh();
    } catch {
      setError("Sem conexão. Verifique sua internet e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setSuccess(null);
    setBody("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="card-grunge relative overflow-hidden px-6 py-10 text-center"
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.12 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Splatter seed={success.product.slug} className="h-[130%] w-[130%] text-white" />
            </motion.div>
            <motion.div
              initial={{ scale: 2.4, rotate: -18, opacity: 0 }}
              animate={{ scale: 1, rotate: -6, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
              className="relative mx-auto inline-block border-4 border-paper px-5 py-1 font-display text-5xl tracking-wider text-paper sm:text-6xl"
            >
              Liberado
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="relative mt-6"
            >
              <p className="font-display text-3xl">{success.product.name}</p>
              <p className="mt-1 text-ash">
                {success.lifetime
                  ? "Acesso vitalício liberado."
                  : `+${success.duration} · acesso até ${success.expiresAt ? formatDateTime(success.expiresAt) : "—"}`}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href={`/produto/${success.product.slug}`} className={buttonClasses("primary", "lg")}>
                  Acessar produto <ArrowRight className="h-5 w-5" />
                </Link>
                <button type="button" onClick={reset} className={buttonClasses("outline", "lg")}>
                  Resgatar outra key
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="card-grunge px-5 py-7 sm:px-8"
          >
            <label htmlFor="key" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-ash">
              <KeyRound className="h-4 w-4" /> Sua key
            </label>
            <div
              className={`mt-3 flex items-center rounded-md border-2 bg-ink px-3 transition focus-within:border-paper sm:px-4 ${
                error ? "border-danger/70" : "border-line-strong"
              }`}
              onClick={() => inputRef.current?.focus()}
            >
              <span className="select-none font-display text-xl text-smoke sm:text-3xl">CUPULO-</span>
              <input
                ref={inputRef}
                id="key"
                name="key"
                value={formatBody(body)}
                onChange={(e) => onChange(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  onChange(e.clipboardData.getData("text"));
                }}
                placeholder="XXXX-XXXX-XXXX"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                enterKeyHint="go"
                aria-invalid={!!error}
                aria-describedby="key-help"
                className="h-16 w-full min-w-0 bg-transparent font-display text-xl tracking-[0.12em] text-paper outline-none placeholder:text-white/15 sm:h-20 sm:text-3xl"
              />
            </div>
            <div id="key-help" className="mt-2 min-h-6 text-sm" aria-live="polite">
              {error ? (
                <p className="flex items-start gap-2 text-danger">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </p>
              ) : hint ? (
                <p className="text-ash">{hint}</p>
              ) : (
                <p className="text-smoke">Cole ou digite a key que você recebeu na DM do Discord.</p>
              )}
            </div>
            <button
              type="submit"
              disabled={body.length !== BODY_LEN || loading}
              className={buttonClasses("primary", "lg", "mt-4 w-full")}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {loading ? "Validando…" : "Resgatar key"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
