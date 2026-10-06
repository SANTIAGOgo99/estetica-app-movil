import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { apiRequest } from "./client";
export function useRemote<T>(
  path: string | null,
  token: string | null,
  decode: (value: unknown) => T,
) {
  const [result, setResult] = useState<{
    path: string;
    token: string | null;
    revision: number;
    data: T | null;
    error: string | null;
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  useFocusEffect(useCallback(() => {
    if (!path) return;
    const controller = new AbortController();
    let active = true;
    void apiRequest(path, { token, signal: controller.signal })
      .then((value) => {
        const data = decode(value);
        if (active) setResult({ path, token, revision, data, error: null });
      })
      .catch((value) => {
        if (active)
          setResult({
            path,
            token,
            revision,
            data: null,
            error:
              value instanceof Error
                ? value.message
                : "No se pudo cargar la información.",
          });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [path, token, decode, revision]));
  const current =
    !!path &&
    result?.path === path &&
    result.token === token &&
    result.revision === revision;
  return {
    data: current ? result.data : null,
    loading: !!path && !current,
    error: current ? result.error : null,
    refresh,
  };
}
