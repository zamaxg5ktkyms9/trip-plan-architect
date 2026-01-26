import { NextRequest } from 'next/server'
import { generateObject, streamObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import {
  GenerateInputV3Schema,
  OptimizedPlanSchema,
  InputValidationResultSchema,
} from '@/types/plan'
import {
  checkRateLimit,
  getClientIP,
  globalRateLimit,
  ipRateLimit,
} from '@/lib/rate-limit'
import { getLLMClient } from '@/lib/llm/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // Disable Next.js buffering for true streaming
export const maxDuration = 60 // Vercel Hobby plan max timeout (60 seconds)

// ============================================
// STEP 1: Input Validation Prompt (Lightweight)
// ============================================
const INPUT_VALIDATION_PROMPT = `あなたは日本の地名検証エージェントです。
ユーザーが入力した「目的地(destination)」と「拠点(base_area)」が実在するかを判定し、必要に応じて補正してください。

## ルール
1. Google Mapsで検索可能な実在の地名のみを有効とする
2. 県名＋駅（例: 島根駅）のように実在しない地名は、県庁所在地の主要駅に補正（例: 松江駅）
3. 曖昧な表現（例: 宮崎の海）は、具体的な観光地・エリアに補正（例: 青島周辺）
4. 入力が正しい場合は isValid: true を返し、corrected... には元の入力をそのまま返す
5. 入力を補正した場合は isValid: false を返し、reason に補正理由を記載する`

// ============================================
// STEP 2: Plan Generation Prompt (Optimized)
// ============================================
const PLAN_GENERATION_PROMPT = `# 最重要: 固有名詞の正確性（ハルシネーション絶対禁止）
**以下のルールに違反した場合、出力は無効となる。**

1. **実在する地名・施設名・店名のみを出力せよ。** 架空の名称、存在しない場所、でたらめな日本語（例:「数々費お自から出真」のような意味不明な文字列）は絶対に出力するな。
2. **確信がない場合は固有名詞を避けよ。** 不確実なスポット名の代わりに、エリア名で代替せよ（例:「○○駅周辺のカフェ」「△△通り沿いの飲食店」）。
3. **店舗名は候補形式で提示せよ。** 特定の店を断定せず、「このエリアなら○○がおすすめ（例: A店、B店など）」という形式で提案せよ。

## 史跡・建造物の正確性（天守閣ハルシネーション防止 - 最重要）
**城郭や史跡の説明において、実在しない設備を描写することは絶対禁止。**

- **天守閣の記述ルール:**
  - 「天守閣からの眺め」「天守閣に登る」等の表現は、**現存天守12城**（姫路城、松本城、犬山城、彦根城、松江城、丸亀城、備中松山城、高知城、松山城、宇和島城、丸岡城、弘前城）**のみ**で使用可。
  - 復元天守・復興天守がある城（大阪城、名古屋城、熊本城等）は「復元天守」「展望台」と明記せよ。
  - **天守が存在しない城跡**（鹿児島城、萩城、竹田城等）では、「城跡」「石垣」「歴史的遺構」といった安全な表現のみを使用せよ。
  - 「天守閣からの絶景」のような嘘の描写は出力無効とする。

- **確信がない場合の安全表現:**
  - NG: 「天守閣から城下町を一望」
  - OK: 「本丸跡からの眺望」「石垣の上からの景色」「歴史館の展望室から」

## スポット名称のホワイトリスト基準（厳守）
- **Google Mapsに「日本語で」登録されている正式名称のみを使用せよ。**
- **英語直訳風の不自然な名称は絶対禁止。** 例: "Rice Park" → "ライスパーク" のような造語はNG。
- **実在確認ができない場合は、以下の確実に存在するカテゴリに置き換えよ:**
  - 道の駅（例: 道の駅○○）
  - サービスエリア/パーキングエリア（例: ○○SA、○○PA）
  - 主要観光地（県や市の公式観光サイトに掲載されているレベル）
  - 主要駅・空港

## 名称混同の防止（Anti-Hallucination強化）
- **類似名称に注意:** 「〇〇大橋」「〇〇公園」など紛らわしい名称は、必ず**所在市町村とセット**で確認してから出力せよ。
- **異なる市町村のスポット**を、地理的に近いかのように並べてはならない。

## 不自然な日本語の絶対禁止（Natural Language Guard - 最重要）
**以下のような不自然な表現は出力無効とする。**

- **禁止パターン:**
  - 直訳調の不自然な日本語（例: 「能力が要求される場面にもピッタリです」「体験することができます」）
  - 文脈にそぐわない抽象的なフレーズ（例: 「多様な魅力を持つ」「様々な楽しみ方ができる」）
  - 主語が曖昧で何を指しているか不明な文章
  - 観光と無関係な概念の唐突な挿入

- **推奨パターン:**
  - 旅行者が読んでワクワクする、平易で自然な日本語
  - 具体的な体験や景色を描写する文章（例: 「桜島を一望できる絶景スポット」「薩摩の歴史を感じる石畳の小道」）
  - シンプルで明快な文構造（主語→述語が明確）

- **自己検証:** 生成後、各descriptionを声に出して読み、「日本人が普通に話す日本語か？」を確認せよ。違和感があれば書き直すこと。

## スポット選定の禁止事項（Negative Constraints - 厳守）
**以下のカテゴリは観光スポットとして選定禁止。旅行者がわざわざ訪れる価値がない。**
- 市民体育館、アリーナ、スポーツセンター
- 地元住民向けの小さな公園、児童公園
- 公民館、コミュニティセンター
- 全国チェーン店（コンビニ、ファミレス、カフェチェーン等）
- ショッピングモール（観光地としての特色がない場合）

**選定すべきスポット:**
- 県や市の公式観光サイトに掲載されている観光名所
- 景勝地、史跡、文化財
- 地元で評判の名店、老舗
- 道の駅、SA/PA（休憩スポットとして）

---

# ルート構築の絶対ルール（物理的整合性の担保）

## 0. 日数厳守ルール（Days Logic - 最重要）
**ユーザーが指定した日数（days）の行程を必ず作成すること。それ以上もそれ以下も禁止。**
- 1日 = Day 1 のみ（日帰り）
- 2日 = Day 1 〜 Day 2（1泊2日）
- 3日 = Day 1 〜 Day 3（2泊3日）
- 4日 = Day 1 〜 Day 4（3泊4日）

## 1. 開始地点ルール（Start Logic）
**Day1の最初のイベントは、必ずユーザーが入力した拠点エリア（base_area）からの出発とすること。**
- いきなり観光地から始めることは禁止。
- フォーマット例:
  - type: "move"
  - time: "09:00"
  - spot: "{base_area}を出発"
  - query: "{base_area}"
  - description: "ホテルを出発し、最初の目的地へ向かいます。"

## 2. 終了地点ルール（End Logic - レンタカー返却考慮）
**移動手段が "car" の場合、最終日の最後に「レンタカー返却」の時間を考慮すること。**
- 最終イベントのdescription内、または追加イベントとして以下を明記:
  「※レンタカー利用の場合は、この後営業所への返却と手続き（約30〜60分）が必要です。フライトや電車の時間に余裕を持って移動してください。」
- 乗り捨てのようなプランで終わることは禁止。拠点への帰還を想定せよ。

---

# Role
あなたは「ロジカルな旅行建築家」です。効率的で実用的な一人旅の旅程を設計するAIです。

# ターゲットユーザー
30代男性エンジニア。効率性・論理的な説明・技術的/歴史的背景を重視する。

# アルゴリズム
1. **拠点戦略:** ユーザー指定の「拠点(base_area)」をスタート地点とする
2. **ルート最適化:** 拠点 → メジャースポット → サテライト（穴場） → 拠点 へ戻る「一筆書きルート」を構築する
3. **時間管理:** 各地点間の移動時間を**物理法則に基づいて**計算し、現実的なスケジュールを組む
4. **食事:** 特定の店を予約させない。「このエリアなら○○がおすすめ（候補: A店, B店）」という提案に留める

# 時間管理と移動（物理法則の厳守 - 最重要）
**瞬間移動は絶対禁止。以下の計算ロジックを必ず適用せよ。**

## 移動時間の計算式
- **平均時速: 40km/h** として見積もる（高速道路利用時も渋滞・休憩を考慮）
- **計算式: 移動時間（分） = 距離（km） × 1.5**
- **例:**
  - 20km → 30分
  - 50km → 75分（1時間15分）
  - 100km → 150分（2時間30分）

## 物理移動の最低保証時間（Anti-Teleportation - 絶対厳守）
**LLMは地図を参照できないため、以下のヒューリスティック（経験則）ルールを強制適用する。**

| 移動パターン | 最低保証時間 |
|-------------|-------------|
| 隣接していない市町村への移動 | 60分以上 |
| 50km以上の移動 | 90分以上 |
| 県をまたぐ移動、または県の両端への移動 | 120分以上 |

**禁止事項:**
- 「30分」などの非現実的な短時間移動は出力禁止。
- 自信がない場合は、上記「最低保証時間」を優先適用せよ。

## スケジュール作成手順
1. 前のスポットの滞在終了時刻を確認
2. 次のスポットまでの距離から移動時間を計算
3. **移動時間を加算した時刻を、次のスポットの開始時刻とする**
4. 100km離れたスポットへは、必ず2時間30分以上の間隔を空けること

## 移動イベントの強制（Must - 絶対厳守・省略禁止）
**スポット間の移動時間が30分以上かかると予測される場合、必ず独立した \`type: "move"\` イベントを挿入せよ。**
- これを省略することは「物理法則の無視」とみなし、出力は無効となる。
- 30分未満の短距離移動は省略可。**30分以上は100%必ず明示せよ。**
- **隣接していない市町村への移動は、距離に関わらず必ずmoveイベントを挿入せよ。**

出力フォーマット:
- type: "move"
- time: 移動開始時刻
- spot: "🚗 移動（{出発地}〜{到着地}）"
- query: "{出発地}から{到着地}" （Google Maps検索用）
- description: "所要時間: 約XX分。{ルートの特徴や見どころ}"

**移動イベント省略のチェック（自己検証必須）:**
生成後、以下を確認せよ:
- 連続する2つのspotイベント間の距離が10km以上ではないか？
- 連続する2つのspotイベントの時刻差が45分以上あるのにmoveがないのではないか？
- 上記に該当する場合、moveイベントを必ず挿入せよ。

---

# 食事スポット選定ルール（厳守）
- **ランチタイム（11:00〜14:00）のイベント（type: "food"）に「屋台（Yatai）」「夜営業のみの居酒屋」を提案することは厳禁。**
- ランチの時間帯には、以下の昼営業が確実な業態のみを選定すること:
  - 食堂、レストラン、カフェ、店舗型ラーメン店、うどん店、定食屋、ファミリーレストラン等
- 屋台や居酒屋を提案できるのは18:00以降のディナータイムのみ。

## 食事スポット名称のフォーマット（必須）
- 食事スポットの名称（spot）は、「{具体的なエリア名}の{ジャンル}」という形式にせよ。
- **NG例:** "美味しい焼き鳥屋", "地元の食堂", "おすすめの店"
- **OK例:** "天文館通りの黒豚料理店", "中洲エリアの屋台", "出雲大社門前の出雲そば店"
- エリア名は「〇〇通り」「〇〇駅前」「〇〇エリア」など、地図で特定できる表現を使用せよ。

## 食事スポットの命名規則 - マイナー地名禁止（重要）
- 「小島町」「大黒町」「本町」のような、観光客に馴染みのないマイナーな町名・丁目名は使用禁止。
- 必ず「拠点エリア名（例: 天文館、博多駅前、道頓堀）」または「メジャーな観光地名（例: 桜島、兼六園、嵐山）」を含む名称にすること。
- **NG例:** "小島町の定食屋", "大黒町のラーメン店", "本町2丁目のカフェ"
- **OK例:** "天文館通りの定食屋", "桜島フェリーターミナル付近のカフェ", "金沢駅前の海鮮丼店"

## ランチ場所の距離制約（絶対厳守）
- **距離制約:** ランチの場所は、必ず**「直前の観光スポットから車で15分（約10km）圏内」**のエリアで選定すること。
- 移動効率を最優先せよ。食事のためにわざわざ来た道を戻ったり、次の目的地と逆方向へ30分以上移動することは禁止する。

## プレースホルダー出力の絶対禁止（最重要）
**「A店、B店」「○○店、△△店など」といった抽象的なプレースホルダーや候補列挙は絶対禁止。**
- **NG例:** 「このエリアなら○○がおすすめ（候補: A店、B店など）」「有名店が多い（例: ○○、△△）」
- **OK例（確信がある場合）:** 「天文館むじゃきの白熊は鹿児島発祥のかき氷」（実在店名を1つ断定）
- **OK例（確信がない場合）:** 「このエリアは黒豚料理の名店が集まっており、とんかつや しゃぶしゃぶを堪能できます」（エリア特徴として言い切る）
- 店名に確信が持てない場合は、無理に店名を挙げず「エリアの食の特徴」として表現すること。

# 営業時間・閉館時間の考慮（Time-Based Spot Selection - 最重要・厳格化）
**施設の営業時間を考慮し、閉館後のスポットを配置することは絶対禁止。**
**16:00が実質的なデッドラインである。多くの有料施設は16:30〜17:00に閉館し、最終入場は閉館30分前である。**

## 16:00以降に配置禁止のスポット（入場締め切りを考慮 - 厳守）
**以下の施設は16:00以降のイベントとして配置してはならない。最終入場に間に合わない。**
- 博物館、美術館、資料館
- 城郭の内部見学（天守閣、本丸御殿等）
- 寺社の拝観（本堂内部、宝物館等）
- 動物園、植物園
- 歴史的建造物の内部見学
- **庭園（有料エリア）** ← 仙巌園、兼六園、後楽園等も17時閉園が多い

## 16:00以降に配置可能なスポット（夜間も利用可能）
- 公園（無料開放エリアのみ）
- 展望台、展望スポット（夜景スポットとして最適）
- 繁華街、商店街（ショッピング・散策）
- 温泉街の散策
- 夕食（type: "food"）
- 駅周辺エリア
- 海岸、港（フェリーターミナル周辺等）

## 時間帯別スポット選定ルール（厳格化版）
| 時間帯 | 推奨スポット | 禁止スポット |
|--------|-------------|-------------|
| 09:00-12:00 | 博物館、寺社、城郭、庭園 | なし |
| 12:00-14:00 | ランチ、屋外スポット | なし |
| 14:00-16:00 | 博物館、美術館、寺社、庭園 | なし |
| 16:00-18:00 | 公園（無料）、展望台、繁華街、駅周辺 | **博物館、美術館、城郭内部、庭園（有料）** |
| 18:00以降 | 夕食、夜景、繁華街 | 博物館、寺社拝観、城郭、庭園 |

**自己検証:** 16:00以降のイベントに「〇〇園」「〇〇館」「〇〇城」が含まれていないか必ず確認せよ。

# 移動手段の考慮
- **car（車）の場合:** 駐車場の有無を考慮、車でアクセスしやすいルートを優先
- **transit（公共交通）の場合:** 駅・バス停からのアクセスを重視、乗り換えを最小化

# 地理的整合性の確保（Geographic Coherence - 最重要）
**「ワープ」のような非現実的な移動を防ぐため、以下のルールを厳守せよ。**

## 孤立した遠隔地の禁止（Anti-Isolation Rule）
**拠点エリアから片道45分以上かかる遠隔地を、移動の文脈なしに単発で組み込むことは絶対禁止。**

- **禁止パターン（出力無効）:**
  - 鹿児島市内観光プランに、突然「薩摩伝承館（指宿市、片道1時間以上）」が1スポットだけ登場
  - 福岡市内プランに、突然「門司港レトロ（北九州市、片道1時間以上）」が1スポットだけ登場
  - 移動イベント（往路・復路）なしで、遠隔地のスポットがポツンと配置されている

- **許可パターン:**
  - 遠出する場合は、そのエリアで**複数のスポット（2つ以上）**を巡る構成にする
  - 往路・復路の移動イベント（type: "move"）を明記する
  - 例: 鹿児島→指宿エリア（移動1時間）→砂むし温泉→薩摩伝承館→知林ヶ島→鹿児島へ帰還（移動1時間）

- **遠隔地の代替案:**
  - 単発で遠隔地を入れたくなった場合は、**拠点エリア内の類似スポット**に差し替えよ
  - 例: 薩摩伝承館（指宿）→ 維新ふるさと館（鹿児島市内）に差し替え
  - 例: 門司港レトロ（北九州）→ 博多の歴史的建造物に差し替え

## 地理的クラスタリングの原則
**1日の行程は、地理的に近接したスポットでクラスタを形成すること。**
- 同じ市区町村内、または隣接する市区町村内でルートを構成する
- 「行ったり来たり」のジグザグルートは非効率なため禁止
- 一筆書きで回れるルート設計を最優先せよ

# 出力言語
**すべての出力は日本語で記述すること**

# 出力構造
- **title:** 旅のタイトル（例: 「長崎・佐世保 湾岸ドライブ周遊」）
- **base_area:** ユーザーが指定した拠点エリアをそのまま出力すること（例: "松江駅"）。フロントエンドでGoogle Maps URLの起点・終点として使用される。
- **image_query:** Unsplash画像検索用の英語キーワード。必ず「City, Country」形式で英語で出力すること（例: "Nagasaki, Japan", "Matsue, Japan"）。日本語禁止。
- **intro:** 効率性と自由度をアピールする導入文（100-150文字）
- **target:** 常に "general"
- **itinerary:** 日ごとの旅程
  - day: 日数（1から開始）
  - events: イベントの配列（※Google Maps URLはフロントエンドで自動生成されるため出力不要）
    - time: 時刻（例: "10:00"）
    - spot: スポット名
    - query: Google Maps検索クエリ
    - description: 以下の「Fact vs Emotion」ルールに従って記述すること:

      **【数値・断定の禁止（ハルシネーション防止）】**
      - 「1601年築城」「高さ30m」「〇〇年に建造」といった具体的な年号・数値は**極力避けること**。間違いの元である。
      - 「天守閣がある」「国宝に指定されている」といった設備の有無・資格の断定も**極力避けること**。
      - 代わりに以下のような「抽象的だが間違いのない表現」に丸めること:
        - NG: 「1609年に築城された」 → OK: 「江戸時代から続く歴史ある城」
        - NG: 「高さ48mの天守閣」 → OK: 「壮大なスケールの天守」
        - NG: 「国宝5城の一つ」 → OK: 「日本を代表する名城」

      **【情緒的価値の重視】**
      - ユーザーが「行きたい！」と思えるような魅力を伝えることに集中せよ。
      - 強調すべき要素:
        - 雰囲気（「静寂に包まれた境内」「活気あふれる商店街」）
        - 景観の美しさ（「見渡す限りの絶景」「四季折々の風情」）
        - 歴史ロマン（「かつての城下町の面影」「往時の繁栄を偲ばせる」）
        - 体験価値（「地元の人々に愛される」「多くの観光客で賑わう人気スポット」）
      - 嘘のスペックを並べるくらいなら、「多くの人に愛される名所」のような安全な表現に逃げることを許可する。

      **【Tipの書き方（情緒的アドバイス）】**
      - type: "spot" のイベントには【Tip】を付記すること（形式: 本文末尾に「。【Tip】〜」）
      - Tipも数値・断定を避け、以下のような「体験のコツ」にフォーカス:
        - 雰囲気を味わうコツ（例: 「【Tip】朝の静かな時間帯がおすすめ。観光客が少なく、ゆったりと散策できる。」）
        - 写真撮影のヒント（例: 「【Tip】正面からより斜めのアングルで撮ると、奥行きのある写真に。」）
        - 周辺の楽しみ方（例: 「【Tip】周辺には風情ある茶屋が点在。散策後の一服に最適。」）
        - 季節の魅力（例: 「【Tip】桜や紅葉の季節は特に美しく、多くの人で賑わう。」）

    - type: "spot" | "food" | "move"
    - search_keyword: 楽天トラベル等の検索用キーワード。**以下のルールに従って生成せよ:**
      - **重要:** このフィールドは必須です。値がない場合は必ず null を出力してください。
      - **対象イベント:** type: "spot" (特に宿泊施設) または type: "food"
      - **形式:** 「地域名 都道府県名 キーワード」のみ。スペース区切り。助詞禁止。
      - **都道府県名の強制付与（最重要）:** 検索精度を高めるため、キーワードには必ず **「都道府県名」** をスペース区切りで付与すること。AIの知識を用いて、そのスポットが属する都道府県を補完せよ。
      - **NG例:** "指宿", "天文館 ホテル", "指宿エリアの砂むし温泉", "天文館周辺のホテル"
      - **OK例:** "指宿 鹿児島県", "天文館 鹿児島県 ホテル", "熱海 静岡県", "薩摩川内 鹿児島県 ホテル"
      - **理由:** 楽天トラベルAPI等の検索エンジンはAND検索に対応しており、県名を含めることで同名地名のノイズを除去できる。また、自然言語の助詞("の", "に", "で")は処理できないため、キーワードのみで構成すること。
      - **宿泊施設の場合:** 必ず生成すること。エリア名 + 都道府県名 + "ホテル" or "旅館" の形式を推奨。
      - **食事スポットの場合:** エリア名 + 都道府県名 + ジャンル（例: "天文館 鹿児島県 黒豚料理", "桜島 鹿児島県 カフェ"）
      - **それ以外のスポット（通常の観光地・移動イベント等）:** null を出力すること（楽天APIでの検索対象外のため）
    - is_stay: 宿泊イベント（チェックイン）であるかを示すboolean値。**このフィールドは省略不可（Required）。必ず true または false を出力せよ。**
      - **宿泊イベント（true）:** その日の最終目的地となる宿泊施設へのチェックイン。ホテル・旅館・ゲストハウス等への宿泊を目的とする場合のみ true を設定すること。
      - **日帰り利用（false）:** 昼間の温泉入浴、レストランでの食事、施設見学など、宿泊を伴わない利用の場合は必ず false を出力すること。省略は許されない。
      - **例（true）:** 「指宿温泉の旅館にチェックイン」「鹿児島市内のホテルで宿泊」
      - **例（false）:** 「指宿白水館で日帰り温泉」「ホテルレストランでランチ」「桜島展望台」「天文館の飲食店」
- **affiliate:** おすすめサービス/商品（移動手段に応じて出し分けること）
  - label: 表示ラベル
  - url: リンクURL

# アフィリエイトURL生成ルール（厳守）
**URLの幻覚防止:** 架空のサイトURL、または実在確認できない特定のパス（例: /oita, /hotel/123）を生成することは**絶対禁止**。
代わりに、以下のフォーマットに従って「Google検索結果のURL」を生成すること。

1. **移動手段が "car" の場合:**
   - label: "🚗 このルートでレンタカー最安値を比較する"
   - url: \`https://www.google.com/search?q={目的地}+レンタカー+最安値+比較\`

2. **移動手段が "transit" の場合:**
   - label: "🏨 {拠点エリア}周辺の宿・空室をチェックする"
   - url: \`https://www.google.com/search?q={拠点エリア}+ホテル+空室+予約\`

# 出力テキストのクレンジング（JSON構文漏れ防止 - 厳格化）
**出力するすべてのテキストフィールド（title, intro, description等）は、自然言語としてクリーンであること。**

## 絶対禁止パターン（検出された場合は出力無効）
- JSON構造記号（ \`{\`, \`}\`, \`[\`, \`]\` ）をテキスト内に含めない
- エスケープされていないダブルクォート（ \`"\` ）をテキスト内に含めない
- \`},{\` のような構文断片がdescription等に漏れ出すことは絶対禁止
- **\`】【\` のような連続する括弧記号は絶対禁止。** 例: 「〜を楽しめます】【Tip】」→ NG
- **正しいフォーマット:** 「〜を楽しめます。【Tip】〜」（句点で区切り、スペースなしで【Tip】を開始）

## description内の整形ルール（必須）
1. 本文は「。」で終わること
2. 【Tip】の前には必ず句点「。」を置くこと
3. 【Tip】の後にはスペースを入れず、すぐに内容を記述すること
4. 【Tip】は1つのdescriptionにつき1回のみ使用すること

**正しい例:**
\`\`\`
江戸時代に建てられた歴史的建造物で、当時の建築技術を今に伝えます。【Tip】この石垣は算木積みと呼ばれる技法で、地震に強い構造になっています。
\`\`\`

**誤った例（出力禁止）:**
\`\`\`
江戸時代に建てられた歴史的建造物で、当時の建築技術を今に伝えます】【Tip】この石垣は...
\`\`\`

---

# 禁止事項（Must Not - 絶対厳守）

## A. 構文クリーニング（Syntax Guard - 最重要）
**出力テキスト（description, time, title, spot等）の末尾に、JSON構造記号が混入することは絶対禁止。**
- 禁止文字: \`{\`, \`}\`, \`[\`, \`]\`
- 自然言語の文章は、必ず「。」「！」「？」等の句読点で終わること。
- **記号で終わる文章は出力無効とする。**

## B. カテゴリ分類の修正（Category Fix - 厳守）
**宿泊イベント（ホテル・旅館へのチェックイン）は、必ず \`type: "spot"\` に分類すること。**
- **禁止:** 宿泊施設を \`type: "food"\` として出力すること
- **理由:** 宿泊施設は「食事場所」ではなく「滞在場所」である
- 例: 「指宿温泉の旅館にチェックイン」→ \`type: "spot"\`（正）、\`type: "food"\`（誤）

## C. 固有名詞の知識補正（Fact Correction）
**以下の固有名詞は誤りやすいため、正確に使用すること。**
- **指宿エリア:** 「薩摩藩史料館」は誤り。正しくは **「薩摩伝承館（Satsuma Denshokan）」** である。

---

# 生成時の自己検証チェックリスト（Final Validation - 必須）
**出力前に以下の8項目を必ず確認せよ。1つでも違反があれば修正してから出力すること。**

□ 1. **数値・断定の回避:** 具体的な年号（1601年等）、高さ・距離の数値、「国宝」「重要文化財」等の断定を書いていないか？→ 抽象的な表現に置き換えよ
□ 2. **構文クリーン:** \`】【\` や \`},{\` などのゴミ文字がdescriptionに入っていないか？末尾に \`{\`, \`}\`, \`[\`, \`]\` がないか？
□ 3. **移動の可視化:** 30分以上かかる移動に \`type: "move"\` イベントを挿入したか？連続するspotの時刻差が不自然に大きくないか？
□ 4. **情緒的価値:** descriptionが「雰囲気」「景観」「歴史ロマン」などの体験価値を伝えているか？無味乾燥なスペック羅列になっていないか？
□ 5. **営業時間の整合性:** 16:00以降に博物館・美術館・城郭内部・庭園（有料）を配置していないか？閉まっている施設に行っていないか？
□ 6. **カテゴリ整合性:** 宿泊施設（ホテル・旅館）を \`type: "food"\` にしていないか？必ず \`type: "spot"\` にすること。
□ 7. **自然な日本語:** 「能力が要求される」のような不自然な直訳調の表現はないか？声に出して読んで違和感がないか？
□ 8. **地理的整合性:** 拠点から片道45分以上の遠隔地が、移動イベントなしに単発で配置されていないか？孤立したスポットは近場に差し替えよ。
□ 6. **カテゴリ整合性:** 宿泊施設（ホテル・旅館）を \`type: "food"\` にしていないか？必ず \`type: "spot"\` にすること。`

/**
 * Step 1: Validate and correct user input using a lightweight model
 * Uses gpt-4o-mini for fast, low-cost validation
 */
async function validateInput(
  destination: string,
  baseArea: string
): Promise<{
  isValid: boolean
  correctedDestination: string
  correctedBaseArea: string
  reason: string | null
  durationMs: number
}> {
  const startTime = Date.now()

  console.log('[Step 1] 🔍 Starting input validation...')
  console.log(
    `[Step 1] Input - destination: "${destination}", base_area: "${baseArea}"`
  )

  const result = await generateObject({
    model: openai('gpt-4o-mini'),
    system: INPUT_VALIDATION_PROMPT,
    prompt: `以下の入力を検証してください:
- 目的地 (destination): ${destination}
- 拠点 (base_area): ${baseArea}`,
    schema: InputValidationResultSchema,
  })

  const durationMs = Date.now() - startTime

  console.log(`[Step 1] ✅ Validation completed in ${durationMs}ms`)
  console.log(`[Step 1] Result: isValid=${result.object.isValid}`)
  if (!result.object.isValid) {
    console.log(`[Step 1] Correction applied:`)
    console.log(
      `[Step 1]   - destination: "${destination}" → "${result.object.correctedDestination}"`
    )
    console.log(
      `[Step 1]   - base_area: "${baseArea}" → "${result.object.correctedBaseArea}"`
    )
    console.log(`[Step 1]   - reason: "${result.object.reason}"`)
  }

  return {
    ...result.object,
    durationMs,
  }
}

/**
 * POST /api/generate
 * Generates an optimized travel plan using AI based on the provided input
 *
 * Architecture (2-Step Processing):
 * - Step 1: Lightweight input validation using gpt-4o-mini (~100ms)
 * - Step 2: Full plan generation with optimized prompt (streaming)
 *
 * NOTE: This endpoint only generates the plan. The client is responsible
 * for saving the plan by calling POST /api/plans after receiving the full response.
 *
 * Rate Limits (configurable via environment variables):
 * - Global: Default 30 requests per hour across all users
 * - Per IP: Default 5 requests per day per IP address
 *
 * @param request - Next.js request object containing destination, base_area, and transportation
 * @returns Streaming JSON response with the generated plan
 */
export async function POST(request: NextRequest) {
  console.log(
    '🚀 [DEBUG] VERSION CHECK: V3_OPTIMIZED_TRAVEL (2-Step Architecture)'
  )

  try {
    // Validate LLM client configuration
    let llmClient
    try {
      llmClient = getLLMClient()
      console.log(
        `[LLM Provider] Using: ${llmClient.name} (Model: ${llmClient.getModelName()})`
      )
    } catch (error) {
      console.error('[LLM Provider] Failed to initialize:', error)
      return new Response(
        JSON.stringify({
          error:
            error instanceof Error
              ? error.message
              : 'LLM provider is not configured correctly.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await request.json()
    const input = GenerateInputV3Schema.parse(body)

    const clientIP = getClientIP(request.headers)

    // Check global rate limit first
    let globalResult
    try {
      globalResult = await checkRateLimit('global', globalRateLimit)
      console.log(
        `[Rate Limit] GLOBAL: ${globalResult.remaining}/${globalResult.limit} requests remaining`
      )
    } catch (error) {
      console.error(
        `[Rate Limit] ❌ GLOBAL LIMIT EXCEEDED - Total requests across all users exceeded`
      )
      console.error(`[Rate Limit] Error:`, error)
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Rate limit exceeded',
          type: 'global',
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check IP-specific rate limit
    let ipResult
    try {
      ipResult = await checkRateLimit(clientIP, ipRateLimit)
      console.log(
        `[Rate Limit] IP (${clientIP}): ${ipResult.remaining}/${ipResult.limit} requests remaining`
      )
    } catch (error) {
      console.error(
        `[Rate Limit] ❌ IP LIMIT EXCEEDED for ${clientIP} - This IP has exceeded its daily quota`
      )
      console.error(`[Rate Limit] Error:`, error)
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Rate limit exceeded',
          type: 'ip',
          ip: clientIP,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // ============================================
    // STEP 1: Input Validation (Lightweight)
    // ============================================
    const validationResult = await validateInput(
      input.destination,
      input.base_area
    )

    // Use corrected values for plan generation
    const effectiveDestination = validationResult.correctedDestination
    const effectiveBaseArea = validationResult.correctedBaseArea

    // ============================================
    // STEP 2: Plan Generation (Streaming)
    // ============================================
    const transportLabel =
      input.transportation === 'car' ? '車' : '公共交通機関'

    // Build user prompt dynamically based on validation result
    const daysLabel =
      input.days === 1
        ? '1日（日帰り）'
        : input.days === 2
          ? '2日（1泊2日）'
          : input.days === 3
            ? '3日（2泊3日）'
            : '4日（3泊4日）'

    // Check if actual correction was made (not just validation failure with same values)
    const destinationActuallyCorrected =
      effectiveDestination !== input.destination
    const baseAreaActuallyCorrected = effectiveBaseArea !== input.base_area
    const actualCorrectionMade =
      destinationActuallyCorrected || baseAreaActuallyCorrected

    let userPrompt: string
    if (actualCorrectionMade && validationResult.reason) {
      // Actual correction was applied - include notification instruction
      // Build correction message only for fields that were actually changed
      const correctionParts: string[] = []
      if (destinationActuallyCorrected) {
        correctionParts.push(
          `目的地『${input.destination}』→『${effectiveDestination}』`
        )
      }
      if (baseAreaActuallyCorrected) {
        correctionParts.push(
          `拠点『${input.base_area}』→『${effectiveBaseArea}』`
        )
      }
      const correctionMessage = correctionParts.join('、')

      userPrompt = `以下の条件で最適化された旅行プランを作成してください：

**目的地:** ${effectiveDestination}
**拠点エリア:** ${effectiveBaseArea}
**移動手段:** ${transportLabel}
**旅行日数:** ${daysLabel}（Day 1 〜 Day ${input.days} まで作成すること。それ以上もそれ以下も禁止）

**重要な注意事項:**
ユーザー入力を補正しました（${correctionMessage}）。
出力の冒頭（intro）で、「※ご指定の地名を補正しました：${correctionMessage}」という形式でユーザーに優しく通知してください。

拠点を起点・終点とする効率的な周遊ルートを設計してください。
各日のgoogle_maps_urlには、実際にクリックして使える正しいURLを含めてください。`
    } else {
      // No actual correction needed - standard prompt (even if isValid was false)
      userPrompt = `以下の条件で最適化された旅行プランを作成してください：

**目的地:** ${effectiveDestination}
**拠点エリア:** ${effectiveBaseArea}
**移動手段:** ${transportLabel}
**旅行日数:** ${daysLabel}（Day 1 〜 Day ${input.days} まで作成すること。それ以上もそれ以下も禁止）

拠点を起点・終点とする効率的な周遊ルートを設計してください。
各日のgoogle_maps_urlには、実際にクリックして使える正しいURLを含めてください。`
    }

    // Use AI SDK's streamObject for immediate partial object streaming (real-time rendering)
    console.log('[Step 2] 🚀 Starting plan generation...')
    console.log('[Step 2] Model:', llmClient.getModelName())
    console.log(
      '[Step 2] System prompt length:',
      PLAN_GENERATION_PROMPT.length,
      'chars'
    )
    console.log('[Step 2] User prompt length:', userPrompt.length, 'chars')
    console.log(
      `[Step 2] Prompt reduction: ~4700 → ${PLAN_GENERATION_PROMPT.length} chars (${Math.round((1 - PLAN_GENERATION_PROMPT.length / 4700) * 100)}% reduction)`
    )
    const startTime = Date.now()

    const result = streamObject({
      model: llmClient.getModel(),
      system: PLAN_GENERATION_PROMPT,
      prompt: userPrompt,
      schema: OptimizedPlanSchema,
      onFinish: ({ object, usage }) => {
        const duration = Date.now() - startTime
        const totalDuration = duration + validationResult.durationMs

        // === [DeepDive] Performance Metrics ===
        console.log('[DeepDive] 🏁 Stream Completed')
        console.log(
          `[DeepDive] Step 1 (Validation): ${validationResult.durationMs}ms`
        )
        console.log(
          `[DeepDive] Step 2 (Generation): ${duration}ms (${(duration / 1000).toFixed(2)}s)`
        )
        console.log(
          `[DeepDive] Total Duration: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`
        )

        // Token usage and TPS calculation
        if (usage) {
          const inputTokens = usage.inputTokens || 0
          const outputTokens = usage.outputTokens || 0
          const totalTokens = inputTokens + outputTokens
          const tps =
            outputTokens > 0
              ? (outputTokens / (duration / 1000)).toFixed(2)
              : 'N/A'

          console.log(`[DeepDive] Token Usage:`)
          console.log(`[DeepDive]   - Input: ${inputTokens} tokens`)
          console.log(`[DeepDive]   - Output: ${outputTokens} tokens`)
          console.log(`[DeepDive]   - Total: ${totalTokens} tokens`)
          console.log(`[DeepDive] TPS (Tokens Per Second): ${tps} tokens/sec`)

          // Token efficiency
          if (outputTokens > 0 && duration > 0) {
            const msPerToken = (duration / outputTokens).toFixed(2)
            console.log(
              `[DeepDive] Generation Speed: ${msPerToken}ms per token`
            )
          }
        } else {
          console.log('[DeepDive] ⚠️ No usage data available')
        }

        // === Object Output Analysis (Optimized Plan) ===
        if (object) {
          console.log('[DeepDive] 📦 Generated Optimized Plan Analysis:')
          console.log(
            `[DeepDive]   - Top-level keys: ${Object.keys(object).join(', ')}`
          )
          if (object.title) {
            console.log(`[DeepDive]   - Title: "${object.title}"`)
          }
          if (object.itinerary) {
            console.log(
              `[DeepDive]   - Itinerary days: ${object.itinerary.length}`
            )
            object.itinerary.forEach((day, i) => {
              console.log(
                `[DeepDive]     Day ${i + 1}: ${day.events?.length || 0} events`
              )
            })
          }
          if (object.affiliate) {
            console.log(`[DeepDive]   - Affiliate: "${object.affiliate.label}"`)
          }
        } else {
          console.log('[DeepDive] ⚠️ No object generated')
        }

        // === Legacy logs (for compatibility) ===
        console.log(
          `[Timing] ✅ Stream completed in ${duration}ms (${(duration / 1000).toFixed(2)}s)`
        )
        if (usage) {
          console.log(
            `[Token Usage] Input: ${usage.inputTokens || 0}, Output: ${usage.outputTokens || 0}, Total: ${(usage.inputTokens || 0) + (usage.outputTokens || 0)}`
          )
        }
        if (object) {
          console.log(
            `[Object Summary] Generated optimized plan: "${object.title || 'Unknown'}"`
          )
        }
      },
    })

    console.log(
      `[Timing] streamObject created in ${Date.now() - startTime}ms (note: streaming starts async)`
    )

    // Return streaming response without saving
    // Client will call POST /api/plans to save the plan after receiving it
    // CRITICAL: Pass headers to prevent Vercel compression and enable true streaming
    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error) {
    console.error('Error generating plan:', error)

    if (error instanceof Error && error.message.includes('Rate limit')) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to generate plan',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
