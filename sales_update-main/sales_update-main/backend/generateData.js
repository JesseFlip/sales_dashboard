const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const PROCESSED_DIR = path.join(DATA_DIR, 'processed');
const OUTPUTS_DIR = path.join(DATA_DIR, 'outputs');

const MARKETS = ['Dallas', 'Austin', 'San Antonio', 'Houston'];
const ACCOUNTS = ['Tom Thumb', 'Kroger', 'Central Market', 'Whole Foods', 'Market Street'];
const BRANDS = ['Estate Ridge Cabernet', 'Lone Star Vodka', 'Hill Country IPA', 'Gulf Tequila', 'Prairie Pinot Grigio'];
const REPS = ['Alex Carter', 'Jordan Lee', 'Taylor Morgan', 'Sam Nguyen', 'Riley Brooks', 'Casey Diaz', 'Jamie Patel', 'Drew Kim'];
const CATEGORIES = ['Wine', 'Spirits', 'Beer'];

function ensureDirs() {
    [DATA_DIR, RAW_DIR, PROCESSED_DIR, OUTPUTS_DIR].forEach(d => {
        if (!fs.existsSync(d)) {
            fs.mkdirSync(d, { recursive: true });
        }
    });
}

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function normalRandom(mean, std) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function poissonRandom(lambda) {
    let L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    return k - 1;
}

function generateData(days = 30) {
    ensureDirs();
    const rows = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(today.getDate() - (days - 1 - i));
        const isoDate = date.toISOString().split('T')[0];
        
        for (let j = 0; j < 100; j++) { // Reduced rows for speed but sufficient for demo
            const market = getRandom(MARKETS);
            const account = getRandom(ACCOUNTS);
            const brand = getRandom(BRANDS);
            const category = getRandom(CATEGORIES);
            const rep = getRandom(REPS);
            
            const baseGoal = { 'Wine': 120, 'Spirits': 100, 'Beer': 150 }[category];
            const accountFactor = 1.0 + (ACCOUNTS.indexOf(account) * 0.05);
            const marketFactor = 1.0 + (MARKETS.indexOf(market) * 0.07);
            
            let dailyGoal = Math.round(normalRandom(baseGoal * accountFactor * marketFactor, 15));
            dailyGoal = Math.max(dailyGoal, 20);
            
            const displays = Math.max(0, poissonRandom(1));
            const pods = Math.max(1, Math.round(normalRandom(12, 3)));
            const voids = Math.max(0, poissonRandom(1));
            
            const uplift = 1.0 + 0.10 * displays;
            const voidPenalty = 1.0 - Math.min(voids * 0.03, 0.4);
            const noise = normalRandom(0.95, 0.1);
            
            const sales = Math.round(Math.max(0, dailyGoal * uplift * voidPenalty * noise));
            
            rows.push({
                date: isoDate,
                market,
                account,
                brand,
                category,
                rep,
                goal: dailyGoal,
                sales_volume: sales,
                displays,
                pods,
                voids
            });
        }
    }
    
    const header = Object.keys(rows[0]).join(',');
    const csvContent = [header, ...rows.map(r => Object.values(r).join(','))].join('\n');
    
    fs.writeFileSync(path.join(RAW_DIR, 'raw_history.csv'), csvContent);
    console.log(`Generated ${rows.length} rows of data.`);
}

generateData();
