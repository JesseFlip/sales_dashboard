import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Target, DollarSign, Download, Filter } from 'lucide-react';

const App = () => {
    const [metadata, setMetadata] = useState({ weeks: [], markets: ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth"], accounts: [] });
    const [filters, setFilters] = useState({ week: '', markets: [], accounts: [] });
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        if (metadata.weeks.length > 0) {
            const latestWeek = metadata.weeks[metadata.weeks.length - 1];
            setFilters(f => ({ ...f, week: latestWeek.toString() }));
        }
    }, [metadata]);

    useEffect(() => {
        if (filters.week) {
            fetchDashboard();
        }
    }, [filters]);

    const fetchMetadata = async () => {
        try {
            const res = await axios.get('/api/weeks');
            setMetadata(prev => ({ ...prev, weeks: res.data.weeks }));
        } catch (err) {
            console.error('Error fetching metadata', err);
        }
    };

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const { week, markets } = filters;
            const params = new URLSearchParams();
            if (week) params.append('week', week);
            if (markets.length > 0) params.append('markets', markets.join(','));

            const [summaryRes, territoryRes, trendRes] = await Promise.all([
                axios.get(`/api/summary?${params.toString()}`),
                axios.get(`/api/territory?week=${week}`),
                axios.get(`/api/trend?${params.toString()}`)
            ]);

            setDashboardData({
                metrics: {
                    totalSales: summaryRes.data.total_sales,
                    gapToGoal: summaryRes.data.gap_to_goal,
                    attainment: summaryRes.data.attainment / 100 // Convert percentage to decimal
                },
                charts: {
                    territory: territoryRes.data.data.map(m => ({ ...m, attainment: m.attainment / 100 })),
                    trend: trendRes.data.data
                }
            });
        } catch (err) {
            console.error('Error fetching dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleDownload = () => {
        const { week, markets } = filters;
        const params = new URLSearchParams();
        if (week) params.append('week', week);
        if (markets.length > 0) params.append('markets', markets.join(','));
        window.open(`/api/download?${params.toString()}`, '_blank');
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-US').format(Math.round(val));
    const formatPercent = (val) => `${(val * 100).toFixed(1)}%`;

    return (
        <div style={{ display: 'flex' }}>
            <aside className="sidebar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <TrendingUp size={24} color="#60a5fa" />
                    <h1>CPWS Sales</h1>
                </div>

                <div className="filter-group">
                    <label><Filter size={12} style={{ display: 'inline', marginRight: '4px' }} /> ISO Week</label>
                    <select
                        value={filters.week}
                        onChange={(e) => handleFilterChange('week', e.target.value)}
                    >
                        {metadata.weeks.map(w => (
                            <option key={w} value={w}>Week {w}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label>Markets</label>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {metadata.markets.map(m => (
                            <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                                <input
                                    type="checkbox"
                                    checked={filters.markets.includes(m)}
                                    onChange={(e) => {
                                        const newMarkets = e.target.checked
                                            ? [...filters.markets, m]
                                            : filters.markets.filter(x => x !== m);
                                        handleFilterChange('markets', newMarkets);
                                    }}
                                />
                                {m}
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleDownload}
                    style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    <Download size={18} /> Download CSV
                </button>
            </aside>

            <main className="main-content">
                <div style={{ marginBottom: '2rem' }}>
                    <h2>Sales Performance Overview</h2>
                    <p style={{ color: '#94a3b8' }}>Real-time insights from simulated territory data.</p>
                </div>

                {loading ? (
                    <div style={{ color: '#fff' }}>Loading data...</div>
                ) : dashboardData && (
                    <>
                        <div className="metrics-grid">
                            <div className="glass card">
                                <div className="metric-label">Total Sales (Week)</div>
                                <div className="metric-value">{formatCurrency(dashboardData.metrics.totalSales)}</div>
                                <DollarSign size={20} color="#34d399" style={{ marginTop: '0.5rem' }} />
                            </div>
                            <div className="glass card">
                                <div className="metric-label">Gap to Goal</div>
                                <div className="metric-value">{formatCurrency(dashboardData.metrics.gapToGoal)}</div>
                                <Target size={20} color="#fb7185" style={{ marginTop: '0.5rem' }} />
                            </div>
                            <div className="glass card">
                                <div className="metric-label">Attainment %</div>
                                <div className="metric-value">{formatPercent(dashboardData.metrics.attainment)}</div>
                                <div style={{ height: '4px', background: '#334155', borderRadius: '2px', marginTop: '1rem' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${Math.min(100, dashboardData.metrics.attainment * 100)}%`,
                                        background: 'linear-gradient(to right, #60a5fa, #34d399)',
                                        borderRadius: '2px'
                                    }} />
                                </div>
                            </div>
                        </div>

                        <div className="charts-grid">
                            <div className="glass card" style={{ height: '400px' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Territory Attainment</h3>
                                <ResponsiveContainer width="100%" height="80%">
                                    <BarChart data={dashboardData.charts.territory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="market" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" tickFormatter={val => `${(val * 100)}%`} />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                            formatter={(val) => formatPercent(val)}
                                        />
                                        <Bar dataKey="attainment" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="glass card" style={{ height: '400px' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Daily Sales Trend</h3>
                                <ResponsiveContainer width="100%" height="80%">
                                    <LineChart data={dashboardData.charts.trend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip
                                            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                        />
                                        <Line type="monotone" dataKey="sales" stroke="#34d399" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default App;
