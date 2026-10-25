import { type FormEvent, startTransition } from "react";

/**
 * O React 19 limpa o <form action> depois de toda action, até quando dá erro.
 * Use em onSubmit para chamar a action sem perder o que foi digitado.
 */
export function submitWithoutReset(action: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
