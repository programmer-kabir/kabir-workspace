// Bangladesh 8 Divisions & 64 Districts Data with Satirical Titles & Live Census Counts

export const divisionsData = [
  {
    id: 'dhaka',
    name: 'ঢাকা বিভাগ',
    title: 'কেন্দ্রীয় শাহবাগ ও টিএসসি অবরোধ জোন',
    districts: [
      'ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'মুন্সীগঞ্জ', 'নরসিংদী', 
      'টাঙ্গাইল', 'কিশোরগঞ্জ', 'মানিকগঞ্জ', 'ফরিদপুর', 'মাদারীপুর', 
      'গোপালগঞ্জ', 'রাজবাড়ী', 'শরীয়তপুর'
    ]
  },
  {
    id: 'chattogram',
    name: 'চট্টগ্রাম বিভাগ',
    title: 'মেজবানী গোশত ও বন্দর বিপ্লবী মোর্চা',
    districts: [
      'চট্টগ্রাম', 'কক্সবাজার', 'কুমিল্লা', 'নোয়াখালী', 'ফেনী', 
      'ব্রাহ্মণবাড়িয়া', 'চাঁদপুর', 'লক্ষ্মীপুর', 'রাঙ্গামাটি', 
      'খাগড়াছড়ি', 'বান্দরবান'
    ]
  },
  {
    id: 'sylhet',
    name: 'সিলেট বিভাগ',
    title: 'লন্ডনী লাল চাখোর ও সিলেটি সুরমা ফ্রন্ট',
    districts: [
      'সিলেট', 'মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'
    ]
  },
  {
    id: 'rajshahi',
    name: 'রাজশাহী বিভাগ',
    title: 'আম ও মার্ক্সবাদী তাত্ত্বিক ক্যাডার',
    districts: [
      'রাজশাহী', 'বগুড়া', 'পাবনা', 'সিরাজগঞ্জ', 'নওগাঁ', 
      'নাটোর', 'চাঁপাইনবাবগঞ্জ', 'জয়পুরহাট'
    ]
  },
  {
    id: 'khulna',
    name: 'খুলনা বিভাগ',
    title: 'সুন্দরবনের বাঘ ও সাবানহীন জলদস্যু কমরেড',
    districts: [
      'খুলনা', 'যশোর', 'সাতক্ষীরা', 'বাগেরহাট', 'কুষ্টিয়া', 
      'মেহেরপুর', 'চুয়াডাঙ্গা', 'ঝিনাইদহ', 'মাগুরা', 'নড়াইল'
    ]
  },
  {
    id: 'barishal',
    name: 'বরিশাল বিভাগ',
    title: 'নদীমাতৃক সুরেশ্বরী আঁতেল ও তর্কবীর',
    districts: [
      'বরিশাল', 'পটুয়াখালী', 'ভোলা', 'পিরোজপুর', 'বরগুনা', 'ঝালকাঠি'
    ]
  },
  {
    id: 'rangpur',
    name: 'রংপুর বিভাগ',
    title: 'উত্তরাঞ্চলীয় শীতাতপ বিপ্লবী স্কোয়াড',
    districts: [
      'রংপুর', 'দিনাজপুর', 'কুড়িগ্রাম', 'গাইবান্ধা', 'নীলফামারী', 
      'লালমনিরহাট', 'ঠাকুরগাঁও', 'পঞ্চগড়'
    ]
  },
  {
    id: 'mymensingh',
    name: 'ময়মনসিংহ বিভাগ',
    title: 'ব্রহ্মপুত্রপাড়ের কবি ও গীতিকার কমরেড',
    districts: [
      'ময়মনসিংহ', 'জামালপুর', 'নেত্রকোণা', 'শেরপুর'
    ]
  }
];

export const districtSatiricalTitles = {
  'ঢাকা': 'টিএসসি ও শাহবাগের স্থায়ী মোড় অবরোধকারী',
  'চট্টগ্রাম': 'মেজবানী গোশত ও বিপ্লবী পোর্ট কমান্ডার',
  'সিলেট': 'লন্ডনী পাউন্ড ও সাতকড়া-চাখোর কমরেড',
  'নোয়াখালী': 'রয়েল নোয়াখালী সাইবার আঁতেল ফ্রন্ট',
  'ব্রাহ্মণবাড়িয়া': 'বিপ্লবী মশাল ও রণহুঙ্কার মোর্চা',
  'বগুড়া': 'দই ও ফ্রয়েডিয়ান সাইকো-অ্যানালিস্ট',
  'রাজশাহী': 'আম ও খাঁটি মার্ক্সবাদী চিন্তাবিদ',
  'কুমিল্লা': 'রসমালাই ও ঐতিহ্যবাহী তাত্ত্বিক ক্যাডার',
  'বরিশাল': 'নদীমাতৃক সুরেশ্বরী মহীরুহ আঁতেল',
  'খুলনা': 'সুন্দরবনের সাবানহীন বিপ্লবী যোদ্ধা',
  'ময়মনসিংহ': 'মুক্তাগাছার মণ্ডা ও মেটাফোরিক্যাল কবি',
  'কক্সবাজার': 'সমুদ্রপাড়ের উন্মুক্ত রোমান্টিক কমরেড',
  'ফেনী': 'গ্র্যান্ড ট্রাঙ্ক রোডের সোচ্চার কমরেড',
  'গাজীপুর': 'শিল্পাঞ্চলের মজদুর ও লাল পতাকাবাহী',
  'নারায়ণগঞ্জ': 'শীতলক্ষ্যাপাড়ের ডকইয়ার্ড বিপ্লবী',
  'যশোর': 'খাঁটি খেজুরের গুড় ও সাহিত্যপ্রেমী আঁতেল',
  'পাবনা': 'মানসিক স্বাধীনতা ও সুপণ্ডিত কমরেড',
  'রংপুর': 'হারিকেন নিয়ে রাজপথ কাঁপানো কমরেড',
  'দিনাজপুর': 'কাটারিভোগ চাল ও বিপ্লবী কৃষক বন্ধু',
  'টাঙ্গাইল': 'চমচম ও তাঁতের শাড়ি পরিহিতা বিপ্লবী'
};

// Simulated dynamic initial counts for viral leaderboard
export const initialDistrictCounts = [
  { district: 'ঢাকা', division: 'ঢাকা বিভাগ', count: 34820, badge: '🥇 শীর্ষ আঁতেল জেলা' },
  { district: 'চট্টগ্রাম', division: 'চট্টগ্রাম বিভাগ', count: 15410, badge: '🥈 দ্বিতীয় স্থান' },
  { district: 'সিলেট', division: 'সিলেট বিভাগ', count: 12940, badge: '🥉 তৃতীয় স্থান' },
  { district: 'নোয়াখালী', division: 'চট্টগ্রাম বিভাগ', count: 10850, badge: '🔥 রয়েল নোয়াখালী' },
  { district: 'ব্রাহ্মণবাড়িয়া', division: 'চট্টগ্রাম বিভাগ', count: 9630, badge: '⚔️ মশাল ফ্রন্ট' },
  { district: 'রাজশাহী', division: 'রাজশাহী বিভাগ', count: 8740, badge: '📚 মার্ক্সীয় জোন' },
  { district: 'বগুড়া', division: 'রাজশাহী বিভাগ', count: 7520, badge: '🥣 দই ও দর্শন' },
  { district: 'কুমিল্লা', division: 'চট্টগ্রাম বিভাগ', count: 6940, badge: '🍮 রসমালাই আঁতেল' },
  { district: 'বরিশাল', division: 'বরিশাল বিভাগ', count: 6420, badge: '🌊 নদীমাতৃক তর্কবীর' },
  { district: 'ময়মনসিংহ', division: 'ময়মনসিংহ বিভাগ', count: 5890, badge: '📜 সাহিত্য সংসদ' },
  { district: 'খুলনা', division: 'খুলনা বিভাগ', count: 5310, badge: '🐅 সুন্দরবন ক্যাডার' },
  { district: 'যশোর', division: 'খুলনা বিভাগ', count: 4890, badge: '🍯 গুড় ও প্রেম' },
  { district: 'রংপুর', division: 'রংপুর বিভাগ', count: 4420, badge: '🚩 মশাল যোদ্ধা' },
  { district: 'কক্সবাজার', division: 'চট্টগ্রাম বিভাগ', count: 3950, badge: '🏖️ সমুদ্রতীরবর্তী' },
  { district: 'গাজীপুর', division: 'ঢাকা বিভাগ', count: 3710, badge: '🏭 মজদুর বিপ্লবী' },
  { district: 'টাঙ্গাইল', division: 'ঢাকা বিভাগ', count: 3340, badge: '🥻 তাঁতের কমরেড' },
  { district: 'পাবনা', division: 'রাজশাহী বিভাগ', count: 2980, badge: '🧠 দার্শনিক মুক্তমনা' }
];

export function getDistrictsForDivision(divisionName) {
  const found = divisionsData.find(d => d.name === divisionName);
  return found ? found.districts : divisionsData[0].districts;
}

export function getDistrictTitle(districtName) {
  return districtSatiricalTitles[districtName] || 'জাতীয় শাহবাগী ও নিবেদিতপ্রাণ কমরেড';
}

export function getDistrictRank(districtName) {
  const sorted = [...initialDistrictCounts].sort((a, b) => b.count - a.count);
  const idx = sorted.findIndex(d => d.district === districtName);
  return idx !== -1 ? idx + 1 : 'সেরা ২০-এ';
}

export function getDistrictCount(districtName) {
  const found = initialDistrictCounts.find(d => d.district === districtName);
  return found ? found.count : 3500;
}
