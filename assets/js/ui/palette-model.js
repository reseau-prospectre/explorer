export const PALETTE_COLOR_COUNT = 7;

export const PALETTE_PRESETS = Object.freeze([
  {
    id: "aurora",
    label: "Aurora",
    colors: ["#7dd3fc", "#5ee7df", "#b490f5", "#86efac", "#fb7185", "#fbbf24", "#38bdf8"]
  },
  {
    id: "ember",
    label: "Ember",
    colors: ["#fb7185", "#f97316", "#fbbf24", "#f43f5e", "#a855f7", "#22c55e", "#38bdf8"]
  },
  {
    id: "lagoon",
    label: "Lagoon",
    colors: ["#22d3ee", "#14b8a6", "#60a5fa", "#a7f3d0", "#818cf8", "#f0abfc", "#fde68a"]
  },
  {
    id: "orchid",
    label: "Orchid",
    colors: ["#c084fc", "#e879f9", "#818cf8", "#f472b6", "#38bdf8", "#a3e635", "#facc15"]
  },
  {
    id: "sage",
    label: "Sage",
    colors: ["#86efac", "#5eead4", "#bef264", "#67e8f9", "#fcd34d", "#c4b5fd", "#fda4af"]
  },
  {
    id: "prism",
    label: "Prism",
    colors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#ec4899"]
  }
]);

const DEFAULT_RANDOM_BASE = PALETTE_PRESETS[0].colors;

export function normalizePalettePreference(value) {
  if (!value || typeof value !== "object") return { mode: "random" };
  if (value.mode === "preset" && PALETTE_PRESETS.some((preset) => preset.id === value.presetId)) {
    return { mode: "preset", presetId: value.presetId };
  }
  if (value.mode === "custom") {
    return { mode: "custom", colors: normalizePaletteColors(value.colors) };
  }
  return { mode: "random" };
}

export function resolvePalette(preference, randomSource = Math.random) {
  const normalized = normalizePalettePreference(preference);
  if (normalized.mode === "preset") {
    const preset = PALETTE_PRESETS.find((item) => item.id === normalized.presetId) || PALETTE_PRESETS[0];
    return { mode: "preset", presetId: preset.id, label: preset.label, colors: [...preset.colors] };
  }
  if (normalized.mode === "custom") {
    return { mode: "custom", presetId: "custom", label: "Custom", colors: normalizePaletteColors(normalized.colors) };
  }
  return { mode: "random", presetId: "random", label: "Random", colors: createRandomPalette(randomSource) };
}

export function normalizePaletteColors(colors) {
  const normalized = Array.from({ length: PALETTE_COLOR_COUNT }, (_, index) => {
    const value = Array.isArray(colors) ? colors[index] : null;
    return isHexColor(value) ? value.toLowerCase() : DEFAULT_RANDOM_BASE[index];
  });
  return normalized;
}

export function createRandomPalette(randomSource = Math.random) {
  const hue = Math.floor(randomSource() * 360);
  const offsets = [0, 34, 78, 142, 204, 262, 316];
  return offsets.map((offset, index) => {
    const saturation = index % 3 === 0 ? 78 : index % 3 === 1 ? 70 : 84;
    const lightness = index % 2 === 0 ? 68 : 62;
    return hslToHex((hue + offset) % 360, saturation, lightness);
  });
}

export function palettePreviewGradient(colors) {
  const safe = normalizePaletteColors(colors);
  return `linear-gradient(135deg, ${safe[0]}, ${safe[2]}, ${safe[4]}, ${safe[6]})`;
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function hslToHex(hue, saturation, lightness) {
  const s = saturation / 100;
  const l = lightness / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = l - c / 2;
  const [r, g, b] = hue < 60 ? [c, x, 0]
    : hue < 120 ? [x, c, 0]
      : hue < 180 ? [0, c, x]
        : hue < 240 ? [0, x, c]
          : hue < 300 ? [x, 0, c]
            : [c, 0, x];
  return `#${toHex(r + m)}${toHex(g + m)}${toHex(b + m)}`;
}

function toHex(value) {
  return Math.round(value * 255).toString(16).padStart(2, "0");
}
