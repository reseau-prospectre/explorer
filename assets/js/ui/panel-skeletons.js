export function renderPanelSkeleton(kind = "details") {
  if (kind === "discussion") return `
    <section class="panel-skeleton panel-skeleton--discussion ps-skeleton-layout" aria-busy="true">
      <span class="ps-skeleton ps-skeleton--heading"></span>
      <span class="ps-skeleton ps-skeleton--text" style="width:72%"></span>
      <div class="panel-skeleton__thread">
        ${Array.from({ length: 3 }, (_, index) => `
          <article class="panel-skeleton__message ps-surface">
            <span class="ps-skeleton ps-skeleton--circle"></span>
            <span class="ps-skeleton ps-skeleton--text" style="width:${index === 1 ? 88 : 68}%"></span>
            <span class="ps-skeleton ps-skeleton--text" style="width:${index === 2 ? 54 : 76}%"></span>
          </article>
        `).join("")}
      </div>
    </section>
  `;
  if (kind === "profile") return `
    <section class="panel-skeleton panel-skeleton--profile ps-skeleton-layout" aria-busy="true">
      <span class="ps-skeleton ps-skeleton--heading"></span>
      <div class="panel-skeleton__grid panel-skeleton__grid--two">
        <span class="ps-skeleton ps-skeleton-row"></span>
        <span class="ps-skeleton ps-skeleton-row"></span>
      </div>
      <article class="panel-skeleton__card ps-surface">
        <span class="ps-skeleton ps-skeleton--circle"></span>
        <span class="ps-skeleton ps-skeleton--text" style="width:82%"></span>
        <span class="ps-skeleton ps-skeleton--text" style="width:64%"></span>
      </article>
    </section>
  `;
  if (kind === "gamification") return `
    <section class="panel-skeleton panel-skeleton--gamification ps-skeleton-layout" aria-busy="true">
      <span class="ps-skeleton ps-skeleton--circle panel-skeleton__reactor"></span>
      <span class="ps-skeleton ps-skeleton--heading"></span>
      <div class="panel-skeleton__grid panel-skeleton__grid--three">
        ${Array.from({ length: 9 }, () => `<span class="ps-skeleton ps-skeleton-row"></span>`).join("")}
      </div>
    </section>
  `;
  return `
    <section class="panel-skeleton panel-skeleton--details ps-skeleton-layout" aria-busy="true">
      <span class="ps-skeleton ps-skeleton--heading"></span>
      <span class="ps-skeleton ps-skeleton--text" style="width:84%"></span>
      <span class="ps-skeleton ps-skeleton--text" style="width:62%"></span>
      <article class="panel-skeleton__card ps-surface">
        <span class="ps-skeleton ps-skeleton--text" style="width:72%"></span>
        <span class="ps-skeleton ps-skeleton--text" style="width:92%"></span>
        <span class="ps-skeleton ps-skeleton--text" style="width:58%"></span>
      </article>
      <div class="panel-skeleton__chips">
        ${Array.from({ length: 8 }, () => `<span class="ps-skeleton"></span>`).join("")}
      </div>
    </section>
  `;
}
