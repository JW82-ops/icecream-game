/* ===== 저장 (기기 + 클로드 계정) ===== */
const Store = (() => {
  const LS = 'subini-icecream-v1:';
  let db = null, uid = null, remoteReady = false;
  const writeTimers = {};
  const lsGet = (k) => { try { const s = localStorage.getItem(LS + k); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} };

  function load(key) { const v = lsGet(key); return v && v.deleted ? null : v; }
  function save(key, obj) {
    obj.savedAt = Date.now();
    lsSet(key, obj);
    if (db && uid) {
      clearTimeout(writeTimers[key]);
      writeTimers[key] = setTimeout(() => {
        db.doc(`data/users/${uid}/saves`).collection('kids').doc(key).set({ json: JSON.stringify(obj), savedAt: obj.savedAt })
          .catch(() => {});
      }, 600);
    }
  }
  // 클로드 계정 저장소 연결 → 더 최신 저장을 가져옴
  async function connect(onUpdate) {
    try {
      if (!window.claude || !window.claude.use) return;
      const [d, u] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!d || !u) return;
      const id = await u.id(); if (!id) return;
      db = d; uid = id;
      const keys = ['jian', 'jia', 'eunbyeol', 'settings'];
      for (const k of keys) {
        try {
          const snap = await db.doc(`data/users/${uid}/saves`).collection('kids').doc(k).get();
          const local = lsGet(k);
          if (snap.exists) {
            const remote = JSON.parse(snap.data().json || 'null');
            if (remote && (!local || (remote.savedAt || 0) > (local.savedAt || 0))) { lsSet(k, remote); onUpdate && onUpdate(k); }
            else if (local && (local.savedAt || 0) > (remote ? remote.savedAt || 0 : 0)) save(k, local);
          } else if (local) save(k, local);
        } catch (e) {}
      }
      remoteReady = true;
    } catch (e) {}
  }
  return { load, save, connect, get remote() { return remoteReady; } };
})();
