import { useQuery } from "@tanstack/react-query";
import type { SleepSession, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";

export function useUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useMySessions() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<SleepSession[]>({
    queryKey: ["mySessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMySessions();
    },
    enabled: !!actor && !actorFetching,
  });
}
