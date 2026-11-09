/*!
 * Arisou-Campany-Name.inc — 業種選択の状態（DOM に依存しない純粋なロジック）
 *
 * 以前、業種チップをクリックすると選んだばかりのチェックを自分で全部外してしまい、
 * 「エンタメ・メディア」を選んでも全業種が混ざる不具合があった（HISTORY 参照）。
 * 状態遷移をここに閉じ込めて、DOM を触らずにテストできるようにしている。
 *
 * 状態は { mode, selected } の2つだけ。
 *   mode: 'all'  … 指定なし（すべての業種から接尾辞を選ぶ）
 *         'none' … 業種接尾辞を付けない
 *         'some' … selected の業種だけ
 *   selected: 業種IDの配列（mode === 'some' のときだけ意味を持つ）
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArisouUiState = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createState() {
    return { mode: 'all', selected: [] };
  }

  function normalize(state) {
    if (!state || typeof state !== 'object') return createState();
    const selected = Array.isArray(state.selected)
      ? state.selected.filter((v, i, a) => typeof v === 'string' && a.indexOf(v) === i)
      : [];
    if (state.mode === 'none') return { mode: 'none', selected: [] };
    if (state.mode === 'some' && selected.length > 0) return { mode: 'some', selected: selected };
    return createState();
  }

  /** すべての業種（指定なし） */
  function selectAll() {
    return createState();
  }

  /** 接尾辞を付けない */
  function selectNone() {
    return { mode: 'none', selected: [] };
  }

  /** 指定した業種だけ */
  function selectSome(ids) {
    const selected = Array.isArray(ids) ? ids.filter((v, i, a) => typeof v === 'string' && a.indexOf(v) === i) : [];
    if (selected.length === 0) return createState();
    return { mode: 'some', selected: selected };
  }

  /**
   * 業種チップのオン・オフ。
   * @param {object} state いまの状態
   * @param {string} id 業種ID
   * @param {boolean} checked チェックされたか
   */
  function toggle(state, id, checked) {
    const cur = normalize(state);
    // 「接尾辞なし」から触ったときは、白紙から始める
    const base = cur.mode === 'some' ? cur.selected.slice() : [];
    const next = base.filter((v) => v !== id);
    if (checked) next.push(id);
    return selectSome(next);
  }

  function isSelected(state, id) {
    const cur = normalize(state);
    return cur.mode === 'some' && cur.selected.indexOf(id) >= 0;
  }

  /**
   * generator.js に渡す業種の値を返す。
   *   null … 指定なし（すべて）
   *   []   … 業種接尾辞を付けない
   *   [...] … その業種だけ
   */
  function industriesForRequest(state) {
    const cur = normalize(state);
    if (cur.mode === 'none') return [];
    if (cur.mode === 'some') return cur.selected.slice();
    return null;
  }

  /** 画面表示用の説明 */
  function describe(state) {
    const cur = normalize(state);
    if (cur.mode === 'none') return '接尾辞なし';
    if (cur.mode === 'some') return '業種を指定（' + cur.selected.length + '件）';
    return '全業種';
  }

  return {
    createState: createState,
    normalize: normalize,
    selectAll: selectAll,
    selectNone: selectNone,
    selectSome: selectSome,
    toggle: toggle,
    isSelected: isSelected,
    industriesForRequest: industriesForRequest,
    describe: describe
  };
});
