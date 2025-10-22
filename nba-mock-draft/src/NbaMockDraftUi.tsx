import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Player = {
  pick: number;
  player: string;
  position: string;
  school: string;
  bio?: string;
  stats?: {
    ppg?: number | string;
    rpg?: number | string;
    apg?: number | string;
    [key: string]: number | string | undefined;
  };
};

type Team = {
  id: string;
  name: string;
  logo: string;
  picks: Player[];
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

  useEffect(() => {
    let isMounted = true;

    fetch("/draft.json", { cache: "no-cache" })
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) return;
        const fetchedTeams: Team[] = data?.teams ?? [];
        setTeams(fetchedTeams);
      })
      .catch((error) => {
        console.error("Failed to load draft data", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (view === "team" && activeTeam) {
      setActivePlayer((prev) => prev ?? activeTeam.picks?.[0] ?? null);
    }
  }, [view, activeTeam]);

  const topPickMap = useMemo(() => {
    const map = new Map<string, number | undefined>();
    teams.forEach((team) => {
      map.set(team.id, team.picks?.[0]?.pick);
    });
    return map;
  }, [teams]);

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
              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {teams.map((team) => (
                  <TeamBubble
                    key={team.id}
                    team={team}
                    topPick={topPickMap.get(team.id)}
                    onSelect={() => {
                      setActiveTeam(team);
                      setActivePlayer(team.picks?.[0] ?? null);
                      setView("team");
                    }}
                  />
                ))}
              </div>
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
              <div className="flex items-center justify-between gap-4">
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

                <div className="flex items-center gap-3 rounded-full bg-slate-900/70 px-4 py-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-800">
                    <img
                      src={activeTeam.logo}
                      alt={activeTeam.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Team</p>
                    <p className="text-lg font-semibold text-slate-100">{activeTeam.name}</p>
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
                        <h3 className="text-2xl font-bold text-slate-100">
                          {activePlayer.player}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {activePlayer.position} • {activePlayer.school}
                        </p>
                      </div>

                      {activePlayer.bio && (
                        <p className="rounded-lg bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-300">
                          {activePlayer.bio}
                        </p>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                          Stats Snapshot
                        </h4>
                        <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                          {renderStatChip("PPG", activePlayer.stats?.ppg)}
                          {renderStatChip("RPG", activePlayer.stats?.rpg)}
                          {renderStatChip("APG", activePlayer.stats?.apg)}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
                      <span className="text-2xl">👆</span>
                      Select a player to view their profile.
                    </div>
                  )}
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
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="group relative flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg transition-colors hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-800 bg-slate-950 shadow-inner">
          <img src={team.logo} alt={team.name} className="h-16 w-16 object-contain" />
        </div>
        {typeof topPick === "number" && (
          <span className="absolute -top-2 -right-2 inline-flex items-center rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-slate-950 shadow">
            #{topPick}
          </span>
        )}
      </div>
      <span className="text-center text-sm font-medium text-slate-200 group-hover:text-white">
        {team.name}
      </span>
    </motion.button>
  );
}

function renderStatChip(label: string, value?: number | string) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-100">
        {value ?? "--"}
      </p>
    </div>
  );
}
