import React, { useEffect, useState, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import CloudField from "@/components/scene/CloudField";
import WaterCanvas from "@/components/scene/WaterCanvas";
import LightRays from "@/components/scene/LightRays";
import HomePage from "@/components/home/HomePage";
import { SCENE } from "@/constants/testIds";

const TEMPLE_IMAGE =
  "https://customer-assets-agu9un31.emergentagent.net/job_dee84a8a-9917-441c-bb9e-2a1c64e1b2fd/artifacts/z6loqifr_Screenshot%202026-07-20%20at%206.17.31%E2%80%AFPM.webp";

/**
 * Cinematic sequence:
 *  A (0-2.4s) — viewer inside dense clouds, world blurred + scaled.
 *  B (2.4-6s) — clouds part, camera glides forward across the water.
 *  C (6-8.2s) — accelerated zoom INTO the temple doorway (transform-origin
 *               fixed on the door). Door glow intensifies.
 *  D (8.2-9.4s) — bright yellow-white light bursts from the door, fills
 *                 the entire screen.
 *  E (9.4s+) — the flash dissolves and the actual website (Landing) is
 *              revealed underneath. Cinematic scene is unmounted.
 */
export default function TempleExperience() {
  const [phase, setPhase] = useState("intro"); // intro | flashing | done
  const isSkipped = useRef(false);
  const world = useAnimation();
  const cloudsIn = useAnimation();
  const cloudsOut = useAnimation();
  const water = useAnimation();
  const doorGlow = useAnimation();
  const flash = useAnimation();

  const runSequence = async () => {
    // A → B: clouds part, world unblurs
    await Promise.all([
      cloudsIn.start({
        opacity: 0,
        scale: 1.4,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      }),
      world.start({
        scale: 1.02,
        y: 0,
        filter: "blur(0px) saturate(1) brightness(1)",
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      }),
      cloudsOut.start({
        opacity: 0.7,
        transition: { duration: 0.5, ease: "easeOut" },
      }),
      water.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      }),
    ]);

    // B → C: dolly forward across the water
    await world.start({
      scale: 1.35,
      transition: { duration: 0.8, ease: [0.4, 0, 0.4, 1] },
    });

    // C → D: accelerate ZOOM INTO the doorway.
    // transform-origin is (50%, 42%) — that is the position of the door
    // within the world container.
    await Promise.all([
      world.start({
        scale: 3.5,
        transition: { duration: 0.5, ease: [0.55, 0, 0.75, 0.2] },
      }),
      doorGlow.start({
        opacity: 1,
        scale: 2.5,
        transition: { duration: 0.4, ease: "easeIn" },
      }),
    ]);

    // D: yellow-white light burst fills screen
    if (isSkipped.current) return;
    setPhase("flashing");
    await flash.start({
      opacity: 1,
      scale: 20,
      transition: { duration: 0.25, ease: [0.55, 0, 0.55, 1] },
    });
    // Hold peak-white for a moment
    if (isSkipped.current) return;
    await new Promise((r) => setTimeout(r, 100));

    // E: reveal the website
    if (isSkipped.current) return;
    setPhase("done");
  };

  useEffect(() => {
    world.set({ scale: 1.35, y: 20, filter: "blur(14px) saturate(0.9) brightness(1.15)" });
    cloudsIn.set({ opacity: 1, scale: 1 });
    cloudsOut.set({ opacity: 0.35 });
    water.set({ opacity: 0, y: 30 });
    doorGlow.set({ opacity: 0.55, scale: 0.7 });
    flash.set({ opacity: 0, scale: 0.1 });
    runSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    isSkipped.current = true;
    world.stop();
    doorGlow.stop();
    flash.stop();
    cloudsIn.stop();
    water.stop();
    setPhase("done");
  };

  return (
    <>
      <AnimatePresence>
        {phase !== "done" && (
          <motion.div
            key="scene"
            data-testid={SCENE.container}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-50 overflow-hidden scene-cursor grain"
            style={{
              background:
                "radial-gradient(ellipse at 50% 20%, #f6e6c4 0%, #e6cfa0 20%, #a89370 55%, #4a3c2a 90%)",
            }}
          >
            {/* WORLD — the temple image + reflection + rays.
                transform-origin is anchored on the temple doorway. */}
            <motion.div
              animate={world}
              className="absolute inset-0 will-change-transform"
              style={{ transformOrigin: "50% 42%" }}
            >
              <LightRays />
              <CloudField variant="back" />

              <div className="absolute inset-x-0 top-0 h-[62%]">
                <img
                  src={TEMPLE_IMAGE}
                  alt="South Indian temple gopuram amidst clouds and mountains"
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: "50% 30%",
                    filter: "saturate(1.05) contrast(1.05)",
                  }}
                  draggable={false}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 55%, rgba(255,230,180,0.18), rgba(255,230,180,0) 55%), linear-gradient(to bottom, rgba(255,240,210,0.05), rgba(10,8,6,0) 40%)",
                  }}
                />
                {/* Door glow — grows as we approach */}
                <motion.div
                  animate={doorGlow}
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{
                    bottom: "8%",
                    width: "80px",
                    height: "160px",
                    background:
                      "radial-gradient(ellipse at center, rgba(255,225,150,0.95), rgba(255,190,90,0.5) 40%, rgba(255,190,90,0) 70%)",
                    animation: "doorGlow 3.2s ease-in-out infinite",
                  }}
                />
              </div>

              <motion.div
                animate={water}
                className="absolute inset-x-0 bottom-0 h-[38%] will-change-transform"
              >
                <WaterCanvas imageUrl={TEMPLE_IMAGE} className="w-full h-full" intensity={1} />
                <div
                  className="absolute inset-x-0 top-0 h-16 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, rgba(255,240,210,0.55), rgba(255,240,210,0))",
                    filter: "blur(6px)",
                  }}
                />
              </motion.div>

              <div className="absolute inset-0 pointer-events-none">
                <CloudField variant="mid" />
              </div>
            </motion.div>

            {/* Foreground clouds */}
            <motion.div animate={cloudsOut} className="absolute inset-0 pointer-events-none">
              <CloudField variant="front" />
            </motion.div>

            {/* Volumetric "inside a cloud" veil */}
            <motion.div
              animate={cloudsIn}
              className="absolute inset-0 pointer-events-none will-change-transform"
              style={{
                background:
                  "radial-gradient(circle at 50% 55%, rgba(255,250,235,0.35) 0%, rgba(255,245,225,0.75) 30%, rgba(255,240,215,0.95) 60%, #fff8e8 100%)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'><filter id='c'><feTurbulence type='fractalNoise' baseFrequency='0.008' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 0.96  0 0 0 0 0.88  0 0 0 1.2 -0.1'/></filter><rect width='100%25' height='100%25' filter='url(%23c)'/></svg>\")",
                  backgroundSize: "cover",
                  opacity: 0.85,
                  mixBlendMode: "screen",
                }}
              />
            </motion.div>

            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
              }}
            />

            {/* Yellow-white LIGHT BURST from the doorway.
                Origin: center-42%, same as world transform-origin. */}
            <motion.div
              animate={flash}
              className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-transform"
              style={{
                width: 260,
                height: 260,
                borderRadius: "9999px",
                background:
                  "radial-gradient(circle, #ffffff 0%, #fff4c8 12%, #ffd97a 32%, #f4a022 55%, rgba(244,160,34,0) 78%)",
                filter: "blur(2px)",
                boxShadow:
                  "0 0 120px 40px rgba(255,220,140,0.85), 0 0 320px 120px rgba(255,190,80,0.55)",
              }}
            />

            {/* Skip button */}
            {phase === "intro" && (
              <motion.button
                data-testid={SCENE.skipBtn}
                onClick={skip}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="absolute top-6 right-6 z-50 rounded-full border border-[#f4c988]/40 px-5 py-2.5 backdrop-blur-md bg-black/25 hover:bg-black/40 transition-colors font-display text-[10px] tracking-[0.35em] text-[#f5ecd6] hover:text-[#f4c988]"
              >
                SKIP INTRO
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The revealed WEBSITE */}
      {phase === "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 z-50 bg-[#FAF6EE] overflow-auto"
        >
          <HomePage />
        </motion.div>
      )}
    </>
  );
}
