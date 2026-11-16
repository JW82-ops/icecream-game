/* ===== 소리 · 음악 · 목소리 (v1.1) ===== */
const Sound = (() => {
  let ctx = null, master = null, musicBus = null, sfxBus = null, reverb = null, revSend = null, noiseBuf = null;
  let sfxOn = true, musicOn = true, voiceOn = true;
  let track = null, wantTrack = 'shop', timer = null, step = 0, nextT = 0;

  function makeImpulse(sec = 2.2, decay = 3) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return ctx; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.7;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
      reverb = ctx.createConvolver(); reverb.buffer = makeImpulse();
      revSend = ctx.createGain(); revSend.gain.value = 0.28; revSend.connect(reverb); reverb.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.16; musicBus.connect(master); musicBus.connect(revSend);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
      const sfxRev = ctx.createGain(); sfxRev.gain.value = 0.12; sfxBus.connect(sfxRev); sfxRev.connect(revSend);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }
  const N = (n) => 440 * Math.pow(2, (n - 69) / 12);

  /* ---- 악기 ---- */
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function osc(type, f, t, dur, vol, dest, a = 0.005, detune = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    env(g, t, a, vol, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + a + dur + 0.05); return o;
  }
  function musicBox(n, t, vol = 0.5) { const f = N(n); osc('sine', f, t, 0.9, vol, musicBus); osc('triangle', f * 2, t, 0.35, vol * 0.25, musicBus); osc('sine', f * 4.01, t, 0.12, vol * 0.08, musicBus); }
  function pluck(n, t, vol = 0.5, dur = 0.35) { const f = N(n); const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.setValueAtTime(2200, t); lp.frequency.exponentialRampToValueAtTime(400, t + dur);
    env(g, t, 0.004, vol, dur); o.connect(lp); lp.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.1); }
  function pad(notes, t, dur, vol = 0.12) {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.25); g.gain.setValueAtTime(vol, t + dur - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); g.connect(musicBus);
    notes.forEach(n => [-7, 7].forEach(dt => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = N(n); o.detune.value = dt; const og = ctx.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.05); }));
  }
  function noise(t, dur, vol, type, freq, dest) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = ctx.createGain();
    env(g, t, 0.002, vol, dur); s.connect(f); f.connect(g); g.connect(dest || musicBus); s.start(t); s.stop(t + dur + 0.05);
  }
  function kick(t, vol = 0.9) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); env(g, t, 0.002, vol, 0.18); o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.25); }
  function hat(t, vol = 0.18) { noise(t, 0.04, vol, 'highpass', 7500); }
  function clap(t, vol = 0.3) { noise(t, 0.09, vol, 'bandpass', 1600); }
  function bell(n, t, vol = 0.4, dest) { const f = N(n); [1, 2.76, 5.4].forEach((m, i) => osc('sine', f * m, t, [1.2, 0.5, 0.2][i], vol * [1, 0.35, 0.15][i], dest || sfxBus)); }

  /* ---- 노래 ---- */
  const _ = null;
  const SONGS = {
    shop: { bpm: 116, beats: 8, chords: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]], roots: [48, 43, 45, 41],
      mel: [[76, _, 79, 76, 72, _, 74, 76], [74, _, 71, 74, 79, _, 77, 74], [72, _, 76, 81, 79, 76, 72, _], [77, 76, 74, 72, 74, _, _, _],
            [79, 79, 81, 79, 76, _, 72, 74], [74, 76, 74, 71, 67, _, 71, 74], [72, 76, 79, 84, 83, 81, 79, 76], [77, _, 76, _, 72, _, _, _]],
      drums: true },
    hub: { bpm: 92, beats: 6, chords: [[65, 69, 72], [64, 67, 72], [62, 65, 69], [62, 65, 70]], roots: [41, 48, 50, 46],
      mel: [[77, _, 81, _, 84, _], [79, _, 76, _, 72, _], [74, _, 77, 81, 79, 77], [74, _, _, 77, 76, _],
            [81, _, 79, _, 77, _], [76, _, 79, _, 84, _], [86, 84, 81, _, 77, _], [79, _, _, _, 77, _]], arp: true },
    title: { bpm: 124, beats: 8, chords: [[67, 71, 74], [66, 69, 74], [64, 67, 71], [64, 67, 72]], roots: [43, 50, 40, 48],
      mel: [[79, 83, 86, 83, 79, _, 81, 83], [81, _, 78, 81, 86, _, 84, 81], [79, 83, 88, 86, 83, 79, 76, _], [76, 79, 84, 83, 81, _, 79, _]],
      drums: true, light: true },
  };
  function schedule() {
    if (!track) return;
    const song = SONGS[track]; const spb = 60 / song.bpm / 2; // 8분음표
    while (nextT < ctx.currentTime + 0.5) {
      const bars = song.mel.length; const beat = step % song.beats; const bar = Math.floor(step / song.beats) % bars; const ci = bar % 4;
      const m = song.mel[bar][beat]; if (m) musicBox(m, nextT, 0.42);
      if (beat === 0) { pad(song.chords[ci], nextT, spb * song.beats, 0.07); pluck(song.roots[ci], nextT, 0.55, 0.4); }
      if (song.beats === 8 && beat === 4) pluck(song.roots[ci] + 7, nextT, 0.4, 0.3);
      if (song.beats === 8 && beat === 6) pluck(song.roots[ci] + 12, nextT, 0.35, 0.25);
      if (song.arp && beat % 1 === 0 && beat > 0) pluck(song.chords[ci][beat % 3] - 12 + (beat > 3 ? 12 : 0), nextT, 0.22, 0.3);
      if (song.drums) { if (beat === 0 || beat === 4) kick(nextT, song.light ? 0.6 : 0.8); if (beat % 2 === 1) hat(nextT); if (beat === 2 || beat === 6) clap(nextT, 0.16); }
      nextT += spb; step++;
    }
    timer = setTimeout(schedule, 120);
  }
  function music(name) {
    wantTrack = name || wantTrack;
    if (!musicOn || !ensure()) return;
    if (track === wantTrack) return;
    stopBgm(true);
    track = wantTrack; step = 0; nextT = ctx.currentTime + 0.15;
    musicBus.gain.cancelScheduledValues(ctx.currentTime); musicBus.gain.setValueAtTime(0.0001, ctx.currentTime); musicBus.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.8);
    schedule();
  }
  function stopBgm(keepWant) { clearTimeout(timer); timer = null; track = null; }

  /* ---- 효과음 ---- */
  function sfx(name) {
    if (!sfxOn || !ensure()) return;
    const t = ctx.currentTime;
    switch (name) {
      case 'tap': osc('triangle', 1046, t, 0.07, 0.25, sfxBus); break;
      case 'pop': { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(980, t + 0.09); env(g, t, 0.003, 0.5, 0.12); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2); break; }
      case 'scoop': { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(620, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.15); env(g, t, 0.003, 0.7, 0.16); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.25); noise(t, 0.05, 0.15, 'lowpass', 900, sfxBus); break; }
      case 'plop': { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.1); env(g, t, 0.002, 0.8, 0.12); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2); break; }
      case 'coin': bell(93, t, 0.25); bell(100, t + 0.07, 0.28); break;
      case 'register': noise(t, 0.08, 0.35, 'bandpass', 2500, sfxBus); bell(96, t + 0.07, 0.3); bell(100, t + 0.13, 0.3); break;
      case 'good': [72, 76, 79, 84].forEach((n, i) => { osc('triangle', N(n), t + i * 0.07, 0.25, 0.3, sfxBus); osc('sine', N(n + 12), t + i * 0.07, 0.2, 0.1, sfxBus); }); break;
      case 'bad': osc('triangle', N(64), t, 0.16, 0.3, sfxBus); osc('triangle', N(61), t + 0.15, 0.3, 0.3, sfxBus); break;
      case 'door': bell(88, t, 0.35); bell(84, t + 0.25, 0.35); break;
      case 'level': [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79, 84]].forEach((ch, i) => ch.forEach(n => { osc('sawtooth', N(n), t + i * 0.16, i === 3 ? 0.9 : 0.14, 0.07, sfxBus, 0.01); osc('triangle', N(n + 12), t + i * 0.16, i === 3 ? 0.9 : 0.14, 0.12, sfxBus); })); kick(t + 0.48, 0.6); break;
      case 'quiz': [79, 83, 86, 91].forEach((n, i) => bell(n, t + i * 0.06, 0.18)); break;
      case 'buy': bell(84, t, 0.25); bell(88, t + 0.08, 0.25); bell(91, t + 0.16, 0.3); break;
      case 'sad': { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.5); env(g, t, 0.01, 0.25, 0.5); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.6); break; }
      case 'stamp': kick(t, 0.6); noise(t, 0.06, 0.3, 'lowpass', 1200, sfxBus); break;
      case 'sparkle': [96, 100, 103, 108].forEach((n, i) => bell(n, t + i * 0.045, 0.12)); break;
      case 'shutter': for (let i = 0; i < 14; i++) noise(t + i * 0.07, 0.04, 0.12, 'bandpass', 900 + (i % 2) * 400, sfxBus); break;
      case 'cheer': for (let i = 0; i < 20; i++) noise(t + Math.random() * 0.8, 0.05, 0.12, 'bandpass', 1200 + Math.random() * 1500, sfxBus); [72, 76, 79].forEach((n, i) => bell(n + 12, t + 0.1 + i * 0.1, 0.15)); break;
    }
  }

  /* ---- 목소리 ---- */
  let ttsCap = null; let voices = [];
  const synth = window.speechSynthesis;
  function loadVoices() { try { voices = synth ? synth.getVoices() : []; } catch (e) { voices = []; } }
  if (synth) { loadVoices(); try { synth.onvoiceschanged = loadVoices; } catch (e) {} }
  function pickVoice(lang) {
    const l = lang.toLowerCase();
    return voices.find(v => v.lang && v.lang.toLowerCase() === l && /female|yuna|sora|samantha|google/i.test(v.name))
        || voices.find(v => v.lang && v.lang.toLowerCase().startsWith(l.slice(0, 2)));
  }
  async function say(text, lang = 'ko-KR') {
    if (!voiceOn || !text) return;
    if (synth && voices.length) {
      try { synth.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang; const v = pickVoice(lang); if (v) u.voice = v; u.rate = lang.startsWith('en') ? 0.85 : 1.0; u.pitch = 1.15; synth.speak(u); return; } catch (e) {}
    }
    if (ttsCap) { try { ttsCap.stop(); await ttsCap.speak(text, { language: lang.startsWith('en') ? 'en' : 'ko', voice: 'airy', rate: lang.startsWith('en') ? 0.85 : 1 }); } catch (e) {} }
  }
  function canSpeak() { return !!((synth && voices.length) || ttsCap); }
  function setTts(t) { ttsCap = t; }
  function set(opts) {
    if ('sfx' in opts) sfxOn = opts.sfx;
    if ('music' in opts) { musicOn = opts.music; if (!musicOn) stopBgm(); }
    if ('voice' in opts) voiceOn = opts.voice;
  }
  return { sfx, music, startBgm: () => music(), stopBgm, ensure, say, canSpeak, setTts, set, get musicOn() { return musicOn; } };
})();
