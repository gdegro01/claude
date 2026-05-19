"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CountdownRing } from "@/components/motion/CountdownRing";
import { SpinMark } from "@/components/brand/SpinMark";

type Stage = "intro" | "notification" | "claim" | "confirmed";

export default function WaitlistClaimDemo() {
  const [stage, setStage] = useState<Stage>("intro");

  useEffect(() => {
    if (stage !== "intro") return;
    const t1 = setTimeout(() => setStage("notification"), 1200);
    return () => clearTimeout(t1);
  }, [stage]);

  useEffect(() => {
    if (stage !== "notification") return;
    const t = setTimeout(() => setStage("claim"), 2400);
    return () => clearTimeout(t);
  }, [stage]);

  function restart() {
    setStage("intro");
  }

  return (
    <main className="relative min-h-[100dvh] spin-vignette spin-grain flex flex-col items-center justify-center px-6 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 px-6 pt-5 flex items-center justify-between z-10">
        <span className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)]">
          Demo — Waitlist claim
        </span>
        <button
          type="button"
          onClick={restart}
          className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)] hover:text-[var(--color-main-light)]"
        >
          ↻ herstart
        </button>
      </div>

      <AnimatePresence mode="wait">
        {stage === "intro" && <IntroStage key="intro" />}

        {stage === "notification" && (
          <NotificationStage key="notif" onTap={() => setStage("claim")} />
        )}

        {stage === "claim" && (
          <ClaimStage key="claim" onClaim={() => setStage("confirmed")} />
        )}

        {stage === "confirmed" && <ConfirmedStage key="confirmed" />}
      </AnimatePresence>

      <StageIndicator stage={stage} />
    </main>
  );
}

function IntroStage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-md"
    >
      <SpinMark size="lg" className="mb-7" />
      <h1 className="text-[2.4rem] leading-[1] mb-5">
        Er komt zo een
        <br />
        <span className="spin-em text-[var(--color-accent-purple)]">
          tafel vrij.
        </span>
      </h1>
      <p className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-neutral)] tracking-wide">
        Wacht op de notificatie…
      </p>
    </motion.div>
  );
}

function NotificationStage({ onTap }: { onTap: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-sm"
    >
      <motion.button
        type="button"
        onClick={onTap}
        initial={{ y: -120, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 360,
          damping: 32,
          mass: 0.9,
        }}
        whileTap={{ scale: 0.98 }}
        className="w-full text-left bg-[var(--color-main-light)] text-[var(--color-main-dark)] rounded-2xl px-4 py-3.5 shadow-2xl flex items-start gap-3"
      >
        <div className="w-9 h-9 rounded-md bg-[var(--color-main-dark)] grid place-items-center shrink-0">
          <span className="font-[family-name:var(--font-display)] font-bold text-[var(--color-main-light)] text-[12px] leading-none">
            S.
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="flex items-center justify-between gap-2 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-dark)]/70">
            <span>SPIN. · NU</span>
            <span className="text-[var(--color-accent-orange)]">CLAIM</span>
          </p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-[15px] leading-tight">
            Een tafel is vrijgekomen
          </p>
          <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-supporting-dark)]/85">
            Pool · 4 pers · vrijdag 23 mei · 19:00 — claim binnen 5m
          </p>
        </div>
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mt-5 text-center font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-supporting-neutral)]"
      >
        Tap om te openen
      </motion.p>
    </motion.div>
  );
}

function ClaimStage({ onClaim }: { onClaim: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="text-center w-full max-w-sm"
    >
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.22em] uppercase text-[var(--color-accent-orange)] mb-5"
      >
        Plek beschikbaar
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="text-[2.1rem] leading-[1.02]"
      >
        Er is een tafel
        <br />
        <span className="spin-em text-[var(--color-accent-purple)]">
          vrijgekomen.
        </span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="mt-10 flex justify-center"
      >
        <CountdownRing totalSeconds={300} warnAt={60} size={210} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="mt-10 grid grid-cols-3 gap-3 text-left max-w-xs mx-auto"
      >
        {[
          { l: "Tafel", v: "Pool P3" },
          { l: "Personen", v: "4" },
          { l: "Wanneer", v: "Vr · 19:00" },
        ].map((it) => (
          <div key={it.l}>
            <p className="font-[family-name:var(--font-mono)] text-[9px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)]">
              {it.l}
            </p>
            <p className="font-[family-name:var(--font-display)] text-[15px] mt-1">
              {it.v}
            </p>
          </div>
        ))}
      </motion.div>

      <motion.button
        type="button"
        onClick={onClaim}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        whileTap={{ scale: 0.98 }}
        className="mt-10 w-full py-4 bg-[var(--color-accent-orange)] text-[var(--color-main-light)] font-[family-name:var(--font-mono)] text-[13px] tracking-[0.2em] uppercase hover:bg-[var(--color-supporting-dark)] transition-colors"
      >
        Claim deze tafel
      </motion.button>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        className="mt-3 font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)]"
      >
        of laat de plek doorgaan naar #2
      </motion.p>
    </motion.div>
  );
}

function ConfirmedStage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center w-full max-w-sm"
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.7 }}
        className="mx-auto w-20 h-20 rounded-full bg-[var(--color-accent-purple)] grid place-items-center mb-7"
      >
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <motion.path
            d="M6 16l6 6L24 8"
            stroke="var(--color-main-light)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-[2.1rem] leading-[1.02]"
      >
        Geclaimd.
        <br />
        <span className="spin-em text-[var(--color-accent-purple)]">
          tot vrijdag.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="mt-6 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-supporting-neutral)] tracking-wide"
      >
        Referentie · SP-2405-0042
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-9 p-5 border border-[var(--color-supporting-neutral)]/30 text-left"
      >
        <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] uppercase text-[var(--color-supporting-neutral)] mb-2">
          Dashboard host · live
        </p>
        <ul className="space-y-2">
          {[
            { n: "#1", l: "Van Dam", s: "Geclaimd", color: "var(--color-accent-purple)" },
            { n: "#2", l: "Hofman", s: "Wacht", color: "var(--color-supporting-neutral)" },
            { n: "#3", l: "Koster", s: "Wacht", color: "var(--color-supporting-neutral)" },
          ].map((row, i) => (
            <motion.li
              key={row.n}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.85 + i * 0.1, duration: 0.4 }}
              className="flex items-center justify-between font-[family-name:var(--font-mono)] text-[12px]"
            >
              <span className="flex items-center gap-3">
                <span className="text-[var(--color-supporting-neutral)] spin-tnum">
                  {row.n}
                </span>
                <span className="text-[var(--color-main-light)]">{row.l}</span>
              </span>
              <span style={{ color: row.color }}>{row.s}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

function StageIndicator({ stage }: { stage: Stage }) {
  const stages: Stage[] = ["intro", "notification", "claim", "confirmed"];
  const idx = stages.indexOf(stage);
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
      {stages.map((s, i) => (
        <span
          key={s}
          className={[
            "w-2 h-2 rounded-full transition-colors duration-300",
            i === idx
              ? "bg-[var(--color-accent-purple)]"
              : i < idx
              ? "bg-[var(--color-supporting-neutral)]"
              : "bg-[var(--color-supporting-neutral)]/30",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
