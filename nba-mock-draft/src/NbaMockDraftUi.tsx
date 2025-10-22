import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type PlayerStats = Record<string, number | string | undefined>;

type Player = {
  pick: number;
  player: string;
  position: string;
  school: string;
  bio?: string;
  stats?: PlayerStats;
};

type DraftTeam = {
  id?: string;
  name?: string;
  logo?: string;
  picks?: Player[];
};

type Team = {
  id: string;
  name: string;
  logo: string;
  picks: Player[];
};

type DraftResponse = {
  teams?: DraftTeam[];
};

const containerVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function NbaMockDraftUi() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [view, setView] = useState<"overview" | "team">("overview");
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadDraft = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/draft.json", { cache: "no-cache" });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data: DraftResponse = await response.json();
      if (!isMountedRef.current) {
        return;
      }

      const normalizedTeams = normalizeTeams(data.teams ?? []);
      setTeams(normalizedTeams);
      setError(null);

      if (normalizedTeams.length === 0) {
        setActiveTeam(null);
        setActivePlayer(null);
        setView("overview");
      }
    } catch (loadError) {
      console.error("Failed to load draft data", loadError);
      if (!isMountedRef.current) {
        return;
      }

      setError("Failed to load draft data. Please try again later.");
      setTeams([]);
      setActiveTeam(null);
      setActivePlayer(null);
      setView("overview");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadDraft();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadDraft]);

  useEffect(() => {
    if (view === "team" && activeTeam) {
      setActivePlayer((previous) => previous ?? activeTeam.picks?.[0] ?? null);
    }
  }, [view, activeTeam]);

  const activeTeamIndex = useMemo(() => {
    if (!activeTeam) {
      return -1;
    }

    return teams.findIndex((team) => team.id === activeTeam.id);
  }, [activeTeam, teams]);

  const moveToTeam = useCallback(
    (nextIndex: number) => {
      const nextTeam = teams[nextIndex];
      if (!nextTeam) {
        return;
      }

      setActiveTeam(nextTeam);
      setActivePlayer(nextTeam.picks?.[0] ?? null);
    },
    [teams],
  );

  const canGoPrevious = activeTeamIndex > 0;
  const canGoNext = activeTeamIndex >= 0 && activeTeamIndex < teams.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">NBA Mock Draft 2026</h1>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Tap a team bubble to explore their selections and player insights.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {view === "overview" && (
            <motion.section
              key="overview"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {teams.length === 0 ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                  <span className="text-sm font-medium">
                    {isLoading ? "Loading draft data..." : "No teams available right now."}
                  </span>
                  {!isLoading && error ? (
                    <>
                      <span className="text-xs font-medium text-red-400">{error}</span>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={loadDraft}
                        className="inline-flex items-center gap-2 rounded-full border border-sky-500/50 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-300 transition hover:border-sky-400 hover:text-sky-200"
                      >
                        Retry
                      </motion.button>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 min-[480px]:gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                  {teams.map((team) => (
                    <TeamBubble
                      key={team.id}
                      team={team}
                      topPick={team.picks[0]?.pick}
                      onSelect={() => {
                        setActiveTeam(team);
                        setActivePlayer(team.picks?.[0] ?? null);
                        setView("team");
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {view === "team" && activeTeam && (
            <motion.section
              key="team"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col gap-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setView("overview");
                    setActivePlayer(null);
                    setActiveTeam(null);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300"
                >
                  <span aria-hidden>←</span>
                  Back to Teams
                </motion.button>

                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3 rounded-full bg-slate-900/70 px-4 py-2">
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-800 bg-slate-800">
                      {activeTeam.logo ? (
                        <img
                          src={activeTeam.logo}
                          alt={activeTeam.name}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-300">
                          {activeTeam.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Team</p>
                      <p className="text-lg font-semibold text-slate-100">{activeTeam.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => moveToTeam(activeTeamIndex - 1)}
                      disabled={!canGoPrevious}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                      aria-label="View previous team"
                    >
                      <span aria-hidden>←</span>
                      Prev
                    </motion.button>
                    <span className="text-xs font-medium text-slate-500">
                      {activeTeamIndex + 1} / {teams.length}
                    </span>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => moveToTeam(activeTeamIndex + 1)}
                      disabled={!canGoNext}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-600"
                      aria-label="View next team"
                    >
                      Next
                      <span aria-hidden>→</span>
                    </motion.button>
                  </div>
                </div>
              </div>

              <motion.div
                layout
                className="flex flex-col gap-6 md:flex-row"
                transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
              >
                <motion.div
                  layout
                  className="md:w-1/2 lg:w-2/5"
                  transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
                >
                  <h2 className="text-lg font-semibold text-slate-200">Draft Picks</h2>
                  <div className="mt-3 flex flex-col gap-3">
                    {activeTeam.picks.map((pick) => {
                      const isActive = activePlayer?.pick === pick.pick;
                      return (
                        <motion.button
                          key={pick.pick}
                          layout
                          type="button"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setActivePlayer(pick)}
                          className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors ${
                            isActive
                              ? "border-sky-400/80 bg-sky-950/60"
                              : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between text-sm font-semibold text-slate-200">
                            <span>{pick.player}</span>
                            <span className="text-slate-400">#{pick.pick}</span>
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">
                            {pick.position} • {pick.school}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div
                  layout
                  className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                  transition={{ layout: { duration: 0.25, ease: "easeOut" } }}
                >
                  <AnimatePresence mode="wait">
                    {activePlayer ? (
                      <motion.div
                        key={activePlayer.pick}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="flex flex-col gap-4"
                      >
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-400">Pick #{activePlayer.pick}</p>
                          <h3 className="text-2xl font-bold text-slate-100">{activePlayer.player}</h3>
                          <p className="text-sm text-slate-400">
                            {activePlayer.position} • {activePlayer.school}
                          </p>
                        </div>

                        {activePlayer.bio ? (
                          <p className="rounded-lg bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-300">
                            {activePlayer.bio}
                          </p>
                        ) : null}

                        <div>
                          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                            Stats Snapshot
                          </h4>
                          <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                            {renderStatChip("PPG", activePlayer.stats)}
                            {renderStatChip("RPG", activePlayer.stats)}
                            {renderStatChip("APG", activePlayer.stats)}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-400"
                      >
                        <span className="text-2xl" aria-hidden>
                          👆
                        </span>
                        Select a player to view their profile.
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type TeamBubbleProps = {
  team: Team;
  topPick: number | undefined;
  onSelect: () => void;
};

function TeamBubble({ team, topPick, onSelect }: TeamBubbleProps) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group relative flex flex-col items-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-2.5 shadow-lg transition-colors hover:border-slate-700 hover:bg-slate-900 min-[360px]:gap-1.5 min-[480px]:p-3 min-[480px]:gap-2 sm:gap-3 sm:p-4"
      aria-label={`View draft picks for ${team.name}`}
    >
      <div className="relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-800 bg-slate-950 shadow-inner min-[360px]:h-14 min-[360px]:w-14 min-[480px]:h-16 min-[480px]:w-16 sm:h-20 sm:w-20">
          {team.logo ? (
            <img
              src={team.logo}
              alt={team.name}
              loading="lazy"
              className="h-8 w-8 object-contain min-[360px]:h-10 min-[360px]:w-10 min-[480px]:h-12 min-[480px]:w-12 sm:h-16 sm:w-16"
            />
          ) : (
            <span className="text-lg font-semibold text-slate-300">{team.name.charAt(0)}</span>
          )}
        </div>
        {typeof topPick === "number" && (
          <span className="absolute -top-2 -right-2 inline-flex items-center rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-slate-950 shadow">
            #{topPick}
          </span>
        )}
      </div>
      <span className="text-center text-sm font-medium text-slate-200 group-hover:text-white">{team.name}</span>
    </motion.button>
  );
}

function renderStatChip(label: string, stats?: PlayerStats) {
  const value = resolveStatValue(stats, label);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">{value ?? "--"}</p>
    </div>
  );
}

function resolveStatValue(stats: PlayerStats | undefined, key: string) {
  if (!stats) {
    return undefined;
  }

  if (stats[key] !== undefined) {
    return stats[key];
  }

  const lowerKey = key.toLowerCase();
  if (stats[lowerKey] !== undefined) {
    return stats[lowerKey];
  }

  const upperKey = key.toUpperCase();
  if (stats[upperKey] !== undefined) {
    return stats[upperKey];
  }

  return undefined;
}

function normalizeTeams(rawTeams: DraftTeam[]): Team[] {
  return rawTeams.map((team, index) => {
    const picks = [...(team.picks ?? [])].sort((first, second) => first.pick - second.pick);

    return {
      id: createTeamId(team, index),
      name: team.name ?? `Team ${index + 1}`,
      logo: team.logo ?? "",
      picks,
    };
  });
}

function createTeamId(team: DraftTeam, index: number) {
  if (team.id && team.id.trim().length > 0) {
    return team.id;
  }

  if (team.name && team.name.trim().length > 0) {
    const slug = team.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    return slug.length > 0 ? `${slug}-${index}` : `team-${index}`;
  }

  return `team-${index}`;
}
