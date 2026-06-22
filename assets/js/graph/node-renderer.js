import { TYPE_CONFIG } from "../core/config.js";
import { shortLabel } from "../core/utils.js";

export function createNodeRenderer({ state, resolveAvatarAssetURL }) {
  const nodeTextureCache = new Map();

  function makeNodeObject(node) {
    if (node.type === "contribution") return makeContributionNodeObject(node);
    const group = new THREE.Group();
    const color = TYPE_CONFIG[node.type]?.color || "#ffffff";
    const isSelected = node.id === state.selectedId;
    const isRelated = state.selectedPathIds?.has(node.id);
    const isPrimarySelection = isSelected
      || state.selectedLinkPathIds?.has(node.id)
      || state.searchMatchedIds?.has(node.id);
    const hasGraphFocus = state.graphPrefs?.focusMode && !state.focusSuppressed && (state.selectedId || state.selectedLinkKey);
    const isDimmed = state.graphPrefs?.focusMode && hasGraphFocus && !isRelated;
    const isSearchMatch = state.searchMatchedIds?.has(node.id);
    const material = new THREE.MeshLambertMaterial({
      color: isDimmed ? "#748189" : color,
      transparent: true,
      opacity: isDimmed ? 0.12 : 0.92,
      emissive: isDimmed ? "#000000" : color,
      emissiveIntensity: isDimmed ? 0 : isSelected ? 0.46 : isSearchMatch ? 0.35 : isRelated ? 0.25 : 0.12
    });
    if (node.imageURL) {
      const texture = getNodeTexture(node.imageURL, (loadedTexture) => {
        material.map = loadedTexture;
        material.color.set("#ffffff");
        material.needsUpdate = true;
      });
      if (texture) {
        material.map = texture;
        material.color.set("#ffffff");
      }
    }
    if (isPrimarySelection || isRelated) {
      const halo = makeHaloSprite(color, {
        strong: isPrimarySelection,
        dimmed: isDimmed,
        size: node.size
      });
      halo.position.set(0, 0, 0);
      group.add(halo);
    }
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(3, node.size * 0.52), 20, 16),
      material
    );
    group.add(sphere);
    if (shouldShowNodeLabel(node, isSelected, isRelated || isSearchMatch)) {
      const sprite = makeTextSprite(node.label, color, {
        selected: isSelected,
        important: isRelated || isImportantNode(node)
      });
      sprite.position.set(0, node.size * 0.92, node.size * 0.35);
      sprite.renderOrder = 1000;
      group.add(sprite);
    }
    return group;
  }

  function makeHaloSprite(color, options = {}) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 192;
    canvas.height = 192;
    const gradient = context.createRadialGradient(96, 96, 22, 96, 96, 88);
    gradient.addColorStop(0, hexToRgba(color, options.strong ? 0.38 : 0.18));
    gradient.addColorStop(0.48, hexToRgba(color, options.strong ? 0.2 : 0.1));
    gradient.addColorStop(1, hexToRgba(color, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, 192, 192);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: options.dimmed ? 0.28 : 1
    });
    const sprite = new THREE.Sprite(material);
    const base = Math.max(18, (options.size || 10) * (options.strong ? 2.45 : 1.95));
    sprite.scale.set(base, base, 1);
    const startedAt = performance.now();
    sprite.onBeforeRender = () => {
      const pulse = 1 + Math.sin((performance.now() - startedAt) / 520) * (options.strong ? 0.055 : 0.035);
      sprite.scale.set(base * pulse, base * pulse, 1);
      material.opacity = (options.dimmed ? 0.28 : 1) * (options.strong ? 0.9 : 0.62);
    };
    sprite.renderOrder = 900;
    return sprite;
  }

  function hexToRgba(hex, alpha) {
    const value = String(hex || "#ffffff").replace("#", "");
    const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
    const int = Number.parseInt(normalized, 16);
    if (Number.isNaN(int)) return `rgba(255,255,255,${alpha})`;
    return `rgba(${(int >> 16) & 255},${(int >> 8) & 255},${int & 255},${alpha})`;
  }

  function makeContributionNodeObject(node) {
    const group = new THREE.Group();
    const color = node.color || "#a7f3d0";
    const isSelected = node.commentId === state.highlightedCommentId;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 256;
    const texture = new THREE.CanvasTexture(canvas);
    const draw = (image = null) => {
      context.clearRect(0, 0, 256, 256);
      context.save();
      context.beginPath();
      context.arc(128, 128, 74, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = color;
      context.fillRect(54, 54, 148, 148);
      if (image) drawImageCover(context, image, 54, 54, 148, 148);
      context.restore();
      context.beginPath();
      context.arc(128, 128, 74, 0, Math.PI * 2);
      context.lineWidth = isSelected ? 12 : 6;
      context.strokeStyle = isSelected ? "#ffffff" : "rgba(7, 16, 21, 0.72)";
      context.stroke();
      if (!image) {
        context.fillStyle = "#071015";
        context.font = "900 58px system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(shortLabel(node.avatar || "?", 2), 128, 127);
      }
      if (node.replyCount > 0) {
        context.beginPath();
        context.arc(188, 72, 32, 0, Math.PI * 2);
        context.fillStyle = "#edf7f6";
        context.fill();
        context.fillStyle = "#071015";
        context.font = "900 28px system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(node.messageCount), 188, 73);
      }
      texture.needsUpdate = true;
    };
    draw();
    const avatarURL = resolveAvatarAssetURL(node.photoURL);
    if (avatarURL) {
      const image = new Image();
      image.referrerPolicy = "no-referrer";
      image.onload = () => draw(image);
      image.src = avatarURL;
    }
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    const scale = isSelected ? 26 : 21;
    sprite.scale.set(scale, scale, 1);
    group.add(sprite);
    return group;
  }

  function drawImageCover(context, image, x, y, width, height) {
    const sourceRatio = image.naturalWidth / image.naturalHeight || 1;
    const targetRatio = width / height;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;
    let sourceX = 0;
    let sourceY = 0;
    if (sourceRatio > targetRatio) {
      sourceWidth = image.naturalHeight * targetRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = image.naturalWidth / targetRatio;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function getNodeTexture(url, onReady) {
    const cached = nodeTextureCache.get(url);
    if (cached?.status === "ready") return cached.texture;
    if (cached?.status === "loading") {
      cached.callbacks.push(onReady);
      return null;
    }
    if (cached?.status === "failed") return null;
    const entry = { status: "loading", callbacks: [onReady], texture: null };
    nodeTextureCache.set(url, entry);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      entry.status = "ready";
      entry.texture = texture;
      entry.callbacks.splice(0).forEach((callback) => callback?.(texture));
    }, undefined, () => {
      entry.status = "failed";
      entry.callbacks.length = 0;
    });
    return null;
  }

  function shouldShowNodeLabel(node, isSelected, isRelated) {
    if (state.graphPrefs?.labelMode === "none") return false;
    if (state.graphPrefs?.labelMode === "all") return true;
    if (isSelected) return true;
    if (isRelated && isImportantNode(node)) return true;
    if (!state.selectedId && isImportantNode(node)) return true;
    return false;
  }

  function isImportantNode(node) {
    if (TYPE_CONFIG[node.type]?.showLabel) return true;
    if (Number(node.influence_score || 0) >= 8) return true;
    if (Number(node.dependence_score || 0) >= 8) return true;
    return false;
  }

  function makeTextSprite(text, color, options = {}) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 760;
    const fontSize = options.selected ? 34 : options.important ? 29 : 25;
    const maxWidth = options.selected ? 660 : 600;
    const maxLines = options.selected ? 3 : 2;
    const isLightTheme = document.documentElement.dataset.theme === "light";
    context.font = `700 ${fontSize}px system-ui, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const lines = wrapSpriteText(context, text, maxWidth, maxLines);
    const lineHeight = Math.round(fontSize * 1.16);
    const boxHeight = Math.max(72, lines.length * lineHeight + 28);
    canvas.height = boxHeight + 76;
    context.font = `700 ${fontSize}px system-ui, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = isLightTheme
      ? options.selected ? "rgba(245, 250, 249, 0.96)" : "rgba(239, 246, 245, 0.9)"
      : options.selected ? "rgba(7, 16, 21, 0.92)" : "rgba(9, 20, 27, 0.74)";
    roundRect(context, 28, 34, 704, boxHeight, 18);
    context.fill();
    context.strokeStyle = color;
    context.lineWidth = options.selected ? 4 : 2;
    context.globalAlpha = options.selected ? 0.96 : 0.7;
    context.stroke();
    context.globalAlpha = 1;
    context.fillStyle = isLightTheme ? "#0b1a22" : "#f1f8f7";
    const firstLineY = 34 + boxHeight / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      context.fillText(line, 380, firstLineY + index * lineHeight);
    });
    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    }));
    const width = options.selected ? 70 : 58;
    sprite.scale.set(width, width * (canvas.height / canvas.width), 1);
    return sprite;
  }

  function wrapSpriteText(context, text, maxWidth, maxLines) {
    const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (!words.length) return [""];
    const lines = [];
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (context.measureText(next).width <= maxWidth) {
        current = next;
        continue;
      }
      if (current) lines.push(current);
      current = context.measureText(word).width > maxWidth ? shortLabel(word, 18) : word;
      if (lines.length === maxLines - 1) break;
    }
    if (current && lines.length < maxLines) lines.push(current);
    const consumed = lines.join(" ");
    const original = words.join(" ");
    if (lines.length && consumed.length < original.length) {
      lines[lines.length - 1] = shortLabel(lines[lines.length - 1], Math.max(18, lines[lines.length - 1].length - 1));
    }
    return lines;
  }

  function roundRect(context, x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + width, y, x + width, y + height, radius);
    context.arcTo(x + width, y + height, x, y + height, radius);
    context.arcTo(x, y + height, x, y, radius);
    context.arcTo(x, y, x + width, y, radius);
    context.closePath();
  }

  return { makeNodeObject };
}
