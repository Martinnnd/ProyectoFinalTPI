import { applyVote, validContribution } from "./rules";
import { createStore } from "zustand/vanilla";
import { getCurrentRound, RankingError, voteSong, type Round } from "./api";

type State = {
  round: Round | null;
  loading: boolean;
  fresh: boolean;
  busy: boolean;
  error: string;
  message: string;
  loginRequired: boolean;
};
// Each mounted session owns a store. Aborted or superseded reads cannot overwrite newer data.
export function createRankingStore() {
  const store = createStore<State>()(() => ({
    round: null,
    loading: true,
    fresh: false,
    busy: false,
    error: "",
    message: "",
    loginRequired: false,
  }));
  let read: AbortController | undefined;
  let revision = 0;
  const update = (patch: Partial<State>) => store.setState(patch);
  async function refresh(reconcile = false) {
    if (store.getState().busy && !reconcile) return;
    read?.abort();
    const controller = new AbortController();
    read = controller;
    const version = ++revision;
    update({ loading: true, fresh: false, error: "" });
    try {
      const round = await getCurrentRound(controller.signal);
      if (version === revision && !controller.signal.aborted) update({ round, fresh: true });
    } catch (error) {
      if (version !== revision || controller.signal.aborted) return;
      if (error instanceof RankingError && error.status === 404)
        update({ round: null, fresh: true });
      else
        update({
          error: error instanceof Error ? error.message : "No pudimos consultar la ronda.",
        });
    } finally {
      if (version === revision && !controller.signal.aborted) update({ loading: false });
    }
  }
  async function mutate(action: () => Promise<unknown>, success: string) {
    if (store.getState().busy) return false;
    read?.abort();
    ++revision;
    update({ busy: true, loading: false, message: "", loginRequired: false });
    let ok = false;
    try {
      await action();
      ok = true;
      update({ message: success });
    } catch (error) {
      update({
        message:
          error instanceof RankingError
            ? error.message
            : "No pudimos confirmar la operación. Consultá el estado antes de volver a enviarla.",
        loginRequired: error instanceof RankingError && error.status === 401,
      });
    }
    // Reconcile even after uncertain network errors; never repeat a mutation automatically.
    await refresh(true);
    update({ busy: false });
    return ok;
  }
  return {
    ...store,
    getSnapshot: store.getState,
    refresh,
    mutate,
    vote: async (id: number, points: number) => {
      const state = store.getState();
      if (!state.fresh || state.busy || !state.round || !validContribution(points, state.round))
        return false;
      return mutate(
        async () => {
          const result = await voteSong(id, points);
          const round = store.getState().round;
          if (round) update({ round: applyVote(round, id, result) });
        },
        `Sumaste ${points} ${points === 1 ? "punto" : "puntos"} a la canción.`,
      );
    },
    cancelRead: () => {
      ++revision;
      read?.abort();
    },
  };
}
