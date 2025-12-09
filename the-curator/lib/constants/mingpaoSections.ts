/**
 * MingPao News Sections Configuration
 * 
 * This contains all available sections on MingPao news site
 * with their URLs, display names, and identifiers
 * 
 * Note: MingPao section URLs use date-based paths (e.g., /section/20251209/s00001)
 * We use a helper function to generate today's date for the URLs
 */

// Helper to get today's date in YYYYMMDD format
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export interface MingPaoSection {
  id: string;
  name: string;
  displayName: string; // Chinese name
  url: string;
  sectionCode: string; // e.g., s00001, s00002
  type: 'main' | 'section'; // 'main' for main categories, 'section' for sub-sections
}

// Generate URLs with today's date
const dateStr = getTodayDateString();

export const mingpaoSections: MingPaoSection[] = [
  {
    id: 'daily',
    name: 'Daily MingPao',
    displayName: '每日明報',
    url: 'https://news.mingpao.com/pns/%E6%AF%8F%E6%97%A5%E6%98%8E%E5%A0%B1/main',
    sectionCode: 'main',
    type: 'main',
  },
  {
    id: 'news',
    name: 'News',
    displayName: '要聞',
    url: `https://news.mingpao.com/pns/%E8%A6%81%E8%81%9E/section/${dateStr}/s00001`,
    sectionCode: 's00001',
    type: 'section',
  },
  {
    id: 'hongkong',
    name: 'Hong Kong',
    displayName: '港聞',
    url: `https://news.mingpao.com/pns/%E6%B8%AF%E8%81%9E/section/${dateStr}/s00002`,
    sectionCode: 's00002',
    type: 'section',
  },
  {
    id: 'economy',
    name: 'Economy',
    displayName: '經濟',
    url: `https://news.mingpao.com/pns/%E7%B6%93%E6%BF%9F/section/${dateStr}/s00004`,
    sectionCode: 's00004',
    type: 'section',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    displayName: '娛樂',
    url: `https://news.mingpao.com/pns/%E5%A8%9B%E6%A8%82/section/${dateStr}/s00016`,
    sectionCode: 's00016',
    type: 'section',
  },
  {
    id: 'supplement',
    name: 'Supplement',
    displayName: '副刊',
    url: `https://news.mingpao.com/pns/%E5%89%AF%E5%88%8A/section/${dateStr}/s00005`,
    sectionCode: 's00005',
    type: 'section',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    displayName: '社評',
    url: `https://news.mingpao.com/pns/%E7%A4%BE%E8%A9%95/section/${dateStr}/s00003`,
    sectionCode: 's00003',
    type: 'section',
  },
  {
    id: 'viewpoint',
    name: 'Viewpoint',
    displayName: '觀點',
    url: `https://news.mingpao.com/pns/%E8%A7%80%E9%BB%9E/section/${dateStr}/s00012`,
    sectionCode: 's00012',
    type: 'section',
  },
  {
    id: 'china',
    name: 'China',
    displayName: '中國',
    url: `https://news.mingpao.com/pns/%E4%B8%AD%E5%9C%8B/section/${dateStr}/s00013`,
    sectionCode: 's00013',
    type: 'section',
  },
  {
    id: 'international',
    name: 'International',
    displayName: '國際',
    url: `https://news.mingpao.com/pns/%E5%9C%8B%E9%9A%9B/section/${dateStr}/s00014`,
    sectionCode: 's00014',
    type: 'section',
  },
  {
    id: 'education',
    name: 'Education',
    displayName: '教育',
    url: `https://news.mingpao.com/pns/%E6%95%99%E8%82%B2/section/${dateStr}/s00011`,
    sectionCode: 's00011',
    type: 'section',
  },
  {
    id: 'sports',
    name: 'Sports',
    displayName: '體育',
    url: `https://news.mingpao.com/pns/%E4%BD%93%E8%82%B2/section/${dateStr}/s00015`,
    sectionCode: 's00015',
    type: 'section',
  },
  {
    id: 'english',
    name: 'English',
    displayName: '英文',
    url: `https://news.mingpao.com/pns/%E8%8B%B1%E6%96%87/section/${dateStr}/s00017`,
    sectionCode: 's00017',
    type: 'section',
  },
  {
    id: 'columnists',
    name: 'Columnists',
    displayName: '作家專欄',
    url: `https://news.mingpao.com/pns/%E4%BD%9C%E5%AE%B6%E5%B0%82%E6%AC%84/section/${dateStr}/s00018`,
    sectionCode: 's00018',
    type: 'section',
  },
  {
    id: 'national_games',
    name: 'National Games',
    displayName: '全運會',
    url: 'https://news.mingpao.com/pns/%E5%85%A8%E9%81%8B%E6%9C%83/special',
    sectionCode: 'special',
    type: 'section',
  },
  {
    id: 'guangdong_bay',
    name: 'Greater Bay Area',
    displayName: '大灣區',
    url: 'https://news.mingpao.com/ins/%E5%A4%A7%E7%81%A3%E5%8D%80/section/latest/special',
    sectionCode: 'special',
    type: 'section',
  },
  {
    id: 'photo',
    name: 'Photo Gallery',
    displayName: '圖片看世界',
    url: 'https://news.mingpao.com/pns/%E5%9C%96%E7%89%87%E7%9C%8B%E4%B8%96%E7%95%8C/photo1/latest',
    sectionCode: 'photo1',
    type: 'section',
  },
];

export function getMingPaoSectionByCode(code: string): MingPaoSection | undefined {
  return mingpaoSections.find(s => s.sectionCode === code);
}

export function getMingPaoSectionById(id: string): MingPaoSection | undefined {
  return mingpaoSections.find(s => s.id === id);
}
