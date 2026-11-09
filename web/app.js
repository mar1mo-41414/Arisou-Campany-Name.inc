/* Arisou-Campany-Name.inc — UI の動作。生成そのものは generator.js が行う。 */
(function () {
  'use strict';

  const G = window.ArisouCompanyName;
  const $ = (sel, base) => (base || document).querySelector(sel);
  const $$ = (sel, base) => Array.from((base || document).querySelectorAll(sel));

  const form = $('#rules');
  const resultsEl = $('#results');
  const warnEl = $('#warn');
  const hintEl = $('#gen-hint');
  const seedInput = $('#seed');
  const seedline = $('#seedline');
  const seedShown = $('#seed-shown');
  const posField = $('#pos-field');
  const toastEl = $('#toast');

  const PRESETS = {
    shoji: { scripts: ['kanji'], industries: ['trade', 'manufacturing', 'construction', 'finance'], length: { min: 3, max: 7 }, corp: 'kabushiki', digits: false },
    it: { scripts: ['kanji', 'katakana', 'english'], industries: ['it'], length: { min: 3, max: 8 }, corp: 'kabushiki', digits: false },
    global: { scripts: ['katakana', 'english'], industries: ['holding', 'it', 'logistics'], length: { min: 4, max: 10 }, corp: 'kabushiki', digits: false },
    soft: { scripts: ['hiragana', 'katakana'], industries: ['service', 'media', 'medical'], length: { min: 2, max: 6 }, corp: 'godo', digits: false }
  };

  // --- チップ（チェックボックス / ラジオ）の見た目を input と同期させる ---------
  function syncChips() {
    $$('.chip input').forEach((input) => {
      const chip = input.closest('.chip');
      if (chip) chip.classList.toggle('on', input.checked);
    });
  }

  form.addEventListener('change', (ev) => {
    syncChips();
    updatePosVisibility();
    updateHint();
  });

  // --- 文字種 -----------------------------------------------------------------
  function setScripts(list) {
    $$('input[name="script"]').forEach((i) => { i.checked = list.indexOf(i.value) >= 0; });
    syncChips();
    updateHint();
  }

  function getScripts() {
    return $$('input[name="script"]').filter((i) => i.checked).map((i) => i.value);
  }

  // テキスト入力で Enter を押したときの意図しない送信（ページ再読み込み）を止めて生成する
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    doGenerate();
  });

  $$('#presets .chip').forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(PRESETS[btn.dataset.preset]));
  });

  function applyPreset(p) {
    if (!p) return;
    setScripts(p.scripts);
    $('#len-min').value = p.length.min;
    $('#len-max').value = p.length.max;
    $('#corp').value = p.corp;
    $$('input[name="corpPos"]').forEach((i) => { i.checked = i.value === 'auto'; });
    $$('input[name="digits"]').forEach((i) => { i.checked = !!p.digits; });
    if (p.industries === null) {
      setIndustryMode('all');
    } else if (p.industries.length === 0) {
      setIndustryMode('none');
    } else {
      setIndustryMode('some', p.industries);
    }
    syncChips();
    updatePosVisibility();
    updateHint();
    toast('プリセットを適用しました');
  }

  // --- 業種 -------------------------------------------------------------------
  const industryChips = $('#chips-industry');
  G.INDUSTRIES.forEach((ind) => {
    const label = document.createElement('label');
    label.className = 'chip';
    label.dataset.value = ind.id;
    label.innerHTML = '<input type="checkbox" name="industry" value="' + ind.id + '"><span class="box"></span>' +
      ind.label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    industryChips.appendChild(label);
  });

  // 業種の選択状態は dataset.mode で持つ。
  //   all  … 未選択（すべての業種から接尾辞を選ぶ）
  //   none … 業種接尾辞を付けない
  //   some … 選んだ業種だけ
  function setIndustryMode(mode, list) {
    industryChips.dataset.mode = mode;
    const allowed = list || [];
    $$('input[name="industry"]').forEach((i) => {
      i.checked = mode === 'some' && allowed.indexOf(i.value) >= 0;
    });
    // 「全部」「接尾辞なし」はチェックボックスが全部オフになるので、
    // どちらのモードなのかをボタン側の見た目で示す。
    const allBtn = $('#industry-all');
    const noneBtn = $('#industry-none');
    allBtn.classList.toggle('on', mode === 'all');
    noneBtn.classList.toggle('on', mode === 'none');
    allBtn.setAttribute('aria-pressed', mode === 'all' ? 'true' : 'false');
    noneBtn.setAttribute('aria-pressed', mode === 'none' ? 'true' : 'false');
    syncChips();
  }

  function getIndustries() {
    const mode = industryChips.dataset.mode;
    if (mode === 'none') return [];
    if (mode !== 'some') return null;
    const checked = $$('input[name="industry"]').filter((i) => i.checked).map((i) => i.value);
    return checked.length === 0 ? null : checked;
  }

  $('#industry-all').addEventListener('click', () => {
    setIndustryMode('all');
    updateHint();
  });

  $('#industry-none').addEventListener('click', () => {
    setIndustryMode('none');
    updateHint();
  });

  // 業種チップを直接触ったら mode を切り替える（選択が残っていれば some、全部外れたら all）
  industryChips.addEventListener('change', () => {
    const checked = $$('input[name="industry"]').some((i) => i.checked);
    setIndustryMode(checked ? 'some' : 'all');
    updateHint();
  });

  // --- 法人種別 ---------------------------------------------------------------
  function updatePosVisibility() {
    const isKK = $('#corp').value === 'kabushiki';
    posField.style.display = isKK ? '' : 'none';
  }

  function getCorpPos() {
    const checked = $('input[name="corpPos"]:checked');
    return checked ? checked.value : 'auto';
  }

  // --- 条件の読み取り ---------------------------------------------------------
  function readOptions(overrides) {
    const scripts = {};
    const list = getScripts();
    list.forEach((s) => { scripts[s] = true; });

    let lenMin = parseInt($('#len-min').value, 10);
    let lenMax = parseInt($('#len-max').value, 10);
    if (!Number.isFinite(lenMin) || lenMin < 1) lenMin = 1;
    if (!Number.isFinite(lenMax) || lenMax < 1) lenMax = lenMin;
    if (lenMax < lenMin) lenMax = lenMin;

    let count = parseInt($('#count').value, 10);
    if (!Number.isFinite(count) || count < 1) count = 1;
    if (count > 50) count = 50;

    const industries = getIndustries();

    return Object.assign({
      scripts: scripts,
      digits: $('input[name="digits"]').checked,
      length: { min: lenMin, max: lenMax },
      corp: $('#corp').value,
      corpPosition: getCorpPos(),
      industries: industries,
      count: count,
      seed: seedInput.value.trim() || null
    }, overrides || {});
  }

  function updateHint() {
    const scripts = getScripts();
    if (scripts.length === 0) {
      hintEl.textContent = '文字種を1つ以上選んでください';
      return;
    }
    hintEl.textContent = '';
  }

  // --- 生成 -------------------------------------------------------------------
  let last = null;

  function render(data) {
    resultsEl.innerHTML = '';
    const frag = document.createDocumentFragment();

    data.results.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.animationDelay = Math.min(i * 18, 260) + 'ms';

      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = String(i + 1);

      const body = document.createElement('div');
      body.className = 'body';

      const name = document.createElement('div');
      name.className = 'name';
      if (r.position === 'prefix' && r.core) {
        const corpLabel = r.full.slice(0, r.full.length - r.core.length);
        const corp = document.createElement('span');
        corp.className = 'corp';
        corp.textContent = corpLabel;
        name.appendChild(corp);
      }
      name.appendChild(document.createTextNode(r.core || r.full));
      if (r.position === 'suffix' && r.core) {
        const corp = document.createElement('span');
        corp.className = 'corp';
        corp.textContent = r.full.slice(r.core.length);
        name.appendChild(corp);
      }

      const meta = document.createElement('div');
      meta.className = 'meta';
      const read = document.createElement('span');
      read.className = 'read';
      read.textContent = r.read || '—';
      meta.appendChild(read);

      const len = document.createElement('span');
      len.className = 'len';
      len.textContent = r.length + '文字';
      meta.appendChild(len);

      (r.tags || []).forEach((t) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.textContent = t;
        meta.appendChild(tag);
      });

      body.appendChild(name);
      body.appendChild(meta);

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'small ghost';
      copy.textContent = 'コピー';
      copy.addEventListener('click', () => copyText(r.full, 'コピーしました: ' + r.full));

      card.appendChild(num);
      card.appendChild(body);
      card.appendChild(copy);
      frag.appendChild(card);
    });

    if (data.results.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = '<strong>生成できませんでした。</strong><br>文字種と文字数の条件をゆるめてみてください。';
      frag.appendChild(empty);
    }

    resultsEl.appendChild(frag);

    if (data.unmetLength) {
      showWarn('この条件では文字数に収まる名前が作れませんでした。条件に一番近いものを表示しています。');
    } else {
      showWarn('');
    }

    seedline.hidden = false;
    seedShown.textContent = data.seed;
  }

  function showWarn(msg) {
    warnEl.textContent = msg;
    warnEl.classList.toggle('show', !!msg);
  }

  function doGenerate() {
    const opts = readOptions();
    if (getScripts().length === 0) {
      showWarn('文字種を1つ以上選んでください。');
      updateHint();
      return;
    }
    // 入力欄が空なら毎回あたらしいシードで振る（押すたびに違う名前が出る）。
    // 入力欄に値があるときは、そのシードを固定で使う（同じ結果を再現できる）。
    if (!opts.seed) opts.seed = randomSeed();
    const data = G.generateNames(opts);
    last = { opts: opts, data: data };
    render(data);
  }

  $('#generate').addEventListener('click', () => doGenerate());

  // シード欄を空にしてから押すと、また別の組み合わせになる
  $('#regen').addEventListener('click', () => {
    seedInput.value = '';
    doGenerate();
  });

  $('#seed-random').addEventListener('click', () => {
    seedInput.value = randomSeed();
    toast('シードを固定しました。何度押しても同じ結果になります');
  });

  function randomSeed() {
    return Math.random().toString(36).slice(2, 10);
  }

  // --- コピー -----------------------------------------------------------------
  function copyText(text, message) {
    const done = () => toast(message);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* 失敗しても落とさない */ }
    document.body.removeChild(ta);
    done();
  }

  $('#use-seed').addEventListener('click', () => {
    if (!last) return;
    seedInput.value = last.data.seed;
    toast('シードを固定しました');
  });

  $('#copy-all').addEventListener('click', () => {
    if (!last) return;
    const lines = last.data.results.map((r) => r.full);
    copyText(lines.join('\n'), lines.length + '件をコピーしました');
  });

  // --- トースト -----------------------------------------------------------------
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  // --- 初期化 -------------------------------------------------------------------
  const params = new URLSearchParams(location.search);
  if (params.get('seed')) seedInput.value = params.get('seed');

  setScripts(['kanji', 'katakana']);
  setIndustryMode('all');
  $$('input[name="corpPos"]').forEach((i) => { i.checked = i.value === 'auto'; });
  syncChips();
  updatePosVisibility();
  updateHint();

  // 最初の1回くらいは何か出しておく（空の画面より分かりやすい）。
  // URL に ?seed= があればそのシードに固定する（同じ結果を共有できる）。
  doGenerate();
})();
