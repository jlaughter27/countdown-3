// Live Transformed Countdown — app.js (clean final)

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

  // —— Elements (HTML must define these; some are optional) ——
  const elDays       = document.getElementById('cd-days');
  const elHH         = document.getElementById('cd-hh');
  const elMM         = document.getElementById('cd-mm');
  const elSS         = document.getElementById('cd-ss');
  const elPercent    = document.getElementById('percentage-lived');
  const elQuote      = document.getElementById('quote');
  const elLocalTime  = document.getElementById('local-time');
  const elSloganDisp = document.getElementById('slogan-display');
  const elSettings   = document.getElementById('settings-dialog');
  const elLovedDlg   = document.getElementById('loved-one-dialog');
  const elLovedList  = document.getElementById('loved-ones-list');
  const addLovedBtn  = document.getElementById('add-loved-one');
  const appMain      = document.getElementById('app-main');
  const bgOverlay    = document.getElementById('bg-overlay');

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
  const loForm   = document.getElementById('loved-one-form');
  const loTitle  = document.getElementById('loved-one-title');
  const loIndex  = document.getElementById('loved-one-index');
  const loName   = document.getElementById('lo-name');
  const loBirth  = document.getElementById('lo-birthdate');
  const loPhoto  = document.getElementById('lo-photo');
  // Optional child fields (only used if present in HTML)
  const loIsChild   = document.getElementById('lo-is-child');
  const loChildOpts = document.getElementById('lo-child-options');
  const loChild18   = document.getElementById('lo-child-18');
  const loChildFull = document.getElementById('lo-child-full');

  // Onboarding dialog (first run)
  const obDlg    = document.getElementById('onboarding');
  const obForm   = document.getElementById('onboarding-form');
  const obBirth  = document.getElementById('ob-birthdate');
  const obLife   = document.getElementById('ob-lifespan');
  const obSlogan = document.getElementById('ob-slogan');

  // —— State ——————————————————————————————————————————————
  let lovedOnes  = load(KEYS.lovedOnes, []);
  let quoteIdx   = 0;
  let quoteTimer = null;
  let activePool = null;
  let last       = { days: null, hh: null, mm: null, ss: null }; // for pulses

  // —— Utils ——————————————————————————————————————————————
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  }
  function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function two(n) { return String(n).padStart(2, '0'); }
  function addYears(date, years) { const d = new Date(date); d.setFullYear(d.getFullYear() + years); return d; }
  function mulberry32(a){return function(){var t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
  function pulse(el){ if (!el) return; el.classList.remove('pulse-soft'); void el.offsetWidth; el.classList.add('pulse-soft'); }

  // —— Service Worker + Local clock ———————————————————————
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
  }
  if (elLocalTime){
    const tickLocalClock = () => { elLocalTime.textContent = new Date().toLocaleTimeString(); };
    setInterval(tickLocalClock, 1000); tickLocalClock();
  }

  // —— Backgrounds (random/solid/images) ————————————————
  async function setBackground(){
    const mode = load(KEYS.bgMode, 'random');
    if (mode === 'solid'){
      const color = load(KEYS.bgColor, '#111111');
      document.body.style.backgroundColor = color;
      if (bgOverlay) bgOverlay.style.backgroundImage = 'none';
      return;
    }
    if (mode === 'images' && window.ltcIDB){
      const keys = await window.ltcIDB.keys();
      if (keys.length){
        const dayIndex = Math.floor(Date.now()/(1000*60*60*24)) % keys.length;
        const blob = await window.ltcIDB.get(keys[dayIndex]);
        if (blob && bgOverlay){
          const url = URL.createObjectURL(blob);
          bgOverlay.style.backgroundImage = `url(${url})`;
          document.body.style.backgroundColor = '#000';
          return;
        }
      }
    }
    // Daily random color via seeded HSL
    const seed = Math.floor(Date.now()/(1000*60*60*24));
    const rng  = mulberry32(seed);
    const hue  = Math.floor(rng()*360);
    document.body.style.backgroundColor = `hsl(${hue} 20% 10%)`;
    if (bgOverlay) bgOverlay.style.backgroundImage = 'none';
  }

  // —— Countdown ————————————————————————————————————————
  function updateCountdown(){
    if (!elDays || !elHH || !elMM || !elSS || !elPercent) return;

    const birth = load(KEYS.birthdate, null);
    const lifespan = load(KEYS.lifespan, null);
    if (!birth || !lifespan){
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

  // —— Quotes (getQuotePool in quotes.js) ———————————————
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
    if (!elQuote || !activePool || !activePool.length) return;
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
    if (load(KEYS.onboarded, false) !== true) return; // wait for onboarding
    if (quoteTimer) clearInterval(quoteTimer);
    const intervalMs = Math.max(10000, (load(KEYS.quoteInterval, 30) * 1000) || 30000);
    setQuote(quoteIdx++);
    quoteTimer = setInterval(() => setQuote(quoteIdx++), intervalMs);
  }
  if (elQuote){
    elQuote.addEventListener('click', () => {
      setQuote(quoteIdx++);
      if (quoteTimer){
        const intervalMs = Math.max(10000, (load(KEYS.quoteInterval, 30) * 1000) || 30000);
        clearInterval(quoteTimer);
        quoteTimer = setInterval(() => setQuote(quoteIdx++), intervalMs);
      }
    });
  }

  // —— Loved ones (with optional child mode) ————————————
  function calcDaysLeft(birthdate, lifespanYears, opts = {}) {
    // opts: { isChild?: boolean, childMode?: "18"|"full" }
    const start = new Date(birthdate);
    let end;
    if (opts.isChild && opts.childMode === '18') {
      end = new Date(start);
      end.setFullYear(end.getFullYear() + 18);
    } else {
      end = addYears(start, lifespanYears);
    }
    const now = new Date();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000*60*60*24)));
  }

  function renderLovedOnes(){
    if (!elLovedList) return;
    elLovedList.innerHTML = "";
    const timers = new Map();

    lovedOnes.slice(0,5).forEach((lo, i) => {
      const li = document.createElement('li');

      const img = document.createElement('img');
      img.className = 'lo-avatar';
      img.alt = '';
      if (lo.photoKey && window.ltcIDB) {
        window.ltcIDB.get(lo.photoKey).then(blob => { if (blob) img.src = URL.createObjectURL(blob); });
      }

      const meta = document.createElement('div');
      meta.className = 'lo-meta';
      const daysLeft = calcDaysLeft(
        lo.birthdate,
        load(KEYS.lifespan, 80),
        { isChild: !!lo.isChild, childMode: lo.childMode || null }
      );

      const labelHTML = (lo.isChild && lo.childMode === '18')
        ? `${lo.name} — ${daysLeft} days left <span class="lo-badge">to 18</span>`
        : `${lo.name} — ${daysLeft} days left`;

      meta.innerHTML = labelHTML;
      meta.title = 'Tap to edit/remove';

      const actions = document.createElement('div');
      actions.className = 'lo-actions';
      const edit = document.createElement('button'); edit.textContent = 'Edit';
      edit.addEventListener('click', (evt) => { evt.stopPropagation(); openLovedOneEditor(i); });
      const del  = document.createElement('button'); del.textContent  = 'Remove';
      del.addEventListener('click', (evt) => { evt.stopPropagation(); lovedOnes.splice(i,1); saveLovedOnes(); });
      actions.append(edit, del);

      // Show actions for 5s when name is clicked
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

    if (addLovedBtn) addLovedBtn.style.display = lovedOnes.length >= 5 ? 'none' : 'inline-block';
  }

  function openLovedOneEditor(index=null){
    if (!loForm || !elLovedDlg) return;
    loForm.reset();

    // If child controls exist, reset defaults
    if (loIsChild && loChildOpts && loChild18 && loChildFull) {
      loIsChild.checked = false;
      loChildOpts.disabled = true;
      loChild18.checked = true;
    }

    if (index !== null) {
      loIndex.value = String(index);
      loTitle.textContent = "Edit Loved One";
      const lo = lovedOnes[index];
      loName.value = lo.name || "";
      if (lo.birthdate) loBirth.value = lo.birthdate;

      if (loIsChild && loChildOpts && loChild18 && loChildFull) {
        loIsChild.checked = !!lo.isChild;
        loChildOpts.disabled = !loIsChild.checked;
        if (lo.isChild) (lo.childMode === 'full' ? loChildFull : loChild18).checked = true;
      }
    } else {
      loIndex.value = "";
      loTitle.textContent = "Add Loved One";
    }

    elLovedDlg.showModal();
  }

  if (loIsChild && loChildOpts) {
    loIsChild.addEventListener('change', () => { loChildOpts.disabled = !loIsChild.checked; });
  }
  if (addLovedBtn) addLovedBtn.addEventListener('click', () => openLovedOneEditor(null));

  if (loForm) {
    loForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (e.submitter && e.submitter.value === 'cancel'){ elLovedDlg.close(); return; }

      const idx   = loIndex.value === "" ? null : Number(loIndex.value);
      const name  = (loName.value || "").trim();
      const birth = loBirth.value;
      if (!name || !birth){ return; }

      let photoKey = null;
      const file = loPhoto && loPhoto.files && loPhoto.files[0];
      if (file && window.ltcIDB){
        photoKey = `lo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await window.ltcIDB.set(photoKey, file);
      }

      let isChild = false, childMode = null;
      if (loIsChild && loChild18 && loChildFull) {
        isChild   = !!loIsChild.checked;
        childMode = isChild ? (loChild18.checked ? '18' : 'full') : null;
      }

      const newObj = { name, birthdate: birth, photoKey, isChild, childMode };

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
  }

  function saveLovedOnes(){
    save(KEYS.lovedOnes, lovedOnes);
    renderLovedOnes();
  }

  // —— Settings ————————————————————————————————————————————
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      if (!elSettings) return;
      // Populate settings from storage ONLY if present
      if (birthInput)  birthInput.value  = load(KEYS.birthdate, "") || "";
      if (lifeInput)   lifeInput.value   = load(KEYS.lifespan, "") || "";
      if (sloganInput) sloganInput.value = load(KEYS.slogan, "") || "";
      if (ttsInput)    ttsInput.checked  = !!load(KEYS.tts, false);
      if (qIntInput)   qIntInput.value   = load(KEYS.quoteInterval, 30);

      const cat = load(KEYS.quoteCategory, 'mixed');
      if (catBible) catBible.checked = cat === 'bible';
      if (catMot)   catMot.checked   = cat === 'motivational';
      if (catTheo)  catTheo.checked  = cat === 'theologians';
      if (catMixed) catMixed.checked = cat === 'mixed';

      const mode = load(KEYS.bgMode, 'random');
      if (bgRandom) bgRandom.checked = mode === 'random';
      if (bgSolid)  bgSolid.checked  = mode === 'solid';
      if (bgImages) bgImages.checked = mode === 'images';
      if (bgColor)  bgColor.value    = load(KEYS.bgColor, '#111111');

      elSettings.showModal();
    });
  }

  if (saveSettings) {
    saveSettings.addEventListener('click', async () => {
      if (birthInput && birthInput.value) save(KEYS.birthdate, birthInput.value);
      if (lifeInput && lifeInput.value)   save(KEYS.lifespan, Math.max(1, Math.min(130, parseInt(lifeInput.value,10))));

      const s = (sloganInput && sloganInput.value || "").trim();
      save(KEYS.slogan, s);
      if (elSloganDisp) elSloganDisp.textContent = s;

      if (ttsInput) save(KEYS.tts, !!ttsInput.checked);

      const qi = Math.max(10, Math.min(600, parseInt(qIntInput && qIntInput.value,10) || 30));
      save(KEYS.quoteInterval, qi);

      const cat =
        (catBible && catBible.checked) ? 'bible' :
        (catMot   && catMot.checked)   ? 'motivational' :
        (catTheo  && catTheo.checked)  ? 'theologians' : 'mixed';
      save(KEYS.quoteCategory, cat);
      activePool = (typeof getQuotePool === 'function') ? getQuotePool(cat) : [];
      startQuoteRotation();

      const mode = (bgRandom && bgRandom.checked) ? 'random' : (bgSolid && bgSolid.checked) ? 'solid' : 'images';
      save(KEYS.bgMode, mode);
      if (bgColor) save(KEYS.bgColor, bgColor.value);
      await setBackground();

      elSettings.close();
      updateCountdown();
      renderLovedOnes();
    });
  }

  // Background uploads → store blobs in IndexedDB
  if (bgUpload && window.ltcIDB) {
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
  }

  // Backup / restore
  if (exportBtn) {
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
  }
  if (importInput) {
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
  }

  // —— Onboarding gate ————————————————————————————————————
  async function startAppIfReady(){
    const b = load(KEYS.birthdate, null);
    const l = load(KEYS.lifespan, null);
    const onboarded = load(KEYS.onboarded, false);

    if (b && l && onboarded){
      if (appMain) appMain.hidden = false;
      const s = load(KEYS.slogan, "");
      if (elSloganDisp) elSloganDisp.textContent = s || "";
      const cat = load(KEYS.quoteCategory, 'mixed');
      activePool = (typeof getQuotePool === 'function') ? getQuotePool(cat) : [];
      await setBackground();
      renderLovedOnes();
      updateCountdown();
      startQuoteRotation();
    } else {
      if (appMain) appMain.hidden = true;
      if (obDlg && typeof obDlg.showModal === 'function') obDlg.showModal();
    }
  }

  if (obForm) {
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
  }

  // —— Init ———————————————————————————————————————————————
  renderLovedOnes();
  setBackground();
  startAppIfReady();
})();
