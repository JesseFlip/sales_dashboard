const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const RAW_HISTORY = path.join(__dirname, '..', 'data', 'raw', 'raw_history.csv');

function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

async function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(filePath)) {
            return resolve([]);
        }
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

app.get('/api/metadata', async (req, res) => {
    try {
        const data = await readCSV(RAW_HISTORY);
        if (data.length === 0) return res.json({ weeks: [], markets: [], accounts: [] });

        const weeks = [...new Set(data.map(r => getISOWeek(r.date)))].sort((a, b) => a - b);
        const markets = [...new Set(data.map(r => r.market))].sort();
        const accounts = [...new Set(data.map(r => r.account))].sort();

        res.json({ weeks, markets, accounts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard', async (req, res) => {
    try {
        const { week, markets, accounts } = req.query;
        let data = await readCSV(RAW_HISTORY);

        // Filter data
        if (week) {
            data = data.filter(r => getISOWeek(r.date) === parseInt(week));
        }
        if (markets) {
            const marketList = markets.split(',');
            data = data.filter(r => marketList.includes(r.market));
        }
        if (accounts) {
            const accountList = accounts.split(',');
            data = data.filter(r => accountList.includes(r.account));
        }

        // Aggregate metrics
        let totalSales = 0;
        let totalGoal = 0;
        let gapToGoal = 0;

        data.forEach(r => {
            const sales = parseFloat(r.sales_volume) || 0;
            const goal = parseFloat(r.goal) || 0;

            totalSales += sales;
            totalGoal += goal;

            // Calculate gap per record (sum of positive gaps)
            if (goal > sales) {
                gapToGoal += (goal - sales);
            }
        });

        const attainment = totalGoal > 0 ? (totalSales / totalGoal) : 0;

        // Territory Chart Data
        const territoryMap = {};
        data.forEach(r => {
            const sales = parseFloat(r.sales_volume) || 0;
            const goal = parseFloat(r.goal) || 0;

            if (!territoryMap[r.market]) {
                territoryMap[r.market] = { market: r.market, sales: 0, goal: 0 };
            }
            territoryMap[r.market].sales += sales;
            territoryMap[r.market].goal += goal;
        });

        const territoryData = Object.values(territoryMap).map(m => ({
            market: m.market,
            attainment: m.goal > 0 ? (m.sales / m.goal) : 0
        })).sort((a, b) => b.attainment - a.attainment);

        // Trend Data (Daily)
        const trendMap = {};
        data.forEach(r => {
            const date = r.date;
            const sales = parseFloat(r.sales_volume) || 0;
            if (!trendMap[date]) trendMap[date] = { date, sales: 0 };
            trendMap[date].sales += sales;
        });
        const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            metrics: {
                totalSales,
                gapToGoal,
                attainment
            },
            charts: {
                territory: territoryData,
                trend: trendData
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/download', async (req, res) => {
    try {
        const { week, markets, accounts } = req.query;
        let data = await readCSV(RAW_HISTORY);

        if (week) data = data.filter(r => getISOWeek(r.date) === parseInt(week));
        if (markets) data = data.filter(r => markets.split(',').includes(r.market));
        if (accounts) data = data.filter(r => accounts.split(',').includes(r.account));

        if (data.length === 0) return res.send('');

        const header = Object.keys(data[0]).join(',');
        const csvContent = [header, ...data.map(r => Object.values(r).join(','))].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_export.csv');
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
