import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useMutation as useRemoteMutation, useQuery as useRemoteQuery } from "convex/react";
import { getFunctionName, type FunctionArgs, type FunctionReference, type FunctionReturnType } from "convex/server";
import { useTypeAppSession as useHostSession } from "./typeAuth";
import { executeLocal, parseSnapshot, STORAGE_KEY } from "../shared/localStore";

// Fixed at page load. Remote mode requires a real authenticated host session.
export const TYPE_MODE = Boolean(window.type?.appBackend?.url && window.type?.appBackend?.resolveSession);
const listeners = new Set<() => void>();
let revision = 0;
const notify = () => { revision++; listeners.forEach(f => f()); };
window.addEventListener("storage", e => { if (e.key === STORAGE_KEY) notify(); });
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
let queue: Promise<unknown> = Promise.resolve();

export function useQuery<Q extends FunctionReference<"query">>(query: Q, args?: FunctionArgs<Q> | "skip"): FunctionReturnType<Q> | undefined {
  if (TYPE_MODE) return useRemoteQuery(query, args as FunctionArgs<Q>);
  const rev = useSyncExternalStore(subscribe, () => revision);
  const key = JSON.stringify(args ?? {});
  const name = getFunctionName(query).split(":")[1];
  const cacheKey = `${name}:${key}`;
  const [result, setResult] = useState<{ key: string; value: FunctionReturnType<Q> }>();
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let active = true;
    setError(null);
    if (key === '"skip"') return;
    Promise.resolve().then(() => executeLocal(parseSnapshot(localStorage.getItem(STORAGE_KEY)), name, JSON.parse(key), false))
      .then(v => { if (active) setResult({ key: `${name}:${key}`, value: v as FunctionReturnType<Q> }); }, e => { if (active) setError(e); });
    return () => { active = false; };
  }, [key, name, rev]);
  if (error) throw error;
  return result?.key === cacheKey ? result.value : undefined;
}
export function useMutation<M extends FunctionReference<"mutation">>(mutation: M): (args: FunctionArgs<M>) => Promise<FunctionReturnType<M>> {
  if (TYPE_MODE) return useRemoteMutation(mutation);
  const name = getFunctionName(mutation).split(":")[1];
  return useCallback((args: FunctionArgs<M>) => {
    const transact = async () => {
      const snapshot = parseSnapshot(localStorage.getItem(STORAGE_KEY));
      const result = await executeLocal(snapshot, name, args, true);
      // Commit after complete domain validation; storage/quota failure rejects the mutation.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      notify();
      return result as FunctionReturnType<M>;
    };
    const locked = () => navigator.locks ? navigator.locks.request(STORAGE_KEY, transact) : transact();
    const next = queue.then(locked, locked);
    queue = next.catch(() => undefined);
    return next;
  }, [name]);
}
export function useTypeAppSession() {
  const host = useHostSession();
  return TYPE_MODE ? host : { status: "local" as const, capabilities: { read: true, write: true } };
}
