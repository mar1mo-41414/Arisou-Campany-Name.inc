/*
 * ui-state.js（業種選択の状態）の単体テスト。
 *   node --test
 *
 * 過去に「業種を選んでも全業種が混ざる」不具合があったため、
 * 状態遷移はここで固定する（DOM を触らずに検証できる）。
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const U = require(path.join(__dirname, '..', 'ui-state.js'));

test('初期状態は「指定なし（全業種）」', () => {
  const s = U.createState();
  assert.strictEqual(s.mode, 'all');
  assert.deepStrictEqual(s.selected, []);
  assert.strictEqual(U.industriesForRequest(s), null);
});

test('チップを1つ選ぶと、その業種だけになる', () => {
  const s = U.toggle(U.createState(), 'media', true);
  assert.strictEqual(s.mode, 'some');
  assert.deepStrictEqual(s.selected, ['media']);
  assert.deepStrictEqual(U.industriesForRequest(s), ['media']);
  assert.strictEqual(U.isSelected(s, 'media'), true);
  assert.strictEqual(U.isSelected(s, 'finance'), false);
});

test('選んだ業種が、他のチップ操作で消えない', () => {
  // 不具合の再現: media を選んだあと、無関係な表示更新で選択が消えていた
  let s = U.toggle(U.createState(), 'media', true);
  s = U.normalize(s);
  assert.deepStrictEqual(s.selected, ['media'], 'normalize で選択が消えた');
  assert.strictEqual(s.mode, 'some');
});

test('2つ目を足すと2件になる', () => {
  let s = U.toggle(U.createState(), 'media', true);
  s = U.toggle(s, 'finance', true);
  assert.deepStrictEqual(s.selected, ['media', 'finance']);
  assert.deepStrictEqual(U.industriesForRequest(s), ['media', 'finance']);
});

test('チェックを外すと、その業種だけ消える', () => {
  let s = U.toggle(U.selectSome(['media', 'finance', 'it']), 'finance', false);
  assert.deepStrictEqual(s.selected, ['media', 'it']);
  assert.strictEqual(s.mode, 'some');
});

test('全部外すと「指定なし」に戻る', () => {
  let s = U.selectSome(['media']);
  s = U.toggle(s, 'media', false);
  assert.strictEqual(s.mode, 'all');
  assert.strictEqual(U.industriesForRequest(s), null);
});

test('「接尾辞なし」からチップを選ぶと、その業種だけになる', () => {
  let s = U.selectNone();
  assert.deepStrictEqual(U.industriesForRequest(s), []);
  s = U.toggle(s, 'media', true);
  assert.strictEqual(s.mode, 'some');
  assert.deepStrictEqual(s.selected, ['media']);
});

test('「接尾辞なし」は空配列（全業種とは別物）', () => {
  assert.deepStrictEqual(U.industriesForRequest(U.selectNone()), []);
  assert.strictEqual(U.industriesForRequest(U.selectAll()), null);
  assert.notDeepStrictEqual(U.industriesForRequest(U.selectNone()), U.industriesForRequest(U.selectAll()));
});

test('重複した ID を渡しても1件にまとめる', () => {
  const s = U.selectSome(['media', 'media', 'finance']);
  assert.deepStrictEqual(s.selected, ['media', 'finance']);
});

test('空配列を「指定だけ」で渡したときは、全業種に倒す', () => {
  const s = U.selectSome([]);
  assert.strictEqual(s.mode, 'all');
});

test('おかしな状態でも落ちない', () => {
  assert.strictEqual(U.normalize(null).mode, 'all');
  assert.strictEqual(U.normalize({ mode: 'unknown' }).mode, 'all');
  assert.strictEqual(U.normalize({ mode: 'some', selected: 'media' }).mode, 'all');
  assert.deepStrictEqual(U.normalize({ mode: 'none', selected: ['media'] }).selected, []);
  assert.strictEqual(U.isSelected(null, 'media'), false);
  assert.strictEqual(U.describe(null), '全業種');
});

test('表示用の説明', () => {
  assert.strictEqual(U.describe(U.selectAll()), '全業種');
  assert.strictEqual(U.describe(U.selectNone()), '接尾辞なし');
  assert.strictEqual(U.describe(U.selectSome(['media', 'it'])), '業種を指定（2件）');
});

test('選んだ業種だけが generator.js に渡る（依頼の再現）', () => {
  const G = require(path.join(__dirname, '..', 'generator.js'));
  // 「エンタメ・メディア」だけを選んだ状態
  const state = U.toggle(U.createState(), 'media', true);
  const industries = U.industriesForRequest(state);

  const data = G.generateNames({
    seed: 'qv25ud4e',
    industries: industries,
    scripts: { kanji: true, katakana: true },
    count: 10
  });

  // 業種接尾辞が付いた結果は、すべてエンタメ・メディアのものでなければならない
  const mediaSuffixes = ['出版', '映像', '音楽', '印刷', '広告', 'プロダクション', 'スタジオ', 'メディア', 'ミュージック', 'ピクチャーズ'];
  const otherSuffixes = ['保険', '信託', '証券', '金融', '債権', '住建', '計器', '商会', '興産', '福祉'];
  for (const r of data.results) {
    for (const ng of otherSuffixes) {
      assert.ok(r.core.indexOf(ng) < 0, '別業種の接尾辞が出た: ' + r.full);
    }
    if (mediaSuffixes.some((s) => r.core.indexOf(s) >= 0)) {
      assert.ok(r.tags.indexOf('エンタメ・メディア') >= 0, 'タグが付いていない: ' + r.full);
    }
  }
});
