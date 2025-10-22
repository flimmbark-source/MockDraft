import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function App() {
  const [view, setView] = useState("overview");
  const [teams, setTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [activePlayer, setActivePlayer] = useState(null);

  // Fetch data dynamically from draft.json
  useEffect(() => {
    fetch("/draft.json", { cache: "no-cache" })
      .then((res) => res.json())
      .then((data) => setTeams(data.teams || []))
      .catch((err) => console.error("Failed to load draft data", err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">NBA Mock Draft 2026</h1>

      <AnimatePresence mode="wait">
        {view === "overview" && teams.length > 0 && (
          <TeamGrid
            teams={teams}
            onSelect={(team) => {
              setActiveTeam(team);
              setActivePlayer(team.picks[0]);
              setView("team");
            }}
          />
        )}

        {view === "team" && activeTeam && (
          <TeamDraftView
            team={activeTeam}
            activePlayer={activePlayer}
            onBack={() => setView("overview")}
            onPlayerSelect={setActivePlayer}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// -------------- TEAM GRID ----------------
function TeamGrid({ teams, onSelect }) {
  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {teams.map((team) => (
        <motion.div
          key={team.id}
          whileHover={{ scale: 1.05 }}
          className="relative cursor-pointer flex flex-col items-center"
          onClick={() => onSelect(team)}
        >
          <div className="relative w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600 shadow-lg">
            <img src={team.logo} alt={team.name} className="w-16 h-16 object-contain" />
            <div className="absolute top-1 right-1 bg-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
              #{team.picks[0]?.pick}
            </div>
          </div>
          <span className="mt-2 text-sm text-center">{team.name}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

// -------------- TEAM DRAFT VIEW ----------------
function TeamDraftView({ team, activePlayer, onBack, onPlayerSelect }) {
  return (
    <motion.div
      className="w-full flex flex-col md:flex-row gap-6"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <button onClick={onBack} className="mb-4 text-sm text-blue-400">← Back to Teams</button>

      <div className="flex w-full md:flex-row flex-col gap-6">
        {/* Left column - picks list */}
        <div className="w-full md:w-1/3 bg-gray-900 p-4 rounded-lg h-fit">
          <h2 className="text-2xl font-semibold mb-4">{team.name} Picks</h2>
          <div className="flex flex-col gap-3">
            {team.picks.map((p) => (
              <div
                key={p.pick}
                className={`p-4 rounded-lg cursor-pointer border ${
                  activePlayer?.pick === p.pick
                    ? "bg-blue-700 border-blue-500"
                    : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                }`}
                onClick={() => onPlayerSelect(p)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">{p.player}</span>
                  <span className="text-sm text-gray-400">#{p.pick}</span>
                </div>
                <div className="text-sm text-gray-400">{p.position} • {p.school}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column - player detail */}
        <div className="flex-1 bg-gray-800 p-6 rounded-lg">
          {activePlayer ? (
            <div>
              <h2 className="text-3xl font-bold mb-2">{activePlayer.player}</h2>
              <p className="text-gray-400 mb-2">Pick #{activePlayer.pick} • {activePlayer.position} • {activePlayer.school}</p>
              {activePlayer.bio && (
                <p className="text-sm text-gray-300 mb-2">{activePlayer.bio}</p>
              )}
              {activePlayer.stats && (
                <ul className="text-sm text-gray-400 list-disc list-inside">
                  {Object.entries(activePlayer.stats).map(([key, val]) => (
                    <li key={key}>{key}: {val}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Select a player to view details.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
