import { useRemote } from "../api/useRemote";
import { decodeCatalog } from "./model";
export function useCatalog(kind: "services" | "products") {
  const resource = useRemote("/" + kind + "/active", null, decodeCatalog);
  return {
    items: resource.data ?? [],
    loading: resource.loading,
    error: resource.error,
    retry: resource.refresh,
  };
}
