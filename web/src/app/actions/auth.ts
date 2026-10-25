"use server";

import { signIn, signOut } from "@/auth";
import { devLoginEnabled } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function signInWithDiscord(formData: FormData) {
  await signIn("discord", { redirectTo: safeRedirectPath(formData.get("callbackUrl")) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function devSignIn(formData: FormData) {
  if (!devLoginEnabled()) return;
  await signIn("dev-login", {
    discordId: String(formData.get("discordId") ?? ""),
    name: String(formData.get("name") ?? ""),
    redirectTo: safeRedirectPath(formData.get("callbackUrl")),
  });
}
