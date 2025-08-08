// Live Transformed Countdown — app.js (final)

(() => {
  // —— Storage keys ——————————————————————————————————————
  const KEYS = {
    birthdate: 'ltc.birthdate',
    lifespan: 'ltc.lifespan',
    slogan: 'ltc.slogan',
    tts: 'ltc.tts',
    quoteInterval: 'ltc.quoteInterval',
    lovedOnes: 'ltc.lovedOnes',
    quoteCategory: 'ltc.quoteCategory',
    bgMode: 'ltc.bgMode',
    bgColor: 'ltc.bgColor',
    bgKeys: 'ltc.bgKeys',
    onboarded: 'ltc.onboarded'
  };

  // —— Elements ————————————————————————————————————————
  const elDays = document.getElementById('cd-days');
  const elHH   = document.getElementById('cd-hh');
  const elMM   = document.getElementById('cd-mm');
  const elSS   = document.getElementById('cd-ss');
  const elTimeRow = document.getElementById('cd-time');

  const elPercent   = document.getElementById('percentage-lived');
  const elQuote     = document.getElementById('quote');
  const elLocalTime = document.getElementById('local-time');
  const elSloganDisp= document.getElementById('slogan-display');
  const elSettings  = document.getElementById('settings-dialog');
  const elLovedDlg  = document.getElementById('loved-one-dialog');
  const elLovedList = document.getElementById('loved-ones-list');
  const addLovedBtn = document.getElementById('add-loved-one');
  const appMain     = document.getElementById('app-main');
  const bgOverlay   = document.getElementById('bg-overlay');

  // Settings form
  const openSettingsBtn = document.getElementById('open-settings');
  const birthInput  = document.getElementById('user-birthdate');
  const lifeInput   = document.getElementById('lifespan');
  const sloganInput = document.getElementById('slogan-input');
  const ttsInput    = document.getElementById('tts-enabled');
  const qIntInput   = document.getElementById('quote-interval');
  const catBible    = document.getElementById('cat-bible');
  const catMot      = document.getElementById('cat-motivational');
  const catTheo     = document.getElementById('cat-theologians');
  const catMixed    = document.getElementById('cat-mixed');
  const bgRandom    = document.getElementById('bg-random');
  const bgSolid     = document.getElementById('bg-solid');
  const bgImages    = document.getElementById('bg-images');
  const bgColor     = document.getElementById('bg-color');
  const bgUpload    = document.getElementById('bg-upload');
  const exportBtn   = document.getElementById('export-settings');
  const importInput = document.getElementById('import-settings');
  const saveSettings= document.getElementById('save-settings');

  // Loved one form
  const loForm      = document.getElementById('loved-one-form');
  const loTitle     = document.getElementById('loved-one-title');
  const loIndex     = document.getElementById('loved-one-index');
  const loName      = document.getElementById('lo-name');
  const loBirth     = document.getElementById('lo-birthdate');
  const loPhoto     = document.getElementById('lo-photo');

  // Onboarding
  const obDlg   = document.getElementById('onboarding');
  const obForm  = document.getElementById('onboarding-form');
  const obBirth = document.getElementById('ob-birthdate');
  const obLife  = document.getElementById('ob-lifespan');
  const obSlogan= document.getElementById('ob-slogan');

  // —— State ——————————————————————————————————————————————
  let lovedOnes = load(KEYS.lovedOnes, []);
  let quoteIdx = 0;
  let quoteTimer = null;
  let activePool = null;

  // For pulsing logic
  let last = { days: null, hh: null, mm: null, ss: null };

  // —— Utilities ———————————————————————————————————————
  function load(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  }
  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function two(n) { return String(n).padStart(2, '0'); }
  function addYears(date, years) { const d = new Date(date); d.setFullYear(d.getFullYear() + years); return d; }
  function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

  function pulse(el){
    // uses .pulse-soft class from CSS
    el.classList.remove('pulse-soft'); void el.offsetWidth; el.classList.add('pulse-soft');
  }

  // —— Service Worker & Clock ————————————————————————————
  function registerSW(){
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js');
      });
    }
  }
  function tickLocalClock(){
    elLocalTime.textContent = new Date().toLocaleTimeString();
  }
  setInterval(tickLocalClock, 1000); tickLocalClock();

  // —— Background (random/solid/images) ————————————————
  async function setBackground(){
    const mode = load(KEYS.bgMode, 'random');
    if (mode === 'solid'){
      const color = load(KEYS.bgColor, '#111111');
      document.body.style.backgroundColor = color;
      bgOverlay.style.backgroundImage = 'none';
      return;
    }
    if (mode === 'images'){
      const keys = await window.ltcIDB.keys();
      if (keys.length){
        const dayIndex = Math.floor(Date.now()/(1000*60*60*24)) % keys.length;
        const blob = await window.ltcIDB.get(keys[dayIndex]);
        if (blob){
          const url = URL.createObjectURL(blob);
          bgOverlay.style.backgroundImage = `url(${url})`;
          document.body.style.backgroundColor = '#000';
          return;
        }
      }
    }
    // Daily random color
    const seed = Math.floor(Date.now()/(1000*60*60*24));
    const rng = mulberry32(seed);
    const hue = Math.floor(rng()*360);
    const color = `hsl(${hue} 20% 10%)`;
    document.body.style.backgroundColor = color;
    bgOverlay.style.backgroundImage = 'none';
  }

  // —— Countdown ————————————————————————————————————————
  function updateCountdown(){
    const birth = load(KEYS.birthdate, null);
    const lifespan = load(KEYS.lifespan, null);
    if (!birth || !lifespan){
      // App is gated by onboarding; keep display neutral
      elDays.textContent = '—';
      elHH.textContent = '00';
      elMM.textContent = '00';
      elSS.textContent = '00';
      elPercent.textContent = '';
      return;
    }

    const start = new Date(birth);
    const end   = addYears(start, Number(lifespan));
    const now   = new Date();
    const remaining = Math.max(0, end - now);

    const totalSec = Math.floor(remaining / 1000);
    const days = Math.floor(totalSec / 86400);
    const rem  = totalSec % 86400;
    const hh   = Math.floor(rem / 3600);
    const mm   = Math.floor((rem % 3600) / 60);
    const ss   = rem % 60;

    // Update text
    elDays.textContent = `${days} days`;
    elHH.textContent   = two(hh);
    elMM.textContent   = two(mm);
    elSS.textContent   = two(ss);

    // Subtle, targeted pulse
    if (last.ss !== ss) pulse(elSS);
    if (last.mm !== mm) { pulse(elMM); pulse(elSS); }
    if (last.hh !== hh) { pulse(elHH); pulse(elMM); pulse(elSS); }
    if (last.days !== days) { pulse(elDays); pulse(elHH); pulse(elMM); pulse(elSS); }

    last = { days, hh, mm, ss };

    // % lived
    const total = end - start;
    const elapsed = Math.max(0, now - start);
    const pct = total ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
    elPercent.textContent = `${pct.toFixed(1)}% lived`;
  }
  setInterval(updateCountdown, 1000);
  updateCountdown();

  // —— Quotes (uses getQuotePool from quotes.js) ———————————
  function speak(text){
    if (!load(KEYS.tts, false)) return;
    if (!('speechSynthesis' in window)) return;
    try{
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(text);
      ut.rate = 1; ut.pitch = 1;
      window.speechSynthesis.speak(ut);
    }catch(e){}
  }
  function setQuote(idx){
    if (!activePool || !activePool.length) return;
    const q = activePool[idx % activePool.length] || "";
    elQuote.classList.remove('quote-show');
    elQuote.classList.add('quote-enter');
    setTimeout(() => {
      elQuote.textContent = q;
      elQuote.classList.remove('quote-enter');
      elQuote.classList.add('quote-show');
      speak(q);
    }, 80);
  }
  function startQuoteRotation(){
    // Only once onboarding done
    if (load(KEYS.onboarded, false) !== true) return;
    if (quoteTimer) clearInterval(quoteTimer);
    const intervalMs = Math.max(10000, (load(KEYS.quoteInterval, 30) * 1000) || 30000);
    setQuote(quoteIdx++);
    quoteTimer = setInterval(() => setQuote(quoteIdx++), intervalMs);
  }
  elQuote.addEventListener('click', () => {
    setQuote(quoteIdx++);
    if (quoteTimer){
      const intervalMs = Math.max(10000, (load(KEYS.quoteInterval, 30) * 1000) || 30000);
      clearInterval(quoteTimer);
      quoteTimer = setInterval(() => setQuote(quoteIdx++), intervalMs);
    }
  });

  // —— Loved Ones ————————————————————————————————————————
  function calcDaysLeft(birthdate, lifespanYears){
    const start = new Date(birthdate);
    const end = addYears(start, lifespanYears);
    const now = new Date();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000*60*60*24)));
  }

  function renderLovedOnes(){
    elLovedList.innerHTML = "";
    const timers = new Map(); // per-item hide timers
    lovedOnes.slice(0,5).forEach((lo, i) => {
      const li = document.createElement('li');

      const img = document.createElement('img');
      img.className = 'lo-avatar';
      img.alt = '';
      if (lo.photoKey) {
        window.ltcIDB.get(lo.photoKey).then(blob => {
          if (blob) img.src = URL.createObjectURL(blob);
        });
      }

      const meta = document.createElement('div');
      meta.className = 'lo-meta';
      const daysLeft = calcDaysLeft(lo.birthdate, load(KEYS.lifespan, 80));
      meta.textContent = `${lo.name} — ${daysLeft} days left`;
      meta.title = 'Tap to edit/remove';

      const actions = document.createElement('div');
      actions.className = 'lo-actions'; // hidden by default via CSS
      const edit = document.createElement('button');
      edit.textContent = 'Edit';
      edit.addEventListener('click', (evt) => { evt.stopPropagation(); openLovedOneEditor(i); });
      const del = document.createElement('button');
      del.textContent = 'Remove';
      del.addEventListener('click', (evt) => {
        evt.stopPropagation();
        lovedOnes.splice(i,1);
        saveLovedOnes();
      });
      actions.append(edit, del);

      function revealActions(){
        actions.classList.add('show');
        if (timers.has(i)) clearTimeout(timers.get(i));
        const t = setTimeout(() => actions.classList.remove('show'), 5000);
        timers.set(i, t);
      }
      meta.addEventListener('click', revealActions);

      li.append(img, meta, actions);
      elLovedList.append(li);
    });
    addLovedBtn.style.display = lovedOnes.length >= 5 ? 'none' : 'inline-block';
  }

  function openLovedOneEditor(index=null){
    loForm.reset();
    if (index !== null) {
      loIndex.value = String(index);
      loTitle.textContent = "Edit Loved One";
      const lo = lovedOnes[index];
      loName.value = lo.name || "";
      if (lo.birthdate) loBirth.value = lo.birthdate;
    } else {
      loIndex.value = "";
      loTitle.textContent = "Add Loved One";
    }
    elLovedDlg.showModal();
  }

  addLovedBtn.addEventListener('click', () => openLovedOneEditor(null));

  loForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.submitter && e.submitter.value === 'cancel'){ elLovedDlg.close(); return; }
    const idx = loIndex.value === "" ? null : Number(loIndex.value);
    const name = loName.value.trim();
    const birth = loBirth.value;
    if (!name || !birth){ return; }

    let photoKey = null;
    const file = loPhoto.files && loPhoto.files[0];
    if (file){
      photoKey = `lo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await window.ltcIDB.set(photoKey, file);
    }
    const newObj = { name, birthdate: birth, photoKey };
    if (idx === null){
      if (lovedOnes.length >= 5) return;
      lovedOnes.push(newObj);
    } else {
      const prev = lovedOnes[idx];
      lovedOnes[idx] = { ...prev, ...newObj, photoKey: photoKey || prev.photoKey };
    }
    saveLovedOnes();
    elLovedDlg.close();
  });

  function saveLovedOnes(){
    save(KEYS.lovedOnes, lovedOnes);
    renderLovedOnes();
  }

  // —— Settings ————————————————————————————————————————————
  openSettingsBtn.addEventListener('click', () => {
    // Populate settings from storage ONLY if present
    birthInput.value = load(KEYS.birthdate, "") || "";
    lifeInput.value  = load(KEYS.lifespan, "") || "";
    sloganInput.value= load(KEYS.slogan, "") || "";
    ttsInput.checked = !!load(KEYS.tts, false);
    qIntInput.value  = load(KEYS.quoteInterval, 30);

    const cat = load(KEYS.quoteCategory, 'mixed');
    catBible.checked = cat === 'bible';
    catMot.checked   = cat === 'motivational';
    catTheo.checked  = cat === 'theologians';
    catMixed.checked = cat === 'mixed';

    const mode = load(KEYS.bgMode, 'random');
    bgRandom.checked = mode === 'random';
    bgSolid.checked  = mode === 'solid';
    bgImages.checked = mode === 'images';
    bgColor.value    = load(KEYS.bgColor, '#111111');

    elSettings.showModal();
  });

  saveSettings.addEventListener('click', async () => {
    const b = birthInput.value;
    const l = lifeInput.value;
    if (b) save(KEYS.birthdate, b);
    if (l) save(KEYS.lifespan, Math.max(1, Math.min(130, parseInt(l,10))));

    const s = (sloganInput.value || "").trim();
    save(KEYS.slogan, s);
    elSloganDisp.textContent = s;

    save(KEYS.tts, !!ttsInput.checked);

    const qi = Math.max(10, Math.min(600, parseInt(qIntInput.value,10) || 30));
    save(KEYS.quoteInterval, qi);

    const cat = catBible.checked ? 'bible' : catMot.checked ? 'motivational' : catTheo.checked ? 'theologians' : 'mixed';
    save(KEYS.quoteCategory, cat);
    activePool = getQuotePool(cat);
    startQuoteRotation();

    const mode = bgRandom.checked ? 'random' : bgSolid.checked ? 'solid' : 'images';
    save(KEYS.bgMode, mode);
    save(KEYS.bgColor, bgColor.value);
    await setBackground();

    elSettings.close();
    updateCountdown();
    renderLovedOnes();
  });

  // Background uploads → store blobs in IndexedDB
  bgUpload.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []).slice(0,5);
    const keys = [];
    for (const f of files){
      const key = `bg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await window.ltcIDB.set(key, f);
      keys.push(key);
    }
    save(KEYS.bgKeys, keys);
  });

  // Backup / restore
  exportBtn.addEventListener('click', async () => {
    const data = {};
    Object.keys(KEYS).forEach(k => data[k] = load(KEYS[k], null));
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ltc-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try{
      const data = JSON.parse(text);
      Object.keys(KEYS).forEach(k => {
        if (k in data && data[k] !== undefined) localStorage.setItem(KEYS[k], JSON.stringify(data[k]));
      });
      location.reload();
    }catch{}
  });

  // —— Onboarding gate ————————————————————————————————————
  async function startAppIfReady(){
    const b = load(KEYS.birthdate, null);
    const l = load(KEYS.lifespan, null);
    const onboarded = load(KEYS.onboarded, false);

    if (b && l && onboarded){
      appMain.hidden = false;
      // Slogan
      const s = load(KEYS.slogan, "");
      elSloganDisp.textContent = s || "";
      // Quotes category/pool
      const cat = load(KEYS.quoteCategory, 'mixed');
      activePool = getQuotePool(cat);
      // Background
      await setBackground();
      // Kick features
      renderLovedOnes();
      updateCountdown();
      startQuoteRotation();
    } else {
      appMain.hidden = true;
      obDlg.showModal();
    }
  }

  obForm.addEventListener('submit', (e) => {
    if (e.submitter && e.submitter.value === 'start'){
      if (!obBirth.value || !obLife.value) { e.preventDefault(); return; }
      save(KEYS.birthdate, obBirth.value);
      save(KEYS.lifespan, Math.max(1, Math.min(130, parseInt(obLife.value,10))));
      const s = (obSlogan.value || "").trim();
      save(KEYS.slogan, s);
      save(KEYS.onboarded, true);
    }
  });

  // —— Init ———————————————————————————————————————————————
  renderLovedOnes();
  setBackground();
  registerSW();
  startAppIfReady();
})();
  function tickLocalClock(){
    elLocalTime.textContent = new Date().toLocaleTimeString();
  }
  setInterval(tickLocalClock, 1000); tickLocalClock();

  function load(key, fallback){
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

  // Defaults
  const defaultBirth = load(KEYS.birthdate, null);
  const defaultLifeYears = load(KEYS.lifespan, 80);
  const defaultSlogan = load(KEYS.slogan, 'live like it matters');
  const defaultTTS = load(KEYS.tts, false);
  const defaultQInt = load(KEYS.quoteInterval, 30);
  const defaultCat = load(KEYS.quoteCategory, 'mixed');
  const defaultBgMode = load(KEYS.bgMode, 'random');
  const defaultBgColor = load(KEYS.bgColor, '#111111');

  // Seed UI
  if (defaultBirth) birthInput.value = defaultBirth;
  lifeInput.value = defaultLifeYears;
  sloganInput.value = defaultSlogan;
  ttsInput.checked = !!defaultTTS;
  qIntInput.value = defaultQInt;
  elSloganDisp.textContent = defaultSlogan;

  // FIX: explicit radio selection
  catBible.checked = defaultCat === 'bible';
  catMot.checked = defaultCat === 'motivational';
  catTheo.checked = defaultCat === 'theologians';
  catMixed.checked = defaultCat === 'mixed';

  bgColor.value = defaultBgColor;
  bgRandom.checked = defaultBgMode === 'random';
  bgSolid.checked = defaultBgMode === 'solid';
  bgImages.checked = defaultBgMode === 'images';

  // Background
  async function setBackground(){
    const mode = load(KEYS.bgMode, 'random');
    if (mode === 'solid'){
      const color = load(KEYS.bgColor, '#111111');
      document.body.style.backgroundColor = color;
      bgOverlay.style.backgroundImage = 'none';
      return;
    }
    if (mode === 'images'){
      const keys = await window.ltcIDB.keys();
      if (keys.length){
        const dayIndex = Math.floor(Date.now()/(1000*60*60*24)) % keys.length;
        const blob = await window.ltcIDB.get(keys[dayIndex]);
        if (blob){
          const url = URL.createObjectURL(blob);
          bgOverlay.style.backgroundImage = `url(${url})`;
          document.body.style.backgroundColor = '#000';
          return;
        }
      }
    }
    const seed = Math.floor(Date.now()/(1000*60*60*24));
    const rng = mulberry32(seed);
    const hue = Math.floor(rng()*360);
    const color = `hsl(${hue} 20% 10%)`;
    document.body.style.backgroundColor = color;
    bgOverlay.style.backgroundImage = 'none';
  }
  function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

  // Countdown
  function addYears(date, years){ const d = new Date(date); d.setFullYear(d.getFullYear()+years); return d; }
  function percentLived(birth, lifespanYears){
    const start = new Date(birth);
    const end   = addYears(start, lifespanYears);
    const now   = new Date();
    const total = end - start;
    const elapsed = Math.max(0, now - start);
    const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
    return { pct, end };
  }
  function two(n){ return String(n).padStart(2,'0'); }

  function updateCountdown(){
    const birth = load(KEYS.birthdate, null);
    const lifespan = load(KEYS.lifespan, 80);
    if (!birth){
      elDays.textContent = "Set your birthdate";
      elTime.textContent = "";
      elPercent.textContent = "";
      return;
    }
    const start = new Date(birth);
    const end = addYears(start, lifespan);
    const now = new Date();
    const remaining = Math.max(0, end - now);

    const totalSec = Math.floor(remaining / 1000);
    const days = Math.floor(totalSec / 86400);
    const dayRemainder = totalSec % 86400;
    const hh  = Math.floor(dayRemainder / 3600);
    const mm  = Math.floor((dayRemainder % 3600) / 60);
    const ss  = dayRemainder % 60;

    elDays.textContent  = `${days} days`;
    elTime.textContent  = `${two(hh)}:${two(mm)}:${two(ss)}`;

    if (last.ss !== ss) pulse(elTime);
    if (last.mm !== mm) pulse(elTime);
    if (last.hh !== hh) pulse(elTime);
    if (last.days !== days){ pulse(elDays); pulse(elTime); }
    last = {days, hh, mm, ss};

    const { pct } = percentLived(start, lifespan);
    elPercent.textContent = `${pct.toFixed(1)}% lived`;
  }
  setInterval(updateCountdown, 1000); updateCountdown();
  function pulse(el){ el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }

  // Quotes
  function speak(text){
    if (!load(KEYS.tts, false)) return;
    if (!('speechSynthesis' in window)) return;
    try{
      window.speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(text);
      ut.rate = 1; ut.pitch = 1;
      window.speechSynthesis.speak(ut);
    }catch(e){}
  }
  function setQuote(idx){
    const pool = activePool; if (!pool || !pool.length) return;
    const q = pool[idx % pool.length] || "";
    elQuote.classList.remove('quote-show');
    elQuote.classList.add('quote-enter');
    setTimeout(() => {
      elQuote.textContent = q;
      elQuote.classList.remove('quote-enter');
      elQuote.classList.add('quote-show');
      speak(q);
    }, 80);
  }
  function startQuoteRotation(){
    if (quoteTimer) clearInterval(quoteTimer);
    const intervalMs = Math.max(10000, (load(KEYS.quoteInterval, 30) * 1000) || 30000);
    setQuote(quoteIdx++);
    quoteTimer = setInterval(() => setQuote(quoteIdx++), intervalMs);
  }
  startQuoteRotation();
  elQuote.addEventListener('click', () => {
    setQuote(quoteIdx++);
    if (quoteTimer){
      const intervalMs = Math.max(10000, (load(KEYS.quoteInterval, 30) * 1000) || 30000);
      clearInterval(quoteTimer);
      quoteTimer = setInterval(() => setQuote(quoteIdx++), intervalMs);
    }
  });

  // Loved ones with timed actions
  function renderLovedOnes(){
    elLovedList.innerHTML = "";
    const timers = new Map();
    lovedOnes.slice(0,5).forEach((lo, i) => {
      const li = document.createElement('li');
      const img = document.createElement('img');
      img.className = 'lo-avatar'; img.alt='';
      if (lo.photoKey) {
        window.ltcIDB.get(lo.photoKey).then(blob => { if (blob) img.src = URL.createObjectURL(blob); });
      }
      const meta = document.createElement('div');
      meta.className = 'lo-meta';
      const daysLeft = calcDaysLeft(lo.birthdate, load(KEYS.lifespan, 80));
      meta.textContent = `${lo.name} — ${daysLeft} days left`;

      const actions = document.createElement('div');
      actions.className = 'lo-actions';
      const edit = document.createElement('button'); edit.textContent='Edit';
      edit.addEventListener('click', (evt) => { evt.stopPropagation(); openLovedOneEditor(i); });
      const del = document.createElement('button'); del.textContent='Remove';
      del.addEventListener('click', (evt) => { evt.stopPropagation(); lovedOnes.splice(i,1); saveLovedOnes(); });

      actions.append(edit, del);

      function revealActions(){
        actions.classList.add('show');
        if (timers.has(i)) clearTimeout(timers.get(i));
        const t = setTimeout(() => actions.classList.remove('show'), 5000);
        timers.set(i, t);
      }
      meta.addEventListener('click', revealActions);
      meta.title = 'Tap to edit/remove';

      li.append(img, meta, actions);
      elLovedList.append(li);
    });
    addLovedBtn.style.display = lovedOnes.length >= 5 ? 'none' : 'inline-block';
  }
  function calcDaysLeft(birthdate, lifespanYears){
    const start = new Date(birthdate); const end = addYears(start, lifespanYears);
    const now = new Date(); const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000*60*60*24)));
  }
  function openLovedOneEditor(index=null){
    loForm.reset();
    if (index !== null) {
      loIndex.value = String(index); loTitle.textContent = "Edit Loved One";
      const lo = lovedOnes[index]; loName.value = lo.name || ""; if (lo.birthdate) loBirth.value = lo.birthdate;
    } else { loIndex.value = ""; loTitle.textContent = "Add Loved One"; }
    elLovedDlg.showModal();
  }
  addLovedBtn.addEventListener('click', () => openLovedOneEditor(null));
  loForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.submitter && e.submitter.value === 'cancel'){ elLovedDlg.close(); return; }
    const idx = loIndex.value === "" ? null : Number(loIndex.value);
    const name = loName.value.trim(); const birth = loBirth.value;
    if (!name || !birth){ return; }
    let photoKey = null; const file = loPhoto.files && loPhoto.files[0];
    if (file){ photoKey = `lo-${Date.now()}-${Math.random().toString(36).slice(2)}`; await window.ltcIDB.set(photoKey, file); }
    const newObj = { name, birthdate: birth, photoKey };
    if (idx === null){
      if (lovedOnes.length >= 5) return; lovedOnes.push(newObj);
    } else { const prev = lovedOnes[idx]; lovedOnes[idx] = { ...prev, ...newObj, photoKey: photoKey || prev.photoKey }; }
    saveLovedOnes(); elLovedDlg.close();
  });
  function saveLovedOnes(){ save(KEYS.lovedOnes, lovedOnes); renderLovedOnes(); }

  // Settings open/save
  openSettingsBtn.addEventListener('click', () => {
    birthInput.value = load(KEYS.birthdate, birthInput.value || "");
    lifeInput.value = load(KEYS.lifespan, parseInt(lifeInput.value,10) || 80);
    sloganInput.value = load(KEYS.slogan, sloganInput.value || "");
    ttsInput.checked = !!load(KEYS.tts, false);
    qIntInput.value = load(KEYS.quoteInterval, parseInt(qIntInput.value,10) || 30);
    const cat = load(KEYS.quoteCategory, 'mixed');
    catBible.checked = cat==='bible'; catMot.checked = cat==='motivational'; catTheo.checked = cat==='theologians'; catMixed.checked = cat==='mixed';
    const mode = load(KEYS.bgMode, 'random');
    bgRandom.checked = mode==='random'; bgSolid.checked = mode==='solid'; bgImages.checked = mode==='images';
    bgColor.value = load(KEYS.bgColor, '#111111');
    elSettings.showModal();
  });
  saveSettings.addEventListener('click', async () => {
    const b = birthInput.value; if (b) save(KEYS.birthdate, b);
    const life = Math.max(1, Math.min(130, parseInt(lifeInput.value,10) || 80)); save(KEYS.lifespan, life);
    const s = (sloganInput.value || "").trim(); save(KEYS.slogan, s || "live like it matters"); elSloganDisp.textContent = s || "live like it matters";
    save(KEYS.tts, !!ttsInput.checked);
    const qi = Math.max(10, Math.min(600, parseInt(qIntInput.value,10) || 30)); save(KEYS.quoteInterval, qi);
    const cat = catBible.checked ? 'bible' : catMot.checked ? 'motivational' : catTheo.checked ? 'theologians' : 'mixed'; save(KEYS.quoteCategory, cat);
    activePool = getQuotePool(cat); startQuoteRotation();
    const mode = bgRandom.checked ? 'random' : bgSolid.checked ? 'solid' : 'images'; save(KEYS.bgMode, mode); save(KEYS.bgColor, bgColor.value);
    await setBackground();
    elSettings.close(); updateCountdown(); renderLovedOnes();
  });

  // Init
  renderLovedOnes(); setBackground(); registerSW();
})();
