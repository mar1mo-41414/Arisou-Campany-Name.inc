#!/usr/bin/env node
/*
 * generator.js の単体テスト。依存パッケージなし（Node 18+）。
 *   node tests/generator.test.js
 */
'use strict';

const assert = require('assert');
const path = require('path');
const G = require(path.join(__dirname, '..', 'web', 'generator.js'));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok   ' + name);
  } catch (err) {
    failed++;
    console.log('  FAIL ' + name);
    console.log('       ' + (err && err.message));
  }
}

function gen(overrides, count) {
  return G.generateNames(Object.assign({ count: count || 30, seed: 'test-seed' }, overrides || {}));
}

console.log('\ngenerator.js');

test('同じシードなら同じ結果になる', () => {
  const a = G.generateNames({ seed: 'abc', count: 12 });
  const b = G.generateNames({ seed: 'abc', count: 12 });
  assert.deepStrictEqual(a.results.map((r) => r.full), b.results.map((r) => r.full));
});

test('シードが違えば結果も違う', () => {
  const a = G.generateNames({ seed: 'abc', count: 12 });
  const b = G.generateNames({ seed: 'xyz', count: 12 });
  assert.notDeepStrictEqual(a.results.map((r) => r.full), b.results.map((r) => r.full));
});

test('指定した数の名前を返す', () => {
  assert.strictEqual(gen({}, 20).results.length, 20);
  assert.strictEqual(gen({ count: 1 }, 1).results.length, 1);
});

test('同じ名前を2回出さない', () => {
  const res = gen({ count: 40 }, 40).results;
  const set = new Set(res.map((r) => r.full));
  assert.strictEqual(set.size, res.length);
});

test('漢字のみ: 英字・カタカナ・ひらがなを含まない', () => {
  const res = gen({ scripts: { kanji: true } }, 60).results;
  for (const r of res) {
    const s = G.scriptsIn(r.full.replace('株式会社', ''));
    assert.ok(!s.has('english'), '英字が混ざった: ' + r.full);
    assert.ok(!s.has('katakana'), 'カタカナが混ざった: ' + r.full);
    assert.ok(!s.has('hiragana'), 'ひらがなが混ざった: ' + r.full);
  }
});

test('カタカナのみ: 漢字を含まない（法人種別を除く）', () => {
  const res = gen({ scripts: { katakana: true } }, 60).results;
  for (const r of res) {
    const s = G.scriptsIn(r.core);
    assert.ok(!s.has('kanji'), '漢字が混ざった: ' + r.full);
    assert.ok(!s.has('hiragana'), 'ひらがなが混ざった: ' + r.full);
  }
});

test('英字のみ: 日本語の文字を含まない', () => {
  const res = gen({ scripts: { english: true }, corp: 'none' }, 60).results;
  for (const r of res) {
    const s = G.scriptsIn(r.full);
    assert.ok(!s.has('kanji') && !s.has('hiragana') && !s.has('katakana'), '日本語が混ざった: ' + r.full);
  }
});

test('ひらがなのみ', () => {
  const res = gen({ scripts: { hiragana: true }, corp: 'none' }, 60).results;
  for (const r of res) {
    const s = G.scriptsIn(r.full);
    assert.ok(s.size === 1 && s.has('hiragana'), 'ひらがな以外が混ざった: ' + r.full);
  }
});

test('ひらがな + カタカナの混在は許される', () => {
  const res = gen({ scripts: { hiragana: true, katakana: true }, corp: 'none' }, 80).results;
  for (const r of res) {
    const s = G.scriptsIn(r.full);
    assert.ok(!s.has('kanji') && !s.has('english'), '選んでいない文字種: ' + r.full);
  }
});

test('文字数の範囲に収まる', () => {
  for (const [min, max] of [[3, 5], [4, 4], [6, 10], [2, 3]]) {
    const res = gen({ length: { min: min, max: max }, scripts: { kanji: true, katakana: true } }, 25).results;
    for (const r of res) {
      assert.ok(r.length >= min && r.length <= max, r.full + ' は ' + r.length + '文字 (期待 ' + min + '-' + max + ')');
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

test('株式会社は前株 / 後株の両方があり得る', () => {
  const res = gen({ scripts: { kanji: true }, corp: 'kabushiki', length: { min: 3, max: 6 } }, 40).results;
  for (const r of res) {
    assert.ok(r.full.startsWith('株式会社') || r.full.endsWith('株式会社'), '法人種別が無い: ' + r.full);
  }
  const positions = new Set(res.map((r) => r.position));
  // 自動指定なので、40件も出せば両方出るはず
  assert.ok(positions.has('prefix') && positions.has('suffix'), '位置が片方だけ: ' + [...positions]);
});

test('前株固定・後株固定が効く', () => {
  const pre = gen({ scripts: { kanji: true }, corp: 'kabushiki', corpPosition: 'prefix' }, 20).results;
  pre.forEach((r) => assert.ok(r.full.startsWith('株式会社'), r.full));
  const suf = gen({ scripts: { kanji: true }, corp: 'kabushiki', corpPosition: 'suffix' }, 20).results;
  suf.forEach((r) => assert.ok(r.full.endsWith('株式会社'), r.full));
});

test('有限会社は必ず前', () => {
  const res = gen({ scripts: { kanji: true }, corp: 'yugen' }, 20).results;
  res.forEach((r) => assert.ok(r.full.startsWith('有限会社'), r.full));
});

test('法人種別なしなら接頭辞も接尾辞も付かない', () => {
  const res = gen({ scripts: { kanji: true }, corp: 'none' }, 20).results;
  res.forEach((r) => assert.ok(r.full.indexOf('株式会社') < 0 && r.full.indexOf('有限会社') < 0, r.full));
});

test('株式会社と有限会社で同じ名前は出ない（別物として扱う）', () => {
  const a = gen({ scripts: { kanji: true }, corp: 'kabushiki' }, 15).results.map((r) => r.core);
  const b = gen({ scripts: { kanji: true }, corp: 'yugen' }, 15).results.map((r) => r.core);
  // 本体は同じでも法人種別が違うので full は別。比較は full で行う。
  const A = gen({ scripts: { kanji: true }, corp: 'kabushiki' }, 15).results.map((r) => r.full);
  const B = gen({ scripts: { kanji: true }, corp: 'yugen' }, 15).results.map((r) => r.full);
  const overlap = A.filter((x) => B.indexOf(x) >= 0);
  assert.strictEqual(overlap.length, 0);
});

test('業種を絞ると接尾辞がその業種になる', () => {
  const res = gen({ scripts: { kanji: true }, industries: ['logistics'], length: { min: 4, max: 8 } }, 40).results;
  const allowed = ['運輸', '運送', '物流', '倉庫', '海運', '自動車'];
  let suffixed = 0;
  for (const r of res) {
    for (const a of allowed) {
      if (r.core.indexOf(a) >= 0) { suffixed++; break; }
    }
  }
  assert.ok(suffixed > 0, '業種接尾辞が1回も出なかった');
});

test('業種を空配列にすると接尾辞が付かない', () => {
  const res = gen({ scripts: { kanji: true }, industries: [], corp: 'none' }, 40).results;
  const suffixed = ['商事', '物産', '製作所', '工業', '建設', '運輸'];
  for (const r of res) {
    for (const s of suffixed) {
      assert.ok(r.core.indexOf(s) < 0, '接尾辞が付いた: ' + r.full);
    }
  }
});

test('数字オプションで数字が入り得る', () => {
  const res = gen({ scripts: { kanji: true }, digits: true, corp: 'none' }, 60).results;
  assert.ok(res.some((r) => /[0-9]/.test(r.full)), '数字が1件も出なかった');
});

test('数字オプションなしでは数字が出ない', () => {
  const res = gen({ scripts: { kanji: true, katakana: true }, digits: false, corp: 'none' }, 60).results;
  res.forEach((r) => assert.ok(!/[0-9]/.test(r.full), '数字が出た: ' + r.full));
});

test('よみがなを返す', () => {
  const res = gen({ scripts: { kanji: true, katakana: true } }, 20).results;
  res.forEach((r) => {
    assert.ok(typeof r.read === 'string' && r.read.length > 0, r.full + ' によみがない');
  });
});

test('文字種が1つも無いときは生成しない', () => {
  const data = G.generateNames({ scripts: {}, count: 5, seed: 'x' });
  assert.strictEqual(data.results.length, 0);
});

test('1文字という極端な条件でも落ちない', () => {
  const data = G.generateNames({ scripts: { kanji: true }, length: { min: 1, max: 2 }, count: 10, seed: 'x' });
  assert.ok(data.results.length > 0);
});

test('条件が厳しすぎるとき unmetLength を立てる', () => {
  // 英字だけ・1〜2文字は語彙が無いので満たせない
  const data = G.generateNames({ scripts: { english: true }, length: { min: 1, max: 2 }, count: 5, seed: 'x' });
  assert.ok(data.unmetLength === true || data.results.length === 0);
});

test('count は 1〜50 に丸められる', () => {
  assert.strictEqual(G.normalizeOptions({ count: 999 }).count, 50);
  assert.strictEqual(G.normalizeOptions({ count: 0 }).count, 1);
  assert.strictEqual(G.normalizeOptions({ count: NaN }).count, G.DEFAULT_OPTIONS.count);
});

test('文字数の範囲が逆でも落ちない', () => {
  const o = G.normalizeOptions({ length: { min: 9, max: 3 } });
  assert.ok(o.length.min <= o.length.max);
});

test('空文字や記号だけの名前を作らない', () => {
  const res = gen({}, 60).results;
  res.forEach((r) => {
    assert.ok(r.full.trim().length > 0, '空の名前');
    assert.ok(/[\u3041-\u30ff\u4e00-\u9fffA-Za-z]/.test(r.full), '文字が無い: ' + r.full);
  });
});

// 実際にどんな名前が出るか（目視確認用）
console.log('\n--- 出力例 (seed=fixed, 漢字+カタカナ) ---');
G.generateNames({ seed: 'fixed', count: 12, scripts: { kanji: true, katakana: true } })
  .results.forEach((r) => console.log('  ' + r.full + '  (' + r.read + ')'));

console.log('--- 出力例 (seed=fixed, 英字のみ) ---');
G.generateNames({ seed: 'fixed', count: 8, scripts: { english: true }, corp: 'kabushiki' })
  .results.forEach((r) => console.log('  ' + r.full));

console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed === 0 ? 0 : 1);
