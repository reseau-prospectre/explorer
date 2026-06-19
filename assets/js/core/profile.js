import { loadJson } from "./utils.js";

export function createProfileStore({ profileKey, anonymousProfileKey, googleProfileKey }) {
  function getProfile() {
    return getAnonymousProfile();
  }

  function getAnonymousProfile() {
    const existing = loadJson(anonymousProfileKey, null) || loadJson(profileKey, null);
    if (existing) {
      if (existing.displayName === "Vous" && existing.avatar === "V") {
        const migrated = normalizeAnonymousProfile({ ...existing, ...makeAnonymousIdentity() });
        persistProfile(migrated, "anonymous");
        return migrated;
      }
      const profile = normalizeAnonymousProfile(existing);
      persistProfile(profile, "anonymous");
      return profile;
    }
    return createAnonymousProfile();
  }

  function createAnonymousProfile() {
    const anonymous = makeAnonymousIdentity();
    const profile = {
      clientId: `visitor_${Math.random().toString(16).slice(2, 8)}`,
      displayName: anonymous.displayName,
      avatar: anonymous.avatar,
      color: anonymous.color,
      photoURL: null,
      googlePhotoURL: null,
      avatarMode: "initials",
      userCustomized: false
    };
    persistProfile(profile, "anonymous");
    return profile;
  }

  function normalizeAnonymousProfile(profile) {
    return {
      clientId: profile.clientId || `visitor_${Math.random().toString(16).slice(2, 8)}`,
      displayName: profile.displayName || "Anonyme",
      avatar: profile.avatar || getInitials(profile.displayName || "Anonyme"),
      color: profile.color || "#a7f3d0",
      photoURL: null,
      googlePhotoURL: null,
      avatarMode: "initials",
      userCustomized: Boolean(profile.userCustomized)
    };
  }

  function makeAnonymousIdentity() {
    const adjectives = ["Aurore", "Brume", "Canopée", "Dune", "Équinoxe", "Flux", "Iris", "Latitude", "Mistral", "Nébuleuse", "Onde", "Rivage"];
    const nouns = ["Jade", "Cobalt", "Ambre", "Sauge", "Corail", "Indigo", "Opale", "Graphite", "Lichen", "Silex", "Azur", "Cuivre"];
    const colors = ["#a7f3d0", "#7dd3fc", "#93c5fd", "#c4b5fd", "#f9a8d4", "#fcd34d", "#fdba74", "#86efac", "#67e8f9", "#d9f99d", "#fca5a5", "#ddd6fe"];
    const seed = Math.floor(Math.random() * adjectives.length * nouns.length);
    const adjective = adjectives[seed % adjectives.length];
    const noun = nouns[Math.floor(seed / adjectives.length) % nouns.length];
    return {
      displayName: `${adjective} ${noun}`,
      avatar: `${adjective[0]}${noun[0]}`.toUpperCase(),
      color: colors[seed % colors.length]
    };
  }

  async function getGoogleProfile(user) {
    const saved = loadJson(googleProfileKey, null);
    const displayName = String(user.displayName || "").trim();
    const anonymous = getAnonymousProfile();
    const sameAccount = saved?.email && saved.email === user.email;
    const googlePhotoURL = getGooglePhotoURL(user) || saved?.googlePhotoURL || null;
    const avatarMode = sameAccount ? saved.avatarMode : googlePhotoURL ? "google" : "initials";
    const profile = {
      clientId: anonymous.clientId,
      displayName: sameAccount && saved.displayName ? saved.displayName : displayName || "Compte Google",
      avatar: sameAccount && saved.avatar ? saved.avatar : getInitials(displayName || user.email || "Google"),
      color: sameAccount && saved.color ? saved.color : anonymous.color,
      googlePhotoURL,
      avatarMode,
      photoURL: avatarMode === "google" ? googlePhotoURL : null,
      userCustomized: Boolean(sameAccount && saved.userCustomized),
      email: user.email || null
    };
    persistProfile(profile, "google");
    return profile;
  }

  function persistProfile(profile, mode) {
    const key = mode === "google" ? googleProfileKey : anonymousProfileKey;
    localStorage.setItem(key, JSON.stringify(profile));
    if (mode !== "google") localStorage.setItem(profileKey, JSON.stringify(profile));
  }

  function getInitials(displayName) {
    return String(displayName || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "G";
  }

  function getGooglePhotoURL(user) {
    return user?.photoURL
      || user?.providerData?.find((provider) => provider?.photoURL)?.photoURL
      || null;
  }

  return { getAnonymousProfile, getGoogleProfile, getInitials, getProfile, persistProfile };
}
