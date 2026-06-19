export function createRealtimeProviders(dependencies) {
  const {
    state,
    minimalPresence,
    getAnonymousProfile,
    getGoogleProfile,
    renderProfileButton,
    renderProfileControls,
    renderConnectionStatus,
    showToast,
    emojiToId,
    findComment,
    getAllComments
  } = dependencies;

  class LocalRealtimeProvider {
    constructor() {
      this.presenceCallbacks = [];
      this.commentsSnapshotCallbacks = [];
      this.activityCallbacks = [];
      this.gamificationCallbacks = [];
      this.presence = [];
    }

    async connect({ userProfile }) {
      this.presence = [{ ...minimalPresence(userProfile), selectedNodeId: null }];
      this.publishPresence();
    }

    async updatePresence(presence) {
      this.presence[0] = { ...this.presence[0], ...presence, lastSeen: Date.now() };
      this.publishPresence();
    }

    async syncProfile(profile) {
      this.presence[0] = {
        ...this.presence[0],
        ...minimalPresence(profile),
        selectedNodeId: state.selectedId,
        lastSeen: Date.now()
      };
      this.publishPresence();
    }

    async addComment() {}
    async toggleReaction() {}
    async toggleDefaultReaction() {}
    async toggleEntityReaction() {}
    async toggleDefaultEntityReaction() {}
    async commitHeartCycle() {}
    async trashComment() {}
    async restoreComment() {}
    async permanentlyDeleteComment() {}
    async disconnect() {}

    onPresence(callback) {
      this.presenceCallbacks.push(callback);
      callback(this.presence);
    }

    onCommentsSnapshot(callback) {
      this.commentsSnapshotCallbacks.push(callback);
    }

    onActivity(callback) {
      this.activityCallbacks.push(callback);
    }

    onGamification(callback) {
      this.gamificationCallbacks.push(callback);
      callback({ global: null, project: null });
    }

    publishPresence() {
      this.presenceCallbacks.forEach((callback) => callback(this.presence));
    }

    publishGamification(payload) {
      this.gamificationCallbacks.forEach((callback) => callback(payload));
    }
  }

  class FirebaseRealtimeProvider extends LocalRealtimeProvider {
    constructor(config) {
      super();
      this.config = config;
      this.lastPresenceWrite = 0;
      this.pendingPresence = null;
    }

    async connect({ userProfile }) {
      this.presence = [{ ...minimalPresence(userProfile), selectedNodeId: state.selectedId }];
      this.publishPresence();
      try {
        const appModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
        const dbModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js");
        const authModule = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
        this.dbApi = dbModule;
        this.authApi = authModule;
        this.app = appModule.getApps().length ? appModule.getApp() : appModule.initializeApp(this.config.firebase);
        this.db = dbModule.getDatabase(this.app);
        this.auth = authModule.getAuth(this.app);
        await authModule.setPersistence(this.auth, authModule.browserLocalPersistence);
        this.roomId = this.config.roomId || "prospectre";
        this.roomPath = `rooms/${this.roomId}/${state.datasetId}`;
        this.globalGamificationPath = `rooms/${this.roomId}/_gamification`;
        const credentials = this.auth.currentUser
          ? { user: this.auth.currentUser }
          : await authModule.signInAnonymously(this.auth);
        this.setAuthState(credentials.user);
        state.profile = credentials.user?.isAnonymous
          ? getAnonymousProfile()
          : await getGoogleProfile(credentials.user);
        renderProfileButton();
        renderProfileControls();
        await this.writePresence(state.profile);
        state.realtimeStatus = "firebase";
        renderConnectionStatus();
        this.unsubscribers = [];
        this.unsubscribers.push(dbModule.onValue(dbModule.ref(this.db, `${this.roomPath}/presence`), (snapshot) => {
          const now = Date.now();
          const online = Object.values(snapshot.val() || {}).filter((item) => now - item.lastSeen < 45000);
          this.presence = online.length ? online : this.presence;
          this.publishPresence();
        }));
        this.unsubscribers.push(dbModule.onValue(dbModule.ref(this.db, `${this.roomPath}/comments`), (snapshot) => {
          const comments = Object.values(snapshot.val() || {});
          this.commentsSnapshotCallbacks.forEach((callback) => callback(comments));
        }));
        const recentActivity = dbModule.query(
          dbModule.ref(this.db, `${this.roomPath}/activity`),
          dbModule.limitToLast(200)
        );
        this.unsubscribers.push(dbModule.onValue(recentActivity, (snapshot) => {
          const activity = Object.values(snapshot.val() || {}).sort((a, b) => b.createdAt - a.createdAt);
          this.activityCallbacks.forEach((callback) => callback(activity));
        }));
        this.subscribeGamification();
      } catch {
        state.realtimeStatus = "local";
        showToast("Mode local actif");
        renderConnectionStatus();
        this.publishPresence();
      }
    }

    setAuthState(user) {
      const email = user?.email || null;
      const adminEmails = (this.config.adminEmails || []).map((item) => String(item).toLowerCase());
      state.authUid = user?.uid || null;
      state.authEmail = email;
      state.authProvider = user?.isAnonymous ? "anonymous" : "google";
      state.isAdmin = Boolean(email && adminEmails.includes(email.toLowerCase()));
      return user;
    }

    async writePresence(userProfile) {
      if (!this.dbApi || !this.db || !state.authUid) return;
      if (this.presenceRef) await this.dbApi.remove(this.presenceRef);
      this.presence[0] = {
        ...minimalPresence(userProfile),
        ownerId: state.authUid,
        authProvider: state.authProvider,
        authEmail: state.authEmail || null,
        isAdmin: state.isAdmin
      };
      this.publishPresence();
      this.presenceRef = this.dbApi.ref(this.db, `${this.roomPath}/presence/${state.authUid}`);
      await this.dbApi.set(this.presenceRef, this.presence[0]);
      this.dbApi.onDisconnect(this.presenceRef).remove();
    }

    async signInWithGoogle() {
      if (!this.authApi || !this.auth) throw new Error("Firebase Auth indisponible");
      const previousRef = this.presenceRef;
      const provider = new this.authApi.GoogleAuthProvider();
      const credentials = await this.authApi.signInWithPopup(this.auth, provider);
      this.setAuthState(credentials.user);
      state.profile = await getGoogleProfile(credentials.user);
      if (previousRef && this.dbApi) await this.dbApi.remove(previousRef);
      await this.writePresence(state.profile);
      await this.updatePresence({ selectedNodeId: state.selectedId });
      this.subscribeGamification();
      this.publishPresence();
    }

    subscribeGamification() {
      if (!this.dbApi || !this.db || !state.authUid) return;
      for (const unsubscribe of this.gamificationUnsubscribers || []) unsubscribe();
      this.gamificationUnsubscribers = [];
      const payload = { global: null, project: null };
      const publish = () => this.publishGamification({ ...payload });
      this.gamificationUnsubscribers.push(this.dbApi.onValue(
        this.dbApi.ref(this.db, `${this.globalGamificationPath}/users/${state.authUid}`),
        (snapshot) => {
          payload.global = snapshot.val() || null;
          publish();
        }
      ));
      this.gamificationUnsubscribers.push(this.dbApi.onValue(
        this.dbApi.ref(this.db, `${this.roomPath}/gamification/users/${state.authUid}`),
        (snapshot) => {
          payload.project = snapshot.val() || null;
          publish();
        }
      ));
      this.unsubscribers.push(...this.gamificationUnsubscribers);
    }

    async signOutGoogle(userProfile) {
      if (!this.authApi || !this.auth) return;
      const previousRef = this.presenceRef;
      if (previousRef && this.dbApi) await this.dbApi.remove(previousRef);
      await this.authApi.signOut(this.auth);
      const credentials = await this.authApi.signInAnonymously(this.auth);
      this.setAuthState(credentials.user);
      await this.writePresence(userProfile);
      await this.updatePresence({ selectedNodeId: state.selectedId });
      this.subscribeGamification();
      this.publishPresence();
    }

    async updatePresence(presence) {
      await super.updatePresence(presence);
      if (!this.presenceRef || !this.dbApi) return;
      this.pendingPresence = { ...this.pendingPresence, ...presence, lastSeen: Date.now() };
      const now = Date.now();
      if (now - this.lastPresenceWrite < 12000) return;
      this.lastPresenceWrite = now;
      const payload = this.pendingPresence;
      this.pendingPresence = null;
      await this.dbApi.update(this.presenceRef, payload);
    }

    async syncProfile(profile) {
      await super.syncProfile(profile);
      if (!this.presenceRef || !this.dbApi) return;
      this.pendingPresence = null;
      this.lastPresenceWrite = Date.now();
      await this.dbApi.update(this.presenceRef, {
        ...minimalPresence(profile),
        selectedNodeId: state.selectedId,
        ownerId: state.authUid,
        authProvider: state.authProvider,
        authEmail: state.authEmail || null,
        isAdmin: state.isAdmin,
        lastSeen: Date.now()
      });
    }

    async addComment(entityId, comment) {
      if (!this.dbApi || !this.db) return;
      const ref = this.dbApi.ref(this.db, `${this.roomPath}/comments/${comment.id}`);
      const payload = {
        id: comment.id,
        entityId,
        text: comment.text,
        parentId: comment.parentId || null,
        displayName: comment.displayName,
        avatar: comment.avatar,
        photoURL: comment.photoURL || null,
        color: comment.color,
        clientId: comment.clientId,
        ownerId: state.authUid,
        ownerEmail: state.authEmail || null,
        createdAt: comment.createdAt
      };
      await this.dbApi.set(ref, payload);
      await this.addActivity(comment.parentId ? "reply" : "comment", payload);
    }

    async toggleReaction(entityId, commentId, reaction) {
      if (!this.dbApi || !this.db) return;
      const reactionId = emojiToId(reaction.emoji);
      const reactionRef = this.dbApi.ref(
        this.db,
        `${this.roomPath}/comments/${commentId}/reactions/${reactionId}/${state.authUid}`
      );
      await this.dbApi.runTransaction(reactionRef, (current) => current ? null : {
        emoji: reaction.emoji,
        annotation: reaction.annotation || "",
        displayName: state.profile.displayName,
        isAdmin: state.isAdmin,
        createdAt: Date.now()
      });
    }

    async toggleEntityReaction(entityId, reaction) {
      if (!this.dbApi || !this.db || !entityId) return;
      await this.ensureEntityReactionAnchor(entityId);
      const reactionId = emojiToId(reaction.emoji);
      const reactionRef = this.dbApi.ref(
        this.db,
        `${this.roomPath}/comments/${entityReactionCommentId(entityId)}/reactions/${reactionId}/${state.authUid}`
      );
      await this.dbApi.runTransaction(reactionRef, (current) => current ? null : {
        emoji: reaction.emoji,
        annotation: reaction.annotation || "",
        displayName: state.profile.displayName,
        isAdmin: state.isAdmin,
        createdAt: Date.now()
      });
    }

    async toggleDefaultReaction(entityId, commentId, reaction) {
      if (!state.isAdmin || !this.dbApi || !this.db) return;
      const reactionRef = this.dbApi.ref(
        this.db,
        `${this.roomPath}/comments/${commentId}/defaultReactions/${emojiToId(reaction.emoji)}`
      );
      await this.dbApi.runTransaction(reactionRef, (current) => current ? null : {
        emoji: reaction.emoji,
        annotation: reaction.annotation || "",
        addedBy: state.authUid,
        createdAt: Date.now()
      });
    }

    async toggleDefaultEntityReaction(entityId, reaction) {
      if (!state.isAdmin || !this.dbApi || !this.db || !entityId) return;
      await this.ensureEntityReactionAnchor(entityId);
      const reactionRef = this.dbApi.ref(
        this.db,
        `${this.roomPath}/comments/${entityReactionCommentId(entityId)}/defaultReactions/${emojiToId(reaction.emoji)}`
      );
      await this.dbApi.runTransaction(reactionRef, (current) => current ? null : {
        emoji: reaction.emoji,
        annotation: reaction.annotation || "",
        addedBy: state.authUid,
        createdAt: Date.now()
      });
    }

    async commitHeartCycle(cycle) {
      if (!this.dbApi || !this.db || !state.authUid || !cycle?.points) return;
      const now = Date.now();
      const cycleId = cycle.id || `${state.authUid}-${cycle.startedAt || now}`;
      const base = {
        displayName: state.profile.displayName,
        avatar: state.profile.avatar,
        photoURL: state.profile.photoURL || null,
        color: state.profile.color,
        lastCycle: { ...cycle, id: cycleId },
        lastCommitAt: now
      };
      const updateScore = (current, field) => {
        const previous = current || {};
        if (previous.appliedCycles?.[cycleId]) return previous;
        const appliedCycles = Object.fromEntries(
          Object.entries(previous.appliedCycles || {})
            .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
            .slice(0, 79)
        );
        return {
          ...previous,
          ...base,
          totalHearts: Number(previous.totalHearts || 0) + (field === "totalHearts" ? cycle.points : 0),
          projectHearts: Number(previous.projectHearts || 0) + (field === "projectHearts" ? cycle.points : 0),
          cycles: Number(previous.cycles || 0) + 1,
          appliedCycles: {
            ...appliedCycles,
            [cycleId]: now
          }
        };
      };
      const results = await Promise.allSettled([
        this.dbApi.runTransaction(
          this.dbApi.ref(this.db, `${this.globalGamificationPath}/users/${state.authUid}`),
          (current) => updateScore(current, "totalHearts")
        ),
        this.dbApi.runTransaction(
          this.dbApi.ref(this.db, `${this.roomPath}/gamification/users/${state.authUid}`),
          (current) => updateScore(current, "projectHearts")
        )
      ]);
      const failed = results.filter((result) => result.status === "rejected");
      if (failed.length) {
        const error = new Error("Gamification commit partially failed");
        error.partial = failed.length < results.length;
        throw error;
      }
    }

    async ensureEntityReactionAnchor(entityId) {
      const id = entityReactionCommentId(entityId);
      const ref = this.dbApi.ref(this.db, `${this.roomPath}/comments/${id}`);
      const snapshot = await this.dbApi.get(ref);
      if (snapshot.exists()) return;
      await this.dbApi.set(ref, {
        id,
        entityId,
        text: "",
        parentId: null,
        systemKind: "entity-reactions",
        displayName: state.profile.displayName || "PROSPECTRE",
        avatar: state.profile.avatar || "PR",
        photoURL: state.profile.photoURL || null,
        color: state.profile.color || "#7dd3fc",
        clientId: state.profile.clientId || state.authUid,
        ownerId: state.authUid,
        ownerEmail: state.authEmail || null,
        createdAt: Date.now()
      });
    }

    async trashComment(entityId, commentId) {
      const comment = findComment(commentId);
      const canTrash = state.isAdmin
        || comment?.ownerId === state.authUid
        || comment?.clientId === state.profile.clientId;
      if (!this.dbApi || !this.db || !canTrash) return;
      await this.dbApi.update(this.dbApi.ref(this.db, `${this.roomPath}/comments/${commentId}`), {
        deletedAt: Date.now(),
        deletedBy: state.authUid,
        deletedByName: state.profile.displayName
      });
    }

    async restoreComment(entityId, commentId) {
      if (!this.dbApi || !this.db || !state.isAdmin) return;
      await this.dbApi.update(this.dbApi.ref(this.db, `${this.roomPath}/comments/${commentId}`), {
        deletedAt: null,
        deletedBy: null,
        deletedByName: null
      });
    }

    async permanentlyDeleteComment(entityId, commentId) {
      if (!this.dbApi || !this.db || !state.isAdmin) return;
      await this.dbApi.remove(this.dbApi.ref(this.db, `${this.roomPath}/comments/${commentId}`));
      const children = getAllComments().filter((comment) => comment.parentId === commentId);
      await Promise.all(children.map((comment) => this.dbApi.remove(
        this.dbApi.ref(this.db, `${this.roomPath}/comments/${comment.id}`)
      )));
    }

    async addActivity(type, comment) {
      if (!this.dbApi || !this.db) return;
      const id = `${String(Date.now()).padStart(13, "0")}-${crypto.randomUUID()}`;
      const entity = state.entities.get(comment.entityId);
      await this.dbApi.set(this.dbApi.ref(this.db, `${this.roomPath}/activity/${id}`), {
        id,
        type,
        entityId: comment.entityId || null,
        entityLabel: entity?.label || comment.entityId || "Élément",
        commentId: comment.id || null,
        parentId: comment.parentId || null,
        text: comment.text || "",
        actorId: state.authUid,
        actorName: state.profile.displayName,
        actorAvatar: state.profile.avatar,
        actorPhotoURL: state.profile.photoURL || null,
        actorColor: state.profile.color,
        createdAt: Date.now()
      });
    }

    async disconnect() {
      for (const unsubscribe of this.unsubscribers || []) unsubscribe();
      if (this.presenceRef && this.dbApi) await this.dbApi.remove(this.presenceRef);
    }
  }

  return { LocalRealtimeProvider, FirebaseRealtimeProvider };
}

function entityReactionCommentId(entityId) {
  let hash = 0;
  const value = String(entityId || "");
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return `entity-reactions-${Math.abs(hash)}`;
}
