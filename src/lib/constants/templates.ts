/**
 * Available travel plan templates
 */
export const TEMPLATES = [
  {
    id: 'business',
    name: 'ワーケーション',
    description: '開発合宿・リモートワークに最適',
    icon: '💼',
  },
  {
    id: 'leisure',
    name: 'デトックス',
    description: 'デジタルデトックス・リラックス',
    icon: '🌴',
  },
  {
    id: 'family',
    name: 'ファミリー',
    description: '家族向けアクティビティ',
    icon: '👨‍👩‍👧‍👦',
  },
  {
    id: 'adventure',
    name: 'アウトドア',
    description: '自然・アクティビティ重視',
    icon: '🏔️',
  },
  {
    id: 'cultural',
    name: 'カルチャー',
    description: '文化・歴史・アニメ聖地巡礼',
    icon: '🏛️',
  },
]

/**
 * Period options for travel duration
 */
export const PERIOD_OPTIONS = [
  { value: '1', label: '1日' },
  { value: '2', label: '2日' },
  { value: '3', label: '3日' },
  { value: '4', label: '4日' },
  { value: '5', label: '5日' },
  { value: '7', label: '1週間' },
]

/**
 * Budget options
 */
export const BUDGET_OPTIONS = [
  { value: 'economy', label: 'エコノミー' },
  { value: 'standard', label: 'スタンダード' },
  { value: 'luxury', label: 'プレミアム' },
]
