export interface SeedPlan {
  region: string // Unsplashで検索しやすい主要都市名 (例: "Tokyo", "Hakone")
  title: string // SEOを意識した英語タイトル
  theme: string // 旅行のテーマ (Workation, Tech, Nature, etc.)
  keywords: string[] // 画像検索用キーワード (英語)
}

export const SEED_PLANS: SeedPlan[] = [
  // A. 開発合宿・集中 (Deep Work)
  {
    region: 'Hakone',
    title: 'Hakone Onsen Development Camp',
    theme: 'Deep Work',
    keywords: ['hot spring', 'ryokan', 'laptop', 'japanese room'],
  },
  {
    region: 'Nagano',
    title: 'Lakeside Coworking Retreat',
    theme: 'Deep Work',
    keywords: ['lake', 'forest', 'laptop', 'nature'],
  },
  {
    region: 'Chiba',
    title: 'Ocean View Coding Camp',
    theme: 'Deep Work',
    keywords: ['ocean view', 'beach', 'desk', 'coffee'],
  },
  {
    region: 'Shirahama',
    title: 'Resort Workation in Shirahama',
    theme: 'Workation',
    keywords: ['white beach', 'resort', 'tropical', 'laptop'],
  },
  {
    region: 'Izu',
    title: 'Relaxing Izu Onsen & Coding',
    theme: 'Deep Work',
    keywords: ['hot spring', 'tatami', 'relaxing', 'tea'],
  },
  {
    region: 'Tokushima',
    title: 'Kamiyama Satellite Office Tour',
    theme: 'Workation',
    keywords: ['rural japan', 'old house', 'mountain', 'river'],
  },

  // B. 都市型テック・ガジェット巡り (Tech & Industry)
  {
    region: 'Akihabara',
    title: 'Akihabara Retro Tech Hunt',
    theme: 'Tech',
    keywords: ['akihabara', 'electronics', 'retro game', 'neon'],
  },
  {
    region: 'Osaka',
    title: 'Osaka Den-Den Town Tech Tour',
    theme: 'Tech',
    keywords: ['osaka street', 'neon', 'shopping', 'electronics'],
  },
  {
    region: 'Fukuoka',
    title: 'Fukuoka Startup & Engineer Cafe',
    theme: 'Tech',
    keywords: ['fukuoka city', 'cafe', 'coworking', 'modern office'],
  },
  {
    region: 'Tsukuba',
    title: 'Tsukuba Space & Science Tour',
    theme: 'Science',
    keywords: ['rocket', 'space center', 'robot', 'science museum'],
  },
  {
    region: 'Nagoya',
    title: 'Nagoya Industrial Tech History',
    theme: 'Industry',
    keywords: ['factory', 'machine', 'museum', 'industrial'],
  },
  {
    region: 'Fukui',
    title: 'Sabae Glasses & Wearable Tech',
    theme: 'Industry',
    keywords: ['glasses', 'craftsmanship', 'workshop', 'tools'],
  },

  // C. ノマド・カフェ作業 (Workation / Nomad)
  {
    region: 'Shinjuku',
    title: 'Tokyo Midnight Coding Cafes',
    theme: 'Nomad',
    keywords: ['night cafe', 'tokyo night', 'laptop', 'neon'],
  },
  {
    region: 'Sapporo',
    title: 'Sapporo Summer Escape & Parfait',
    theme: 'Workation',
    keywords: ['parfait', 'sapporo city', 'summer', 'cafe'],
  },
  {
    region: 'Kyoto',
    title: 'Kyoto Machiya Cafe & Temple Work',
    theme: 'Workation',
    keywords: ['kyoto street', 'matcha', 'temple', 'japanese garden'],
  },
  {
    region: 'Okinawa',
    title: 'Okinawa Ocean View Nomad',
    theme: 'Workation',
    keywords: ['blue ocean', 'tropical cafe', 'beach', 'coffee'],
  },
  {
    region: 'Sendai',
    title: 'Sendai Beef Tongue & Coworking',
    theme: 'Workation',
    keywords: ['grilled meat', 'sendai city', 'modern building', 'business'],
  },
  {
    region: 'Kobe',
    title: 'Kobe Port & Jazz Cafe Coding',
    theme: 'Relax',
    keywords: ['jazz cafe', 'coffee', 'kobe port', 'brick warehouse'],
  },

  // D. デジタルデトックス・リフレッシュ (Refresh / Detox)
  {
    region: 'Tottori',
    title: 'Tottori Sand Dunes Digital Detox',
    theme: 'Detox',
    keywords: ['sand dunes', 'desert', 'sky', 'footsteps'],
  },
  {
    region: 'Yakushima',
    title: 'Yakushima Ancient Forest Trek',
    theme: 'Nature',
    keywords: ['ancient forest', 'moss', 'green', 'hiking'],
  },
  {
    region: 'Aomori',
    title: 'Aomori Hot Spring Digital Detox',
    theme: 'Detox',
    keywords: ['snow', 'hot spring', 'mountains', 'winter'],
  },
  {
    region: 'Gunma',
    title: 'Minakami Bungee & Adventure',
    theme: 'Activity',
    keywords: ['bungee jumping', 'river', 'bridge', 'mountain valley'],
  },
  {
    region: 'Naoshima',
    title: 'Naoshima Modern Art Island Tour',
    theme: 'Art',
    keywords: ['modern art', 'sculpture', 'sea', 'island'],
  },
  {
    region: 'Ise',
    title: 'Ise Jingu Shrine Spiritual Trip',
    theme: 'Culture',
    keywords: ['shinto shrine', 'torii gate', 'forest', 'sacred'],
  },

  // E. 効率・マニアック (Efficiency / Hobby)
  {
    region: 'Saitama',
    title: 'Saitama Railway Museum & Train View',
    theme: 'Hobby',
    keywords: ['train', 'railway', 'shinkansen', 'locomotive'],
  },
  {
    region: 'Toyama',
    title: 'Kurobe Dam Infrastructure Tour',
    theme: 'Industry',
    keywords: ['huge dam', 'water release', 'mountain', 'engineering'],
  },
  {
    region: 'Hiroshima',
    title: 'Kure Maritime Museum & Submarines',
    theme: 'History',
    keywords: ['submarine', 'battleship', 'harbor', 'navy'],
  },
  {
    region: 'Niigata',
    title: 'Sake Tasting & Station Onsen',
    theme: 'Food',
    keywords: ['sake bottles', 'rice field', 'snowy station', 'onsen'],
  },
  {
    region: 'Yamanashi',
    title: 'Sunrise Onsen & Mt Fuji View',
    theme: 'Nature',
    keywords: ['mount fuji', 'sunrise', 'outdoor bath', 'scenery'],
  },
  {
    region: 'Nagasaki',
    title: 'Gunkanjima Abandoned Island Tour',
    theme: 'History',
    keywords: ['abandoned building', 'ruins', 'concrete', 'island'],
  },
]
