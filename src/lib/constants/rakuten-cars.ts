/**
 * 楽天トラベルレンタカー用のエリアパスマッピング
 * キー: 地名キーワード（都道府県名・主要観光地）
 * 値: 楽天トラベルレンタカーのURLパス（{region}/{prefecture}）
 *
 * URL構造: https://cars.travel.rakuten.co.jp/cars/area/{region}/{prefecture}/
 */
export const RENTAL_CAR_AREA_PATHS: Record<string, string> = {
  // ===== 47都道府県 =====
  // 北海道
  北海道: 'hokkaido/hokkaido',

  // 東北
  青森: 'tohoku/aomori',
  青森県: 'tohoku/aomori',
  岩手: 'tohoku/iwate',
  岩手県: 'tohoku/iwate',
  宮城: 'tohoku/miyagi',
  宮城県: 'tohoku/miyagi',
  秋田: 'tohoku/akita',
  秋田県: 'tohoku/akita',
  山形: 'tohoku/yamagata',
  山形県: 'tohoku/yamagata',
  福島: 'tohoku/fukushima',
  福島県: 'tohoku/fukushima',

  // 関東
  茨城: 'kanto/ibaraki',
  茨城県: 'kanto/ibaraki',
  栃木: 'kanto/tochigi',
  栃木県: 'kanto/tochigi',
  群馬: 'kanto/gunma',
  群馬県: 'kanto/gunma',
  埼玉: 'kanto/saitama',
  埼玉県: 'kanto/saitama',
  千葉: 'kanto/chiba',
  千葉県: 'kanto/chiba',
  東京: 'kanto/tokyo',
  東京都: 'kanto/tokyo',
  神奈川: 'kanto/kanagawa',
  神奈川県: 'kanto/kanagawa',

  // 中部
  新潟: 'koshinetsu/niigata',
  新潟県: 'koshinetsu/niigata',
  富山: 'hokuriku/toyama',
  富山県: 'hokuriku/toyama',
  石川: 'hokuriku/ishikawa',
  石川県: 'hokuriku/ishikawa',
  福井: 'hokuriku/fukui',
  福井県: 'hokuriku/fukui',
  山梨: 'koshinetsu/yamanashi',
  山梨県: 'koshinetsu/yamanashi',
  長野: 'koshinetsu/nagano',
  長野県: 'koshinetsu/nagano',
  岐阜: 'tokai/gifu',
  岐阜県: 'tokai/gifu',
  静岡: 'tokai/shizuoka',
  静岡県: 'tokai/shizuoka',
  愛知: 'tokai/aichi',
  愛知県: 'tokai/aichi',

  // 近畿
  三重: 'kinki/mie',
  三重県: 'kinki/mie',
  滋賀: 'kinki/shiga',
  滋賀県: 'kinki/shiga',
  京都: 'kinki/kyoto',
  京都府: 'kinki/kyoto',
  大阪: 'kinki/osaka',
  大阪府: 'kinki/osaka',
  兵庫: 'kinki/hyogo',
  兵庫県: 'kinki/hyogo',
  奈良: 'kinki/nara',
  奈良県: 'kinki/nara',
  和歌山: 'kinki/wakayama',
  和歌山県: 'kinki/wakayama',

  // 中国
  鳥取: 'chugoku/tottori',
  鳥取県: 'chugoku/tottori',
  島根: 'chugoku/shimane',
  島根県: 'chugoku/shimane',
  岡山: 'chugoku/okayama',
  岡山県: 'chugoku/okayama',
  広島: 'chugoku/hiroshima',
  広島県: 'chugoku/hiroshima',
  山口: 'chugoku/yamaguchi',
  山口県: 'chugoku/yamaguchi',

  // 四国
  徳島: 'shikoku/tokushima',
  徳島県: 'shikoku/tokushima',
  香川: 'shikoku/kagawa',
  香川県: 'shikoku/kagawa',
  愛媛: 'shikoku/ehime',
  愛媛県: 'shikoku/ehime',
  高知: 'shikoku/kochi',
  高知県: 'shikoku/kochi',

  // 九州・沖縄
  福岡: 'kyushu/fukuoka',
  福岡県: 'kyushu/fukuoka',
  佐賀: 'kyushu/saga',
  佐賀県: 'kyushu/saga',
  長崎: 'kyushu/nagasaki',
  長崎県: 'kyushu/nagasaki',
  熊本: 'kyushu/kumamoto',
  熊本県: 'kyushu/kumamoto',
  大分: 'kyushu/oita',
  大分県: 'kyushu/oita',
  宮崎: 'kyushu/miyazaki',
  宮崎県: 'kyushu/miyazaki',
  鹿児島: 'kyushu/kagoshima',
  鹿児島県: 'kyushu/kagoshima',
  沖縄: 'okinawa/okinawa',
  沖縄県: 'okinawa/okinawa',

  // ===== 主要観光地・都市 =====
  // 北海道
  札幌: 'hokkaido/hokkaido',
  函館: 'hokkaido/hokkaido',
  小樽: 'hokkaido/hokkaido',
  旭川: 'hokkaido/hokkaido',
  富良野: 'hokkaido/hokkaido',
  美瑛: 'hokkaido/hokkaido',
  ニセコ: 'hokkaido/hokkaido',
  帯広: 'hokkaido/hokkaido',
  釧路: 'hokkaido/hokkaido',
  知床: 'hokkaido/hokkaido',
  洞爺湖: 'hokkaido/hokkaido',
  登別: 'hokkaido/hokkaido',
  トマム: 'hokkaido/hokkaido',

  // 東北
  仙台: 'tohoku/miyagi',
  松島: 'tohoku/miyagi',
  蔵王: 'tohoku/yamagata',
  銀山温泉: 'tohoku/yamagata',
  盛岡: 'tohoku/iwate',
  平泉: 'tohoku/iwate',
  角館: 'tohoku/akita',
  田沢湖: 'tohoku/akita',
  会津若松: 'tohoku/fukushima',
  猪苗代: 'tohoku/fukushima',
  十和田: 'tohoku/aomori',
  弘前: 'tohoku/aomori',
  奥入瀬: 'tohoku/aomori',

  // 関東
  横浜: 'kanto/kanagawa',
  鎌倉: 'kanto/kanagawa',
  箱根: 'kanto/kanagawa',
  湘南: 'kanto/kanagawa',
  江ノ島: 'kanto/kanagawa',
  川崎: 'kanto/kanagawa',
  浅草: 'kanto/tokyo',
  渋谷: 'kanto/tokyo',
  新宿: 'kanto/tokyo',
  池袋: 'kanto/tokyo',
  お台場: 'kanto/tokyo',
  成田: 'kanto/chiba',
  舞浜: 'kanto/chiba',
  房総: 'kanto/chiba',
  銚子: 'kanto/chiba',
  鴨川: 'kanto/chiba',
  川越: 'kanto/saitama',
  秩父: 'kanto/saitama',
  草津: 'kanto/gunma',
  伊香保: 'kanto/gunma',
  日光: 'kanto/tochigi',
  那須: 'kanto/tochigi',
  鬼怒川: 'kanto/tochigi',
  つくば: 'kanto/ibaraki',
  水戸: 'kanto/ibaraki',
  大洗: 'kanto/ibaraki',

  // 中部
  名古屋: 'tokai/aichi',
  熱海: 'tokai/shizuoka',
  伊豆: 'tokai/shizuoka',
  下田: 'tokai/shizuoka',
  浜松: 'tokai/shizuoka',
  富士: 'tokai/shizuoka',
  河口湖: 'koshinetsu/yamanashi',
  富士五湖: 'koshinetsu/yamanashi',
  清里: 'koshinetsu/yamanashi',
  甲府: 'koshinetsu/yamanashi',
  軽井沢: 'koshinetsu/nagano',
  上高地: 'koshinetsu/nagano',
  松本: 'koshinetsu/nagano',
  白馬: 'koshinetsu/nagano',
  諏訪: 'koshinetsu/nagano',
  飛騨高山: 'tokai/gifu',
  高山: 'tokai/gifu',
  白川郷: 'tokai/gifu',
  下呂: 'tokai/gifu',
  金沢: 'hokuriku/ishikawa',
  能登: 'hokuriku/ishikawa',
  和倉温泉: 'hokuriku/ishikawa',
  加賀: 'hokuriku/ishikawa',
  立山: 'hokuriku/toyama',
  黒部: 'hokuriku/toyama',
  越前: 'hokuriku/fukui',
  永平寺: 'hokuriku/fukui',
  佐渡: 'koshinetsu/niigata',
  越後湯沢: 'koshinetsu/niigata',

  // 近畿
  嵐山: 'kinki/kyoto',
  祇園: 'kinki/kyoto',
  宇治: 'kinki/kyoto',
  天橋立: 'kinki/kyoto',
  舞鶴: 'kinki/kyoto',
  梅田: 'kinki/osaka',
  難波: 'kinki/osaka',
  心斎橋: 'kinki/osaka',
  USJ: 'kinki/osaka',
  ユニバ: 'kinki/osaka',
  神戸: 'kinki/hyogo',
  有馬温泉: 'kinki/hyogo',
  城崎温泉: 'kinki/hyogo',
  姫路: 'kinki/hyogo',
  淡路島: 'kinki/hyogo',
  南紀白浜: 'kinki/wakayama',
  白浜: 'kinki/wakayama',
  熊野: 'kinki/wakayama',
  高野山: 'kinki/wakayama',
  那智: 'kinki/wakayama',
  伊勢: 'kinki/mie',
  志摩: 'kinki/mie',
  鳥羽: 'kinki/mie',
  琵琶湖: 'kinki/shiga',

  // 中国
  出雲: 'chugoku/shimane',
  松江: 'chugoku/shimane',
  玉造温泉: 'chugoku/shimane',
  倉敷: 'chugoku/okayama',
  尾道: 'chugoku/hiroshima',
  宮島: 'chugoku/hiroshima',
  呉: 'chugoku/hiroshima',
  しまなみ海道: 'chugoku/hiroshima',
  萩: 'chugoku/yamaguchi',
  下関: 'chugoku/yamaguchi',
  角島: 'chugoku/yamaguchi',
  皆生温泉: 'chugoku/tottori',
  大山: 'chugoku/tottori',
  境港: 'chugoku/tottori',

  // 四国
  高松: 'shikoku/kagawa',
  直島: 'shikoku/kagawa',
  小豆島: 'shikoku/kagawa',
  金刀比羅: 'shikoku/kagawa',
  道後温泉: 'shikoku/ehime',
  松山: 'shikoku/ehime',
  しまなみ: 'shikoku/ehime',
  今治: 'shikoku/ehime',
  四万十: 'shikoku/kochi',
  桂浜: 'shikoku/kochi',
  祖谷: 'shikoku/tokushima',
  鳴門: 'shikoku/tokushima',

  // 九州
  博多: 'kyushu/fukuoka',
  太宰府: 'kyushu/fukuoka',
  北九州: 'kyushu/fukuoka',
  門司港: 'kyushu/fukuoka',
  糸島: 'kyushu/fukuoka',
  長崎市: 'kyushu/nagasaki',
  ハウステンボス: 'kyushu/nagasaki',
  佐世保: 'kyushu/nagasaki',
  五島: 'kyushu/nagasaki',
  軍艦島: 'kyushu/nagasaki',
  阿蘇: 'kyushu/kumamoto',
  天草: 'kyushu/kumamoto',
  黒川温泉: 'kyushu/kumamoto',
  熊本市: 'kyushu/kumamoto',
  別府: 'kyushu/oita',
  由布院: 'kyushu/oita',
  湯布院: 'kyushu/oita',
  日田: 'kyushu/oita',
  高千穂: 'kyushu/miyazaki',
  青島: 'kyushu/miyazaki',
  日南: 'kyushu/miyazaki',
  指宿: 'kyushu/kagoshima',
  屋久島: 'kyushu/kagoshima',
  霧島: 'kyushu/kagoshima',
  桜島: 'kyushu/kagoshima',
  種子島: 'kyushu/kagoshima',
  奄美: 'kyushu/kagoshima',
  嬉野: 'kyushu/saga',
  唐津: 'kyushu/saga',
  呼子: 'kyushu/saga',
  武雄: 'kyushu/saga',

  // 沖縄
  那覇: 'okinawa/okinawa',
  石垣: 'okinawa/okinawa',
  石垣島: 'okinawa/okinawa',
  宮古島: 'okinawa/okinawa',
  宮古: 'okinawa/okinawa',
  恩納村: 'okinawa/okinawa',
  美ら海: 'okinawa/okinawa',
  国際通り: 'okinawa/okinawa',
  北谷: 'okinawa/okinawa',
  読谷: 'okinawa/okinawa',
  名護: 'okinawa/okinawa',
  久米島: 'okinawa/okinawa',
  西表島: 'okinawa/okinawa',
  竹富島: 'okinawa/okinawa',
  与那国: 'okinawa/okinawa',
}

/**
 * エリアパスから表示用県名への変換マッピング
 * Key: 楽天トラベルのエリアパス（region/prefecture）
 * Value: 表示用県名
 */
export const RAKUTEN_PREF_NAMES: Record<string, string> = {
  'hokkaido/hokkaido': '北海道',
  'tohoku/aomori': '青森県',
  'tohoku/iwate': '岩手県',
  'tohoku/miyagi': '宮城県',
  'tohoku/akita': '秋田県',
  'tohoku/yamagata': '山形県',
  'tohoku/fukushima': '福島県',
  'kanto/ibaraki': '茨城県',
  'kanto/tochigi': '栃木県',
  'kanto/gunma': '群馬県',
  'kanto/saitama': '埼玉県',
  'kanto/chiba': '千葉県',
  'kanto/tokyo': '東京都',
  'kanto/kanagawa': '神奈川県',
  'koshinetsu/niigata': '新潟県',
  'hokuriku/toyama': '富山県',
  'hokuriku/ishikawa': '石川県',
  'hokuriku/fukui': '福井県',
  'koshinetsu/yamanashi': '山梨県',
  'koshinetsu/nagano': '長野県',
  'tokai/gifu': '岐阜県',
  'tokai/shizuoka': '静岡県',
  'tokai/aichi': '愛知県',
  'kinki/mie': '三重県',
  'kinki/shiga': '滋賀県',
  'kinki/kyoto': '京都府',
  'kinki/osaka': '大阪府',
  'kinki/hyogo': '兵庫県',
  'kinki/nara': '奈良県',
  'kinki/wakayama': '和歌山県',
  'chugoku/tottori': '鳥取県',
  'chugoku/shimane': '島根県',
  'chugoku/okayama': '岡山県',
  'chugoku/hiroshima': '広島県',
  'chugoku/yamaguchi': '山口県',
  'shikoku/tokushima': '徳島県',
  'shikoku/kagawa': '香川県',
  'shikoku/ehime': '愛媛県',
  'shikoku/kochi': '高知県',
  'kyushu/fukuoka': '福岡県',
  'kyushu/saga': '佐賀県',
  'kyushu/nagasaki': '長崎県',
  'kyushu/kumamoto': '熊本県',
  'kyushu/oita': '大分県',
  'kyushu/miyazaki': '宮崎県',
  'kyushu/kagoshima': '鹿児島県',
  'okinawa/okinawa': '沖縄県',
}

/**
 * テキストからエリアパスを検索する
 * @param text 検索対象テキスト（タイトル、目的地など）
 * @returns [マッチした地名, エリアパス] または null
 */
export function findAreaPath(text: string): [string, string] | null {
  // 長いキーワードから優先的にマッチさせる（「神奈川県」→「神奈川」の順）
  const sortedKeys = Object.keys(RENTAL_CAR_AREA_PATHS).sort(
    (a, b) => b.length - a.length
  )

  for (const keyword of sortedKeys) {
    if (text.includes(keyword)) {
      return [keyword, RENTAL_CAR_AREA_PATHS[keyword]]
    }
  }

  return null
}

/**
 * 楽天トラベルレンタカーのエリアページURLを生成する
 * @param areaPath エリアパス（null の場合はトップページ）
 * @returns 楽天トラベルレンタカーURL
 */
export function generateRentalCarUrl(areaPath: string | null): string {
  if (areaPath) {
    return `https://cars.travel.rakuten.co.jp/cars/area/${areaPath}/`
  }
  return 'https://cars.travel.rakuten.co.jp/cars/'
}
