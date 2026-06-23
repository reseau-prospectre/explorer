export function minimalPresence(profile, { selectedNodeId, now = Date.now() } = {}) {
  return {
    clientId: profile.clientId,
    displayName: profile.displayName,
    avatar: profile.avatar,
    photoURL: profile.photoURL || null,
    color: profile.color,
    selectedNodeId,
    lastSeen: now
  };
}

export function getIdentityState({ authProvider, isAdmin, authEmail, realtimeStatus }) {
  if (authProvider === "google") {
    return {
      label: isAdmin ? "Google · admin" : "Google",
      detail: authEmail || "Compte Google connecté",
      connected: true
    };
  }
  if (realtimeStatus === "firebase") {
    return { label: "Anonyme", detail: "Identité anonyme connectée à Firebase", connected: true };
  }
  return { label: "Local", detail: "Identité enregistrée uniquement sur cet appareil", connected: false };
}

export function resolveAvatarProfile(profile, { currentProfile, authUid }) {
  const isCurrentUser = profile?.ownerId && profile.ownerId === authUid
    || profile?.actorId && profile.actorId === authUid
    || profile?.clientId && profile.clientId === currentProfile?.clientId;
  return isCurrentUser ? currentProfile : profile;
}
