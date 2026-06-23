export function getGamificationViewModel({
  online,
  active,
  globalScore,
  projectScore,
  cycle,
  cycleSeconds
}) {
  const remaining = Math.max(0, cycleSeconds - cycle.activeSeconds);
  const progress = Math.min(1, cycle.activeSeconds / cycleSeconds);
  const signature = [
    online,
    active,
    globalScore,
    projectScore,
    cycle.points,
    cycle.activeSeconds,
    cycle.breakdown.click,
    cycle.breakdown.reaction,
    cycle.breakdown.reply,
    cycle.breakdown.comment,
    cycle.breakdown.linkPreview,
    cycle.breakdown.linkOpen,
    cycle.breakdown.linkCopy,
    cycle.breakdown.linkEmbed
  ].join("|");
  return {
    active,
    globalScore,
    online,
    projectScore,
    progress,
    remaining,
    signature
  };
}

export function renderGamificationCard({
  online,
  active,
  cycle,
  cycleSeconds,
  globalScore,
  projectScore,
  progress,
  remaining
}) {
  return online ? `
    <div class="heart-hero">
      <div class="heart-reactor" aria-hidden="true" style="--progress:${progress}; --beat:0;">
        <span class="heart-aura"></span>
        <span class="heart-orbit orbit-a"></span>
        <span class="heart-orbit orbit-b"></span>
        <svg class="heart-core" viewBox="0 0 160 160" role="img" aria-label="">
          <defs>
            <linearGradient id="heart-core-gradient" x1="20%" y1="0%" x2="84%" y2="100%">
              <stop offset="0%" stop-color="#ff9ec8"></stop>
              <stop offset="48%" stop-color="#ff3f87"></stop>
              <stop offset="100%" stop-color="#b3165f"></stop>
            </linearGradient>
            <filter id="heart-core-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur>
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.95 0 0.1 0 0 0.18 0 0 1 0 0.62 0 0 0 0.78 0"></feColorMatrix>
              <feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
            </filter>
          </defs>
          <path class="heart-core-path" filter="url(#heart-core-glow)" fill="url(#heart-core-gradient)" d="M80 133C37 102 20 78 20 51c0-19 14-33 33-33 12 0 22 6 27 16 5-10 15-16 27-16 19 0 33 14 33 33 0 27-17 51-60 82Z"></path>
          <path class="heart-sheen" d="M46 36c13-11 31-7 38 9" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="7" stroke-linecap="round"></path>
        </svg>
        <svg class="heart-progress" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52"></circle>
          <circle cx="60" cy="60" r="52"></circle>
        </svg>
        <span class="heart-signal signal-a"></span>
        <span class="heart-signal signal-b"></span>
        <span class="heart-cycle">${formatHeartTime(remaining)}</span>
      </div>
      <div class="heart-copy">
        <p class="kicker">Coprésence</p>
        <h3><span data-heart-counter="cycle">${cycle.points}</span> ❤️</h3>
        <span>${active ? "✨ Attention active" : "⏸️ En pause douce"} ⏲️ prochain cycle : ${formatHeartTime(remaining)}</span>
        <div class="heart-actions">
          <button class="heart-menu-toggle" type="button" data-widget-menu="gamification" aria-label="Actions de la coprésence">
            <i>more_vert</i>
          </button>
          <div class="heart-menu-popover" hidden>
            <button type="button" data-external-widget="gamification">
              <i>open_in_new</i>
              <span>Ouvrir en popup</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="heart-score-grid">
      <span><small>Total</small><strong data-heart-counter="global">${globalScore}</strong></span>
      <span><small>Projet</small><strong data-heart-counter="project">${projectScore}</strong></span>
    </div>
    <div class="heart-breakdown" aria-label="Détail des cœurs du cycle">
      ${heartBreakdownItem("schedule", "Temps", cycle.breakdown.second)}
      ${heartBreakdownItem("touch_app", "Clics", cycle.breakdown.click)}
      ${heartBreakdownItem("add_reaction", "Réactions", cycle.breakdown.reaction)}
      ${heartBreakdownItem("reply", "Réponses", cycle.breakdown.reply)}
      ${heartBreakdownItem("chat", "Contributions", cycle.breakdown.comment)}
      ${heartBreakdownItem("visibility", "Aperçus", cycle.breakdown.linkPreview)}
      ${heartBreakdownItem("open_in_new", "Ouvertures", cycle.breakdown.linkOpen)}
      ${heartBreakdownItem("content_copy", "Copies", cycle.breakdown.linkCopy)}
      ${heartBreakdownItem("fullscreen", "Intégrations", cycle.breakdown.linkEmbed)}
    </div>
  ` : `
    <div class="heart-idle">
      <i>favorite</i>
      <div>
        <p class="kicker">💓 coprésence</p>
        <strong>Activez la coprésence pour lancer les cycles d’attention.</strong>
        <span>Les points sont synchronisés par sessions actives de ${cycleSeconds} secondes.</span>
      </div>
    </div>
  `;
}

export function formatHeartTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function heartBreakdownItem(icon, label, value) {
  return `<span><i aria-hidden="true">${icon}</i><small>${label}</small><strong>${Number(value || 0)}</strong></span>`;
}
