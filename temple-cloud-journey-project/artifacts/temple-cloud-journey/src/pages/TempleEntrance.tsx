import { motion } from 'framer-motion';
import React from 'react';

/**
 * TempleEntrancePage
 * -----------------
 * This page displays a short motion animation representing the temple entrance
 * and, once the animation completes, shows an embedded India map.
 *
 * The animation uses `framer-motion` to fade‑in a placeholder temple image.
 * After the fade‑in (duration 3s) the map iframe becomes visible.
 */
export default function TempleEntrancePage() {
  const [showMap, setShowMap] = React.useState(false);

  // When the entrance animation ends, reveal the map.
  const handleAnimationComplete = () => setShowMap(true);

  return (
    <main className="temple-entrance-page" style={{ textAlign: "center", padding: "2rem" }}>
      {/* Motion section – temple entrance */}
      <motion.img
        src="/temple-cloud-reference.jpg" // existing image in public folder
        alt="Temple entrance"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 3 }}
        onAnimationComplete={handleAnimationComplete}
        style={{ width: "80%", maxWidth: "600px", borderRadius: "8px" }}
      />

      {/* Map section – appears after animation */}
      {showMap && (
        <div style={{ marginTop: "2rem" }}>
          <h2>India Map</h2>
          {/* Simple Google Maps embed centered on India */}
          <iframe
            title="India map"
            src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d14631768.932226842!2d78.962879!3d21.767942!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1690000000000!5m2!1sen!2sin"
            width="600"
            height="450"
            style={{ border: 0, borderRadius: "8px" }}
            allowFullScreen={false}
            loading="lazy"
          />
        </div>
      )}
    </main>
  );
}
