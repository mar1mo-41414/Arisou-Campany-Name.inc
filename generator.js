/*!
 * Arisou-Campany-Name.inc — ありそうな会社名ジェネレータ
 *
 * 依存ライブラリなし。ブラウザでは <script src="generator.js"> で
 * window.ArisouCompanyName として、Node では require() で使える。
 * 同じシードなら必ず同じ結果になる（決定論的）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ArisouCompanyName = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 語彙データ
  // すべて [表記, よみ] の組。英字は「読み（カタカナ）」も持たせて、よみがなを出せるようにする。
  // ---------------------------------------------------------------------------

  const KANJI_WORDS = [
    ['旭陽', 'きょくよう'], ['光和', 'こうわ'], ['大成', 'たいせい'], ['大栄', 'たいえい'],
    ['丸善', 'まるぜん'], ['三晃', 'さんこう'], ['新興', 'しんこう'], ['東洋', 'とうよう'],
    ['日新', 'にっしん'], ['明和', 'めいわ'], ['八洲', 'やしま'], ['山陽', 'さんよう'],
    ['興和', 'こうわ'], ['協和', 'きょうわ'], ['三和', 'さんわ'], ['明光', 'めいこう'],
    ['大洋', 'たいよう'], ['相互', 'そうご'], ['松風', 'まつかぜ'], ['千代', 'ちよ'],
    ['第一', 'だいいち'], ['瑞光', 'ずいこう'], ['宝山', 'ほうざん'], ['金光', 'きんこう'],
    ['錦城', 'きんじょう'], ['白鳥', 'はくちょう'], ['青葉', 'あおば'], ['若葉', 'わかば'],
    ['常盤', 'ときわ'], ['星光', 'せいこう'], ['天翔', 'てんしょう'], ['翔陽', 'しょうよう'],
    ['進和', 'しんわ'], ['親和', 'しんわ'], ['誠和', 'せいわ'], ['正和', 'しょうわ'],
    ['広栄', 'こうえい'], ['秀英', 'しゅうえい'], ['大和', 'やまと'], ['北斗', 'ほくと'],
    ['南陽', 'なんよう'], ['北陽', 'ほくよう'], ['陽光', 'ようこう'], ['東栄', 'とうえい'],
    ['明星', 'みょうじょう'], ['銀河', 'ぎんが'], ['銀嶺', 'ぎんれい'], ['白鷺', 'しらさぎ'],
    ['瑞穂', 'みずほ'], ['若松', 'わかまつ'], ['千歳', 'ちとせ'], ['久遠', 'くおん'],
    ['創和', 'そうわ'], ['共栄', 'きょうえい'], ['宏和', 'ひろかず'], ['真和', 'しんわ']
  ];

  // 地名・地域名。漢字の会社名の頭に付くと一気に「ありそう」になる。
  const REGIONS = [
    ['九州', 'きゅうしゅう'], ['博多', 'はかた'], ['福岡', 'ふくおか'], ['東京', 'とうきょう'],
    ['大阪', 'おおさか'], ['名古屋', 'なごや'], ['京都', 'きょうと'], ['札幌', 'さっぽろ'],
    ['仙台', 'せんだい'], ['広島', 'ひろしま'], ['神戸', 'こうべ'], ['横浜', 'よこはま'],
    ['日本', 'にほん'], ['極東', 'きょくとう'], ['東海', 'とうかい'], ['北陸', 'ほくりく'],
    ['関西', 'かんさい'], ['関東', 'かんとう'], ['四国', 'しこく'], ['山陰', 'さんいん'],
    ['北海道', 'ほっかいどう'], ['沖縄', 'おきなわ'], ['筑波', 'つくば'], ['阿蘇', 'あそ'],
    ['霧島', 'きりしま'], ['有明', 'ありあけ'], ['天草', 'あまくさ'], ['対馬', 'つしま'],
    ['壱岐', 'いき'], ['宗像', 'むなかた'], ['太宰府', 'だざいふ'], ['柳川', 'やながわ'],
    ['久留米', 'くるめ'], ['飯塚', 'いいづか'], ['小倉', 'こくら'], ['門司', 'もじ'],
    ['八幡', 'やはた'], ['香椎', 'かしい'], ['姪浜', 'めいのはま'], ['玄海', 'げんかい']
  ];

  // 業種ごとの接尾辞。漢字・カタカナ・英字の3系統を用意して、
  // 選ばれた文字種に合うものだけを使う。
  const INDUSTRIES = [
    {
      id: 'trade', label: '商社・貿易',
      kanji: [['商事', 'しょうじ'], ['物産', 'ぶっさん'], ['交易', 'こうえき'], ['興産', 'こうさん'], ['通商', 'つうしょう'], ['産業', 'さんぎょう'], ['商会', 'しょうかい']],
      kata: [['トレーディング', 'とれーでぃんぐ'], ['コマース', 'こまーす'], ['インターナショナル', 'いんたーなしょなる'], ['ジャパン', 'じゃぱん'], ['グローバル', 'ぐろーばる']],
      en: [['TRADING', 'トレーディング'], ['COMMERCE', 'コマース'], ['INTERNATIONAL', 'インターナショナル'], ['JAPAN', 'ジャパン'], ['GLOBAL', 'グローバル']]
    },
    {
      id: 'manufacturing', label: '製造・ものづくり',
      kanji: [['製作所', 'せいさくしょ'], ['工業', 'こうぎょう'], ['電機', 'でんき'], ['精機', 'せいき'], ['鉄工', 'てっこう'], ['化成', 'かせい'], ['食品', 'しょくひん'], ['薬品', 'やくひん'], ['工作所', 'こうさくしょ'], ['計器', 'けいき']],
      kata: [['テクノス', 'てくのす'], ['インダストリー', 'いんだすとりー'], ['ファクトリー', 'ふぁくとりー'], ['プロダクツ', 'ぷろだくつ'], ['マシナリー', 'ましなりー'], ['デバイス', 'でばいす']],
      en: [['TECHNOLOGY', 'テクノロジー'], ['INDUSTRIES', 'インダストリーズ'], ['FACTORY', 'ファクトリー'], ['PRODUCTS', 'プロダクツ'], ['PRECISION', 'プレシジョン']]
    },
    {
      id: 'construction', label: '建設・不動産',
      kanji: [['建設', 'けんせつ'], ['工務店', 'こうむてん'], ['地所', 'じしょ'], ['不動産', 'ふどうさん'], ['住建', 'じゅうけん'], ['開発', 'かいはつ'], ['工業所', 'こうぎょうしょ']],
      kata: [['コンストラクション', 'こんすとらくしょん'], ['ホーム', 'ほーむ'], ['ハウジング', 'はうじんぐ'], ['エンジニアリング', 'えんじにありんぐ'], ['ビルド', 'びるど']],
      en: [['CONSTRUCTION', 'コンストラクション'], ['HOMES', 'ホームズ'], ['HOUSING', 'ハウジング'], ['ENGINEERING', 'エンジニアリング'], ['BUILD', 'ビルド']]
    },
    {
      id: 'it', label: 'IT・通信',
      kanji: [['情報', 'じょうほう'], ['電算', 'でんさん'], ['通信', 'つうしん'], ['電子', 'でんし'], ['計測', 'けいそく']],
      kata: [['システムズ', 'しすてむず'], ['ソリューションズ', 'そりゅーしょんず'], ['テクノロジー', 'てくのろじー'], ['ネットワークス', 'ねっとわーくす'], ['デジタル', 'でじたる'], ['インフォメーション', 'いんふぉめーしょん'], ['ソフトウェア', 'そふとうぇあ'], ['システム', 'しすてむ']],
      en: [['SYSTEMS', 'システムズ'], ['SOLUTIONS', 'ソリューションズ'], ['NETWORKS', 'ネットワークス'], ['DIGITAL', 'デジタル'], ['SOFTWARE', 'ソフトウェア'], ['TECH', 'テック']]
    },
    {
      id: 'service', label: 'サービス・小売',
      kanji: [['興業', 'こうぎょう'], ['企画', 'きかく'], ['事務所', 'じむしょ'], ['商店', 'しょうてん'], ['産業', 'さんぎょう'], ['商会', 'しょうかい']],
      kata: [['サービス', 'さーびす'], ['マート', 'まーと'], ['ストア', 'すとあ'], ['プランニング', 'ぷらんにんぐ'], ['クリエイト', 'くりえいと'], ['サポート', 'さぽーと'], ['オフィス', 'おふぃす']],
      en: [['SERVICE', 'サービス'], ['MART', 'マート'], ['PLANNING', 'プランニング'], ['CREATE', 'クリエイト'], ['SUPPORT', 'サポート'], ['OFFICE', 'オフィス']]
    },
    {
      id: 'logistics', label: '運輸・物流',
      kanji: [['運輸', 'うんゆ'], ['運送', 'うんそう'], ['物流', 'ぶつりゅう'], ['倉庫', 'そうこ'], ['海運', 'かいうん'], ['自動車', 'じどうしゃ']],
      kata: [['ロジスティクス', 'ろじすてぃくす'], ['トランスポート', 'とらんすぽーと'], ['エクスプレス', 'えくすぷれす'], ['ライン', 'らいん'], ['カーゴ', 'かーご']],
      en: [['LOGISTICS', 'ロジスティクス'], ['TRANSPORT', 'トランスポート'], ['EXPRESS', 'エクスプレス'], ['LINE', 'ライン'], ['CARGO', 'カーゴ']]
    },
    {
      id: 'finance', label: '金融・保険',
      kanji: [['証券', 'しょうけん'], ['保険', 'ほけん'], ['信託', 'しんたく'], ['金融', 'きんゆう'], ['債権', 'さいけん']],
      kata: [['ファイナンス', 'ふぁいなんす'], ['キャピタル', 'きゃぴたる'], ['アセット', 'あせっと'], ['インベストメント', 'いんべすとめんと'], ['パートナーズ', 'ぱーとなーず']],
      en: [['FINANCE', 'ファイナンス'], ['CAPITAL', 'キャピタル'], ['ASSET', 'アセット'], ['INVESTMENT', 'インベストメント'], ['PARTNERS', 'パートナーズ']]
    },
    {
      id: 'medical', label: '医療・福祉',
      kanji: [['薬局', 'やっきょく'], ['福祉', 'ふくし'], ['衛生', 'えいせい'], ['診療所', 'しんりょうじょ']],
      kata: [['メディカル', 'めでぃかる'], ['ケア', 'けあ'], ['ヘルス', 'へるす'], ['クリニック', 'くりにっく'], ['ライフ', 'らいふ']],
      en: [['MEDICAL', 'メディカル'], ['CARE', 'ケア'], ['HEALTH', 'ヘルス'], ['CLINIC', 'クリニック'], ['LIFE', 'ライフ']]
    },
    {
      id: 'media', label: 'エンタメ・メディア',
      kanji: [['出版', 'しゅっぱん'], ['映像', 'えいぞう'], ['音楽', 'おんがく'], ['印刷', 'いんさつ'], ['広告', 'こうこく']],
      kata: [['エンターテインメント', 'えんたーていんめんと'], ['プロダクション', 'ぷろだくしょん'], ['メディア', 'めでぃあ'], ['スタジオ', 'すたじお'], ['ミュージック', 'みゅーじっく'], ['ピクチャーズ', 'ぴくちゃーず']],
      en: [['ENTERTAINMENT', 'エンターテインメント'], ['PRODUCTION', 'プロダクション'], ['MEDIA', 'メディア'], ['STUDIO', 'スタジオ'], ['MUSIC', 'ミュージック'], ['PICTURES', 'ピクチャーズ']]
    },
    {
      id: 'holding', label: '持株・グループ',
      kanji: [['本社', 'ほんしゃ'], ['総業', 'そうぎょう']],
      kata: [['ホールディングス', 'ほーるでぃんぐす'], ['グループ', 'ぐるーぷ'], ['コーポレーション', 'こーぽれーしょん'], ['パートナーズ', 'ぱーとなーず'], ['ワークス', 'わーくす'], ['ユナイテッド', 'ゆないてっど']],
      en: [['HOLDINGS', 'ホールディングス'], ['GROUP', 'グループ'], ['CORPORATION', 'コーポレーション'], ['PARTNERS', 'パートナーズ'], ['WORKS', 'ワークス'], ['UNITED', 'ユナイテッド'], ['VENTURES', 'ベンチャーズ']]
    }
  ];

  const KATA_WORDS = [
    ['アルファ', 'あるふぁ'], ['サンライズ', 'さんらいず'], ['ブルーリーフ', 'ぶるーりーふ'],
    ['グリーンフィールド', 'ぐりーんふぃーるど'], ['ノーススター', 'のーすすたー'],
    ['シルバーライン', 'しるばーらいん'], ['オーロラ', 'おーろら'], ['スカイライン', 'すかいらいん'],
    ['ハーバー', 'はーばー'], ['マリンブルー', 'まりんぶるー'], ['スターライト', 'すたーらいと'],
    ['ムーンライト', 'むーんらいと'], ['コスモス', 'こすもす'], ['アトラス', 'あとらす'],
    ['オリエント', 'おりえんと'], ['アルカディア', 'あるかでぃあ'], ['シンフォニア', 'しんふぉにあ'],
    ['リバティ', 'りばてぃ'], ['クレスト', 'くれすと'], ['ヴェルデ', 'ゔぇるで'],
    ['アリエス', 'ありえす'], ['レグルス', 'れぐるす'], ['シリウス', 'しりうす'],
    ['ベガ', 'べが'], ['アルタイル', 'あるたいる'], ['ノヴァ', 'のゔぁ'],
    ['セントラル', 'せんとらる'], ['フロンティア', 'ふろんてぃあ'], ['ネクサス', 'ねくさす'],
    ['グランツ', 'ぐらんつ'], ['ルミナス', 'るみなす'], ['ソレイユ', 'それいゆ'],
    ['メルカート', 'めるかーと'], ['トゥインクル', 'とぅいんくる'], ['プログレス', 'ぷろぐれす'],
    ['ハーモニー', 'はーもにー'], ['フェニックス', 'ふぇにっくす'], ['ホライズン', 'ほらいずん']
  ];

  const HIRA_WORDS = [
    ['はやぶさ', 'はやぶさ'], ['さくら', 'さくら'], ['こだま', 'こだま'], ['みらい', 'みらい'],
    ['つばき', 'つばき'], ['かえで', 'かえで'], ['ひかり', 'ひかり'], ['なでしこ', 'なでしこ'],
    ['そよかぜ', 'そよかぜ'], ['あかね', 'あかね'], ['こもれび', 'こもれび'], ['たまゆら', 'たまゆら'],
    ['ふたば', 'ふたば'], ['みずき', 'みずき'], ['すみれ', 'すみれ'], ['こはく', 'こはく'],
    ['あおぞら', 'あおぞら'], ['ほたる', 'ほたる'], ['みなと', 'みなと'], ['ゆうなぎ', 'ゆうなぎ'],
    ['つむぎ', 'つむぎ'], ['なぎさ', 'なぎさ'], ['ひだまり', 'ひだまり'], ['まほろば', 'まほろば']
  ];

  const EN_WORDS = [
    ['SUNRISE', 'サンライズ'], ['BLUEWAVE', 'ブルーウェーブ'], ['SKYLINE', 'スカイライン'],
    ['NORTHSTAR', 'ノーススター'], ['NEXTSTAGE', 'ネクストステージ'], ['GLOBALLINK', 'グローバルリンク'],
    ['VERTEX', 'ヴァーテックス'], ['ORION', 'オリオン'], ['ATLAS', 'アトラス'], ['NOVA', 'ノヴァ'],
    ['ORBIT', 'オービット'], ['SUMMIT', 'サミット'], ['CRESTLINE', 'クレストライン'],
    ['HARBOR', 'ハーバー'], ['AXIOM', 'アクシオム'], ['ZENITH', 'ゼニス'],
    ['EVERGREEN', 'エバーグリーン'], ['PRISM', 'プリズム'], ['DELTA', 'デルタ'],
    ['POLARIS', 'ポラリス'], ['LUMINA', 'ルミナ'], ['STRIDE', 'ストライド'],
    ['BRIGHTON', 'ブライトン'], ['CORE', 'コア'], ['ARC', 'アーク'], ['SPARK', 'スパーク'],
    ['WAVE', 'ウェーブ'], ['PINE', 'パイン'], ['FIELD', 'フィールド'], ['MERIDIAN', 'メリディアン']
  ];

  const CORP_TYPES = {
    kabushiki: { id: 'kabushiki', label: '株式会社', prefix: '株式会社', suffix: '株式会社', position: true },
    yugen: { id: 'yugen', label: '有限会社', prefix: '有限会社', position: false },
    godo: { id: 'godo', label: '合同会社', prefix: '合同会社', position: false },
    gomei: { id: 'gomei', label: '合名会社', prefix: '合名会社', position: false },
    goshi: { id: 'goshi', label: '合資会社', prefix: '合資会社', position: false },
    none: { id: 'none', label: '屋号のみ', prefix: '', position: false }
  };

  // 数字を付けるときの候補。社名に数字が入るのは珍しくないが、多用すると不自然。
  const DIGITS = ['10', '21', '24', '88', '100', '101', '365', '2', '3'];

  const SCRIPT_IDS = ['kanji', 'katakana', 'hiragana', 'english'];

  // 一度に生成する上限。UI（app.js）の MAX_COUNT と揃える。
  const MAX_COUNT = 20;

  const DEFAULT_OPTIONS = {
    scripts: { kanji: true, katakana: true, hiragana: false, english: false },
    digits: false,
    length: { min: 3, max: 6 },
    corp: 'kabushiki',
    corpPosition: 'auto',
    industries: null, // null = すべて / [] = 業種接尾辞なし
    count: 10,
    seed: null
  };

  // ---------------------------------------------------------------------------
  // 乱数（シード固定で再現できる）
  // ---------------------------------------------------------------------------

  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seed) {
    const s = seed == null || seed === '' ? String(Math.random()) : String(seed);
    const rng = mulberry32(hashSeed(s));
    rng.seed = s;
    return rng;
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length) % arr.length];
  }

  // ---------------------------------------------------------------------------
  // 文字種ヘルパー
  // ---------------------------------------------------------------------------

  const RE_KANJI = /[\u4e00-\u9fff]/;
  const RE_HIRA = /[\u3041-\u309f]/;
  const RE_KATA = /[\u30a1-\u30ff]/;
  const RE_LATIN = /[A-Za-z]/;
  const RE_DIGIT = /[0-9]/;

  function scriptOfChar(ch) {
    if (RE_KANJI.test(ch)) return 'kanji';
    if (RE_HIRA.test(ch)) return 'hiragana';
    if (RE_KATA.test(ch)) return 'katakana';
    if (RE_LATIN.test(ch)) return 'english';
    if (RE_DIGIT.test(ch)) return 'digit';
    return 'other';
  }

  /** 文字列に含まれる文字種の集合（数字・記号は除く） */
  function scriptsIn(text) {
    const set = new Set();
    for (const ch of text) {
      const s = scriptOfChar(ch);
      if (s !== 'digit' && s !== 'other') set.add(s);
    }
    return set;
  }

  // ---------------------------------------------------------------------------
  // 名前の組み立て
  // ---------------------------------------------------------------------------

  /** 語のパーツ: { text, read } */
  function part(text, read) {
    return { text: text, read: read == null ? text : read };
  }

  function normalizeOptions(options) {
    const o = Object.assign({}, DEFAULT_OPTIONS, options || {});
    // scripts を渡されたら、それを唯一の正とする（省略した項目は「使わない」）。
    // 既定値と混ぜると「漢字だけ」を指定したのにカタカナが出る。
    const scripts = o.scripts
      ? { kanji: !!o.scripts.kanji, katakana: !!o.scripts.katakana, hiragana: !!o.scripts.hiragana, english: !!o.scripts.english }
      : Object.assign({}, DEFAULT_OPTIONS.scripts);
    const length = Object.assign({}, DEFAULT_OPTIONS.length, o.length || {});
    let min = Number.isFinite(length.min) ? Math.floor(length.min) : DEFAULT_OPTIONS.length.min;
    let max = Number.isFinite(length.max) ? Math.floor(length.max) : DEFAULT_OPTIONS.length.max;
    if (min < 1) min = 1;
    if (max < min) max = min;
    if (max > 20) max = 20;
    const allowed = SCRIPT_IDS.filter((id) => !!scripts[id]);
    return {
      scripts: scripts,
      allowedScripts: allowed,
      digits: !!o.digits,
      length: { min: min, max: max },
      corp: CORP_TYPES[o.corp] ? o.corp : DEFAULT_OPTIONS.corp,
      corpPosition: o.corpPosition === 'prefix' || o.corpPosition === 'suffix' ? o.corpPosition : 'auto',
      industries: Array.isArray(o.industries) ? o.industries.slice() : null,
      count: Math.max(1, Math.min(MAX_COUNT, Number.isFinite(o.count) ? Math.floor(o.count) : DEFAULT_OPTIONS.count)),
      seed: o.seed == null ? null : String(o.seed)
    };
  }

  /** 業種接尾辞の候補（文字種ごと）を取り出す */
  function suffixCandidates(opt, script) {
    const pools = [];
    const targets = INDUSTRIES.filter((ind) => {
      if (opt.industries === null) return true;
      return opt.industries.indexOf(ind.id) >= 0;
    });
    for (const ind of targets) {
      const list = ind[script === 'english' ? 'en' : script === 'katakana' ? 'kata' : 'kanji'];
      if (!list) continue;
      for (const w of list) pools.push({ industry: ind.label, industryId: ind.id, text: w[0], read: w[1] });
    }
    return pools;
  }

  /** 名称本体（法人種別を除く）の候補を1つ作る */
  function buildCore(rng, opt) {
    const allowed = opt.allowedScripts;
    const parts = [];
    const tags = [];

    // 主語（ベース）の文字種を選ぶ
    const baseScripts = allowed.filter((s) => s !== 'english' || allowed.indexOf('english') >= 0);
    // ひらがなだけは「ベース」専用。漢字・カタカナ・英字はベースにも接尾辞にもなれる。
    const basePool = baseScripts.filter((s) => s === 'kanji' || s === 'katakana' || s === 'hiragana' || s === 'english');
    if (basePool.length === 0) return null;
    const baseScript = pick(rng, basePool);

    let base;
    if (baseScript === 'kanji') {
      const useRegion = allowed.indexOf('kanji') >= 0 && rng() < 0.3;
      if (useRegion) {
        const r = pick(rng, REGIONS);
        parts.push(part(r[0], r[1]));
        tags.push('地名');
        base = pick(rng, KANJI_WORDS);
      } else {
        base = pick(rng, KANJI_WORDS);
      }
      parts.push(part(base[0], base[1]));
      tags.unshift('漢語');
    } else if (baseScript === 'katakana') {
      base = pick(rng, KATA_WORDS);
      parts.push(part(base[0], base[1]));
      tags.unshift('カタカナ');
    } else if (baseScript === 'hiragana') {
      base = pick(rng, HIRA_WORDS);
      parts.push(part(base[0], base[1]));
      tags.unshift('ひらがな');
    } else {
      base = pick(rng, EN_WORDS);
      let text = base[0];
      if (rng() < 0.35) text = text.charAt(0) + text.slice(1).toLowerCase();
      parts.push(part(text, base[1]));
      tags.unshift('英字');
    }

    // 数字を付ける（任意）。業種接尾辞の前に置くと「青葉88建設」のように自然になる。
    if (opt.digits && rng() < 0.5) {
      const d = pick(rng, DIGITS);
      parts.push(part(d, d));
      tags.push('数字');
    }

    // 業種接尾辞を付けるかどうか（付ける確率はベースの文字種で変える）
    const suffixChance = baseScript === 'hiragana' ? 0.18 : 0.55;
    if (rng() < suffixChance) {
      // 接尾辞の文字種は、選ばれている文字種から選ぶ（混在した社名を作れる）
      const suffixScripts = allowed.filter((s) => s !== 'hiragana');
      if (suffixScripts.length > 0) {
        const sScript = pick(rng, suffixScripts);
        const cands = suffixCandidates(opt, sScript);
        if (cands.length > 0) {
          const sfx = pick(rng, cands);
          // ひらがなベースに漢字接尾辞はぎりぎり「あり」。英字ベース＋漢字は避ける。
          const ok = !(baseScript === 'hiragana' && sScript === 'english') &&
            !(baseScript === 'english' && sScript === 'kanji');
          if (ok) {
            parts.push(part(sfx.text, sfx.read));
            tags.push(sfx.industry);
            if (sScript !== baseScript) tags.push('混在');
          }
        }
      }
    }

    const core = parts.map((p) => p.text).join('');
    const read = parts.map((p) => p.read).join('');
    return { core: core, read: read, parts: parts, tags: tags, baseScript: baseScript };
  }

  // 本体の末尾が「製作所」「有限会社」のような漢字のまとまりで終わると、
  // 後株（…製作所株式会社）が二重接尾辞のように見えて不自然になる。
  const KANJI_TAIL = /(製作所|工作所|工務店|事務所|不動産|診療所|株式会社|有限会社|合名会社|合資会社|合同会社)$/;

  /** 法人種別を前か後ろに付ける */
  function applyCorp(core, opt, rng) {
    const corp = CORP_TYPES[opt.corp];
    if (!corp || corp.id === 'none') return { full: core, position: 'none' };
    if (corp.position && opt.corpPosition === 'suffix') {
      return { full: core + corp.suffix, position: 'suffix' };
    }
    if (corp.position && opt.corpPosition === 'auto') {
      // 後株はやや少数派。3割くらいにする。
      // ただし本体が接尾辞で終わっているときは、ほぼ前株にする。
      const suffixChance = KANJI_TAIL.test(core) ? 0.05 : 0.3;
      if (rng() < suffixChance) return { full: core + corp.suffix, position: 'suffix' };
      return { full: corp.prefix + core, position: 'prefix' };
    }
    return { full: corp.prefix + core, position: 'prefix' };
  }

  /** 名前を1つ生成する。文字数の条件を満たすまで引き直す。 */
  function generateOne(rng, opt) {
    const { min, max } = opt.length;
    let closest = null;
    let closestDiff = Infinity;

    for (let attempt = 0; attempt < 400; attempt++) {
      const built = buildCore(rng, opt);
      if (!built || !built.core) continue;
      const len = Array.from(built.core).length;
      const diff = len < min ? min - len : len > max ? len - max : 0;
      if (diff === 0) {
        const corp = applyCorp(built.core, opt, rng);
        return {
          full: corp.full,
          core: built.core,
          read: built.read,
          position: corp.position,
          corp: CORP_TYPES[opt.corp].label,
          tags: built.tags.slice(),
          length: len,
          satisfied: true
        };
      }
      if (diff < closestDiff) {
        closestDiff = diff;
        const corp = applyCorp(built.core, opt, () => 0.9);
        closest = {
          full: corp.full,
          core: built.core,
          read: built.read,
          position: corp.position,
          corp: CORP_TYPES[opt.corp].label,
          tags: built.tags.slice(),
          length: len,
          satisfied: false
        };
      }
    }
    return closest;
  }

  /**
   * 会社名を生成する。
   * @returns {{seed:string, results:Array, unmetLength:boolean}}
   */
  function generateNames(options) {
    const opt = normalizeOptions(options);
    const rng = makeRng(opt.seed);
    const results = [];
    const seen = new Set();

    // 条件を満たす名前が作れない場合もある（例: 漢字だけ・12文字）。
    // そのときは「条件に一番近いもの」を返し、呼び出し側に unmetLength で知らせる。
    let guard = 0;
    while (results.length < opt.count && guard < opt.count * 80) {
      guard++;
      const r = generateOne(rng, opt);
      if (!r) break;
      // 本体が同じなら重複扱い（前株・後株の違いだけの2件を並べない）
      const key = r.core.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(r);
    }

    return {
      seed: rng.seed,
      results: results,
      unmetLength: results.some((r) => !r.satisfied)
    };
  }

  return {
    generateNames: generateNames,
    normalizeOptions: normalizeOptions,
    scriptsIn: scriptsIn,
    scriptOfChar: scriptOfChar,
    CORP_TYPES: CORP_TYPES,
    INDUSTRIES: INDUSTRIES.map((i) => ({ id: i.id, label: i.label })),
    SCRIPT_IDS: SCRIPT_IDS,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
  };
});
