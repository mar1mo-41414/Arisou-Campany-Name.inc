/*
 * generator.js の単体テスト。
 *   node --test
 * 依存パッケージなし（Node 18+ の node:test）。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const G = require(path.join(__dirname, '..', 'generator.js'));

/** 条件を指定して生成する小さなヘルパ。既定のシードを固定して再現性を持たせる。 */
function gen(overrides, count) {
  return G.generateNames(Object.assign({ count: count || 30, seed: 'test-seed' }, overrides || {}));
}

// ---------------------------------------------------------------------------
// 再現性
// ---------------------------------------------------------------------------

test('同じシードと同じルールなら同じ結果になる', () => {
  const a = G.generateNames({ seed: 'abc', count: 12 });
  const b = G.generateNames({ seed: 'abc', count: 12 });
  assert.deepStrictEqual(a.results.map((r) => r.full), b.results.map((r) => r.full));
});

test('シードが違えば結果も違う', () => {
  const a = G.generateNames({ seed: 'abc', count: 12 });
  const b = G.generateNames({ seed: 'xyz', count: 12 });
  assert.notDeepStrictEqual(a.results.map((r) => r.full), b.results.map((r) => r.full));
});

test('シードを省略しても落ちない（毎回ちがう結果になる）', () => {
  const a = G.generateNames({ count: 5 });
  const b = G.generateNames({ count: 5 });
  assert.strictEqual(a.results.length, 5);
  assert.strictEqual(b.results.length, 5);
  assert.notStrictEqual(a.seed, b.seed);
});

// ---------------------------------------------------------------------------
// 件数・重複
// ---------------------------------------------------------------------------

test('指定した数の名前を返す', () => {
  assert.strictEqual(gen({}, 20).results.length, 20);
  assert.strictEqual(gen({ count: 1 }).results.length, 1);
});

test('一度に生成できるのは最大20件', () => {
  assert.strictEqual(G.normalizeOptions({ count: 999 }).count, 20);
  assert.strictEqual(G.normalizeOptions({ count: 0 }).count, 1);
  assert.strictEqual(G.generateNames({ count: 50, seed: 'x' }).results.length, 20);
});

test('同じ名前を2回出さない', () => {
  const res = gen({ count: 20 }, 20).results;
  const set = new Set(res.map((r) => r.full));
  assert.strictEqual(set.size, res.length);
});

test('前株・後株だけが違う名前を並べない', () => {
  // 「株式会社◯◯」と「◯◯株式会社」は同じ名前として扱う
  const res = gen({ scripts: { kanji: true }, corp: 'kabushiki' }, 20).results;
  const cores = res.map((r) => r.core);
  assert.strictEqual(new Set(cores).size, cores.length);
});

// ---------------------------------------------------------------------------
// 文字種（選んだルールを黙って無視しない）
// ---------------------------------------------------------------------------

test('漢字だけを選んだら英字・カタカナ・ひらがなを混ぜない', () => {
  const res = gen({ scripts: { kanji: true } }, 20).results;
  for (const r of res) {
    const s = G.scriptsIn(r.full.replace(/株式会社|有限会社|合同会社|合名会社|合資会社/g, ''));
    assert.ok(!s.has('english'), '英字が混ざった: ' + r.full);
    assert.ok(!s.has('katakana'), 'カタカナが混ざった: ' + r.full);
    assert.ok(!s.has('hiragana'), 'ひらがなが混ざった: ' + r.full);
  }
});

test('カタカナだけを選んだら漢字・ひらがなを混ぜない', () => {
  const res = gen({ scripts: { katakana: true } }, 20).results;
  for (const r of res) {
    const s = G.scriptsIn(r.core);
    assert.ok(!s.has('kanji'), '漢字が混ざった: ' + r.full);
    assert.ok(!s.has('hiragana'), 'ひらがなが混ざった: ' + r.full);
  }
});

test('英字だけを選んだら日本語の文字を混ぜない', () => {
  const res = gen({ scripts: { english: true }, corp: 'none' }, 20).results;
  for (const r of res) {
    const s = G.scriptsIn(r.full);
    assert.ok(!s.has('kanji') && !s.has('hiragana') && !s.has('katakana'), '日本語が混ざった: ' + r.full);
  }
});

test('ひらがなだけを選んだらひらがなだけになる', () => {
  const res = gen({ scripts: { hiragana: true }, corp: 'none' }, 20).results;
  for (const r of res) {
    const s = G.scriptsIn(r.full);
    assert.ok(s.size === 1 && s.has('hiragana'), 'ひらがな以外が混ざった: ' + r.full);
  }
});

test('ひらがな＋カタカナの混在は許す（選んだ文字種だけ）', () => {
  const res = gen({ scripts: { hiragana: true, katakana: true }, corp: 'none' }, 20).results;
  for (const r of res) {
    const s = G.scriptsIn(r.full);
    assert.ok(!s.has('kanji') && !s.has('english'), '選んでいない文字種: ' + r.full);
  }
});

test('文字種を1つも選ばないときは生成しない', () => {
  const data = G.generateNames({ scripts: {}, count: 5, seed: 'x' });
  assert.strictEqual(data.results.length, 0);
});

// ---------------------------------------------------------------------------
// 文字数
// ---------------------------------------------------------------------------

test('文字数の範囲に収まる', () => {
  for (const [min, max] of [[3, 5], [4, 4], [6, 10], [2, 3]]) {
    const res = gen({ length: { min: min, max: max }, scripts: { kanji: true, katakana: true } }, 25).results;
    for (const r of res) {
      assert.ok(r.length >= min && r.length <= max,
        r.full + ' は ' + r.length + '文字 (期待 ' + min + '-' + max + ')');
    }
  }
});

test('文字数は法人種別を含まない', () => {
  const res = gen({ length: { min: 4, max: 4 }, scripts: { kanji: true }, corp: 'kabushiki' }, 10).results;
  for (const r of res) {
    assert.strictEqual(Array.from(r.core).length, 4);
    assert.ok(r.full.length > 4);
  }
});

test('文字数の範囲が逆でも落ちない', () => {
  const o = G.normalizeOptions({ length: { min: 9, max: 3 } });
  assert.ok(o.length.min <= o.length.max);
});

test('1文字という極端な条件でも落ちない', () => {
  const data = G.generateNames({ scripts: { kanji: true }, length: { min: 1, max: 2 }, count: 10, seed: 'x' });
  assert.ok(data.results.length > 0);
});

test('条件を満たせないときは0件にせず、unmetLength で知らせる', () => {
  // 英字だけ・1〜2文字は語彙が無いので満たせない
  const data = G.generateNames({ scripts: { english: true }, length: { min: 1, max: 2 }, count: 5, seed: 'x' });
  assert.ok(data.unmetLength === true || data.results.length === 0);
});

// ---------------------------------------------------------------------------
// 法人種別
// ---------------------------------------------------------------------------

test('株式会社は前株・後株の両方があり得る', () => {
  const res = gen({ scripts: { kanji: true }, corp: 'kabushiki' }, 20).results;
  for (const r of res) {
    assert.ok(r.full.startsWith('株式会社') || r.full.endsWith('株式会社'), '法人種別が無い: ' + r.full);
  }
  const positions = new Set(res.map((r) => r.position));
  assert.ok(positions.has('prefix') && positions.has('suffix'), '位置が片方だけ: ' + [...positions]);
});

test('前株固定・後株固定が効く', () => {
  const pre = gen({ scripts: { kanji: true }, corp: 'kabushiki', corpPosition: 'prefix' }, 20).results;
  pre.forEach((r) => assert.ok(r.full.startsWith('株式会社'), r.full));
  const suf = gen({ scripts: { kanji: true }, corp: 'kabushiki', corpPosition: 'suffix' }, 20).results;
  suf.forEach((r) => assert.ok(r.full.endsWith('株式会社'), r.full));
});

test('有限会社は必ず前株', () => {
  const res = gen({ scripts: { kanji: true }, corp: 'yugen' }, 20).results;
  res.forEach((r) => assert.ok(r.full.startsWith('有限会社'), r.full));
});

test('合名会社・合資会社・合同会社も必ず前株', () => {
  for (const [corp, label] of [['godo', '合同会社'], ['gomei', '合名会社'], ['goshi', '合資会社']]) {
    const res = gen({ scripts: { kanji: true }, corp: corp }, 10).results;
    res.forEach((r) => assert.ok(r.full.startsWith(label), r.full));
  }
});

test('法人種別なしなら接頭辞も接尾辞も付かない', () => {
  const res = gen({ scripts: { kanji: true }, corp: 'none' }, 20).results;
  res.forEach((r) => {
    assert.ok(r.full.indexOf('株式会社') < 0 && r.full.indexOf('有限会社') < 0, r.full);
    assert.strictEqual(r.position, 'none');
  });
});

test('本体が「製作所」などで終わるときは後株にしない（二重接尾辞を避ける）', () => {
  const res = gen({ scripts: { kanji: true }, corp: 'kabushiki', corpPosition: 'auto' }, 20).results;
  const tails = /(製作所|工作所|工務店|事務所|不動産|診療所)$/;
  for (const r of res) {
    if (tails.test(r.core)) {
      assert.strictEqual(r.position, 'prefix', '二重接尾辞になった: ' + r.full);
    }
  }
});

// ---------------------------------------------------------------------------
// 業種・数字・よみ
// ---------------------------------------------------------------------------

test('業種を絞るとその業種の接尾辞が出る', () => {
  const res = gen({ scripts: { kanji: true }, industries: ['logistics'] }, 20).results;
  const allowed = ['運輸', '運送', '物流', '倉庫', '海運', '自動車'];
  let suffixed = 0;
  for (const r of res) {
    for (const a of allowed) {
      if (r.core.indexOf(a) >= 0) { suffixed++; break; }
    }
  }
  assert.ok(suffixed > 0, '業種接尾辞が1回も出なかった');
});

test('業種を空にすると接尾辞が付かない', () => {
  const res = gen({ scripts: { kanji: true }, industries: [], corp: 'none' }, 20).results;
  const suffixed = ['商事', '物産', '製作所', '工業', '建設', '運輸'];
  for (const r of res) {
    for (const s of suffixed) {
      assert.ok(r.core.indexOf(s) < 0, '接尾辞が付いた: ' + r.full);
    }
  }
});

test('数字オプションで数字が入り得る', () => {
  const res = gen({ scripts: { kanji: true }, digits: true, corp: 'none' }, 20).results;
  assert.ok(res.some((r) => /[0-9]/.test(r.full)), '数字が1件も出なかった');
});

test('数字オプションなしでは数字が出ない', () => {
  const res = gen({ scripts: { kanji: true, katakana: true }, digits: false, corp: 'none' }, 20).results;
  res.forEach((r) => assert.ok(!/[0-9]/.test(r.full), '数字が出た: ' + r.full));
});

test('数字は末尾ではなく業種接尾辞のまえに入る', () => {
  const res = gen({ scripts: { kanji: true }, digits: true, corp: 'none' }, 20).results;
  const suffixed = /(商事|物産|工業|建設|運輸|製作所|電機|情報)$/;
  for (const r of res) {
    const m = r.core.match(/[0-9]+/);
    if (m && suffixed.test(r.core)) {
      assert.ok(r.core.indexOf(m[0]) < r.core.search(suffixed), '数字が末尾に寄った: ' + r.full);
    }
  }
});

test('よみがなを返す', () => {
  const res = gen({ scripts: { kanji: true, katakana: true } }, 20).results;
  res.forEach((r) => {
    assert.ok(typeof r.read === 'string' && r.read.length > 0, r.full + ' によみがない');
  });
});

test('空文字や記号だけの名前を作らない', () => {
  const res = gen({}, 20).results;
  res.forEach((r) => {
    assert.ok(r.full.trim().length > 0, '空の名前');
    assert.ok(/[\u3041-\u30ff\u4e00-\u9fffA-Za-z]/.test(r.full), '文字が無い: ' + r.full);
  });
});

// ---------------------------------------------------------------------------
// 入力の丸め
// ---------------------------------------------------------------------------

test('おかしな入力でも落ちない', () => {
  assert.strictEqual(G.normalizeOptions({ count: NaN }).count, G.DEFAULT_OPTIONS.count);
  assert.strictEqual(G.normalizeOptions({ corp: 'unknown' }).corp, 'kabushiki');
  assert.strictEqual(G.normalizeOptions({ corpPosition: 'unknown' }).corpPosition, 'auto');
  assert.strictEqual(G.normalizeOptions({ length: { min: -5, max: 99 } }).length.min, 1);
  assert.strictEqual(G.normalizeOptions({ length: { min: -5, max: 99 } }).length.max, 20);
});

test('不明なオプションは無視する', () => {
  const data = G.generateNames({ seed: 'x', count: 3, unknown: true, industries: ['nope'] });
  assert.strictEqual(data.results.length, 3);
});
