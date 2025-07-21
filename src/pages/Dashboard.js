import React, { useState, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  BarChart3,
  Activity,
  Battery,
  Calendar,
  Target,
  Zap,
  Thermometer,
  Gauge,
  Download,
  Filter,
  Info,
  Printer,
  Star,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Minus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, ComposedChart } from 'recharts';
import api from '../components/api';

const Dashboard = () => {
  // Remove useFlightData, use local state for API integration
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for filters and UI
  const [dateRange, setDateRange] = useState('all'); // 'all', '30d', '90d', '6m', '1y'
  const [showTooltips, setShowTooltips] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [flightSearch, setFlightSearch] = useState('');
  const flightInputRef = useRef();
  const [showFlightModal, setShowFlightModal] = useState(false);

  // Add state for drone model filter
  const [selectedModel, setSelectedModel] = useState('ALL');
  const allKnownModels = [
    'Arsenio 001', 'Arsenio 002', 'Arsenio 003', 'Arsenio 004', 'Arsenio 005',
    'Argini 001', 'Argini 002', 'Argini 003', 'Argini 004', 'Argini 005',
    'Xander 001', 'Xander 002', 'Xander 003', 'Xander 004', 'Xander 005',
    'Damisa 001', 'Damisa 002', 'Damisa 003', 'Damisa 004', 'Damisa 005'
  ];
  const droneModels = Array.from(new Set([...allKnownModels, ...flights.map(f => f['DRONE MODEL']).filter(Boolean)]));

  // Filter flights by selected drone model
  const filteredByModel = selectedModel === 'ALL' ? flights : flights.filter(f => f['DRONE MODEL'] === selectedModel);

  // Fetch flight logs from backend
  const fetchFlights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/flight-logs');
      setFlights(res.data.map(f => ({
        ...f,
        'DRONE MODEL': f.drone_model,
        'MISSION DATE': f.mission_date,
        'MISSION OBJECTIVE': f.mission_objective,
        'FLIGHT ID': f.flight_id,
        'TAKE-OFF TIME': f.takeoff_time,
        'LANDING TIME': f.landing_time,
        'TOTAL FLIGHT TIME': f.total_flight_time,
        'ENGINE TIME (HOURS)': f.engine_time_hours,
        'FUEL LEVEL BEFORE FLIGHT': f.fuel_level_before_flight,
        'FUEL LEVEL AFTER FLIGHT': f.fuel_level_after_flight,
        'FUEL USED': f.fuel_used,
        'BATTERY 1 (S) TAKE-OFF VOLTAGE': f.battery1_takeoff_voltage,
        'BATTERY 1 (S) LANDING VOLTAGE': f.battery1_landing_voltage,
        'BATTERY 1 (S) VOLTAGE USED': f.battery1_voltage_used,
        'BATTERY 2 (S) TAKE-OFF VOLTAGE': f.battery2_takeoff_voltage,
        'BATTERY 2 (S) LANDING VOLTAGE': f.battery2_landing_voltage,
        'BATTERY 2 (S) VOLTAGE USED': f.battery2_voltage_used,
        'COMMENT': f.comment,
        id: f.id
      })));
      setError('');
    } catch (err) {
      setError('Failed to load flight logs.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchFlights();
  }, []);

  // Helper function to parse and format dates
  const parseAndFormatDate = (dateStr) => {
    if (!dateStr) return { formatted: 'Unknown', date: null, month: 'Unknown', dayOfWeek: 'Unknown', quarter: 'Unknown' };
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return { formatted: 'Invalid Date', date: null, month: 'Unknown', dayOfWeek: 'Unknown', quarter: 'Unknown' };
      
      return {
        formatted: date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        date: date,
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        quarter: `Q${Math.floor((date.getMonth() + 3) / 3)} ${date.getFullYear()}`,
        fullDate: date.toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      };
    } catch (error) {
      return { formatted: 'Invalid Date', date: null, month: 'Unknown', dayOfWeek: 'Unknown', quarter: 'Unknown' };
    }
  };

  // Helper function to parse flight time
  const parseFlightTime = (timeStr) => {
    if (!timeStr) return 0;
    const parts = String(timeStr).split(':').map(Number);
    if (parts.length === 3) return (parts[0] * 60 + parts[1] + parts[2] / 60);
    if (parts.length === 2) return (parts[0] + parts[1] / 60);
    return parseFloat(timeStr) || 0;
  };

  // Filter flights by date range
  const filterFlightsByDate = (flights) => {
    if (dateRange === 'all') return flights;
    
    const now = new Date();
    let cutoffDate;
    
    switch (dateRange) {
      case '30d':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return flights;
    }
    
    return flights.filter(f => {
      const dateInfo = parseAndFormatDate(f['MISSION DATE']);
      return dateInfo.date && dateInfo.date >= cutoffDate;
    });
  };

  // Enhanced data processing
  const processFlightData = () => {
    const filteredFlights = filterFlightsByDate(filteredByModel);
    
    return filteredFlights.map(f => {
      const flightTime = parseFlightTime(f['TOTAL FLIGHT TIME']);
      const battery1TakeOff = parseFloat(f['BATTERY 1 (S) TAKE-OFF VOLTAGE']) || 0;
      const battery1Landing = parseFloat(f['BATTERY 1 (S) LANDING VOLTAGE']) || 0;
      const battery1Used = parseFloat(f['BATTERY 1 (S) VOLTAGE USED']) || 0;
      const battery2TakeOff = parseFloat(f['BATTERY 2 (S) TAKE-OFF VOLTAGE']) || 0;
      const battery2Landing = parseFloat(f['BATTERY 2 (S) LANDING VOLTAGE']) || 0;
      const battery2Used = parseFloat(f['BATTERY 2 (S) VOLTAGE USED']) || 0;
      const engineTime = parseFloat(f['ENGINE TIME (HOURS)']) || 0;
      const fuelUsed = parseFloat(f['FUEL USED']) || 0;
      
      const dateInfo = parseAndFormatDate(f['MISSION DATE']);
      
      return {
        ...f,
        flightTimeMinutes: flightTime,
        battery1Efficiency: battery1TakeOff > 0 ? ((battery1TakeOff - battery1Landing) / battery1TakeOff * 100) : 0,
        battery2Efficiency: battery2TakeOff > 0 ? ((battery2TakeOff - battery2Landing) / battery2TakeOff * 100) : 0,
        battery1Used: battery1Used,
        battery2Used: battery2Used,
        hasIssues: f['COMMENT'] && f['COMMENT'].trim() && f['COMMENT'].toLowerCase() !== 'no issues.',
        month: dateInfo.month,
        dayOfWeek: dateInfo.dayOfWeek,
        quarter: dateInfo.quarter,
        formattedDate: dateInfo.formatted,
        fullDate: dateInfo.fullDate,
        dateObject: dateInfo.date,
        engineTime: engineTime,
        fuelUsed: fuelUsed,
      };
    });
  };

  const processedFlights = useMemo(() => processFlightData(), [filteredByModel, dateRange]);

  // Prepare all flights for selector
  const allFlights = filteredByModel;
  const flightOptions = allFlights.map(f => ({
    id: f['FLIGHT ID'],
    label: `${f['FLIGHT ID']} | ${f['MISSION DATE']} | ${f['MISSION OBJECTIVE']}`,
    ...f
  }));
  const filteredFlightOptions = flightOptions.filter(opt =>
    opt.label.toLowerCase().includes(flightSearch.toLowerCase())
  );
  const selectedFlight = selectedFlightId ? allFlights.find(f => f['FLIGHT ID'] === selectedFlightId) : null;

  // Filtered data for dashboard
  const filteredProcessedFlights = useMemo(() => {
    if (selectedFlight) return [
      {
        ...selectedFlight,
        ...processFlightData().find(f => f['FLIGHT ID'] === selectedFlightId)
      }
    ];
    return processFlightData();
  }, [selectedFlight, selectedFlightId, filteredByModel, dateRange]);

  // Performance Score Calculation
  const calculatePerformanceScore = () => {
    if (filteredProcessedFlights.length === 0) return { score: 0, health: 'unknown', trend: 'neutral' };
    
    const totalFlights = filteredProcessedFlights.length;
    const flightsWithIssues = filteredProcessedFlights.filter(f => f.hasIssues).length;
    const avgBattery1Efficiency = filteredProcessedFlights.filter(f => f.battery1Efficiency > 0).reduce((sum, f) => sum + f.battery1Efficiency, 0) / Math.max(1, filteredProcessedFlights.filter(f => f.battery1Efficiency > 0).length);
    const avgBattery2Efficiency = filteredProcessedFlights.filter(f => f.battery2Efficiency > 0).reduce((sum, f) => sum + f.battery2Efficiency, 0) / Math.max(1, filteredProcessedFlights.filter(f => f.battery2Efficiency > 0).length);
    
    // Calculate individual scores (0-100)
    const issueScore = Math.max(0, 100 - (flightsWithIssues / totalFlights * 100));
    const batteryScore = ((avgBattery1Efficiency + avgBattery2Efficiency) / 2) * 2; // Scale to 0-100
    const efficiencyScore = Math.min(100, (avgBattery1Efficiency + avgBattery2Efficiency) / 2);
    
    const overallScore = Math.round((issueScore * 0.4 + batteryScore * 0.4 + efficiencyScore * 0.2));
    
    // Determine health status
    let health = 'excellent';
    if (overallScore < 60) health = 'critical';
    else if (overallScore < 75) health = 'poor';
    else if (overallScore < 85) health = 'good';
    
    // Determine trend (simplified - could be enhanced with historical comparison)
    const trend = 'neutral'; // Placeholder for trend calculation
    
    return { score: overallScore, health, trend };
  };

  const performanceScore = calculatePerformanceScore();

  // Enhanced key metrics
  const totalFlights = filteredProcessedFlights.length;
  const totalFlightTime = filteredProcessedFlights.reduce((sum, f) => sum + f.flightTimeMinutes, 0);
  const avgFlightTime = totalFlights ? (totalFlightTime / totalFlights).toFixed(1) : 0;
  const avgBattery1Efficiency = filteredProcessedFlights.filter(f => f.battery1Efficiency > 0).reduce((sum, f) => sum + f.battery1Efficiency, 0) / Math.max(1, filteredProcessedFlights.filter(f => f.battery1Efficiency > 0).length);
  const avgBattery2Efficiency = filteredProcessedFlights.filter(f => f.battery2Efficiency > 0).reduce((sum, f) => sum + f.battery2Efficiency, 0) / Math.max(1, filteredProcessedFlights.filter(f => f.battery2Efficiency > 0).length);
  const flightsWithIssues = filteredProcessedFlights.filter(f => f.hasIssues).length;
  const issueRate = totalFlights ? ((flightsWithIssues / totalFlights) * 100).toFixed(1) : 0;
  
  // Battery usage analysis
  const totalBattery1Used = filteredProcessedFlights.reduce((sum, f) => sum + f.battery1Used, 0);
  const totalBattery2Used = filteredProcessedFlights.reduce((sum, f) => sum + f.battery2Used, 0);
  const avgBattery1Used = filteredProcessedFlights.filter(f => f.battery1Used > 0).length > 0 ? 
    filteredProcessedFlights.filter(f => f.battery1Used > 0).reduce((sum, f) => sum + f.battery1Used, 0) / filteredProcessedFlights.filter(f => f.battery1Used > 0).length : 0;
  const avgBattery2Used = filteredProcessedFlights.filter(f => f.battery2Used > 0).length > 0 ? 
    filteredProcessedFlights.filter(f => f.battery2Used > 0).reduce((sum, f) => sum + f.battery2Used, 0) / filteredProcessedFlights.filter(f => f.battery2Used > 0).length : 0;

  // Mission Objective Analysis
  const missionObjectiveData = (() => {
    const missionStats = {};
    filteredProcessedFlights.forEach(f => {
      const objective = f['MISSION OBJECTIVE'] || 'Unknown';
      if (!missionStats[objective]) {
        missionStats[objective] = { count: 0, totalTime: 0, issues: 0, avgBatteryEfficiency: 0, batteryCount: 0 };
      }
      missionStats[objective].count++;
      missionStats[objective].totalTime += f.flightTimeMinutes;
      if (f.hasIssues) missionStats[objective].issues++;
      if (f.battery1Efficiency > 0 || f.battery2Efficiency > 0) {
        missionStats[objective].avgBatteryEfficiency += (f.battery1Efficiency + f.battery2Efficiency) / 2;
        missionStats[objective].batteryCount++;
      }
    });
    
    return Object.entries(missionStats)
      .map(([objective, stats]) => ({
        objective: objective.length > 20 ? objective.substring(0, 20) + '...' : objective,
        fullObjective: objective,
        count: stats.count,
        avgTime: stats.count > 0 ? (stats.totalTime / stats.count).toFixed(1) : 0,
        issueRate: stats.count > 0 ? ((stats.issues / stats.count) * 100).toFixed(1) : 0,
        avgBatteryEfficiency: stats.batteryCount > 0 ? (stats.avgBatteryEfficiency / stats.batteryCount).toFixed(1) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 missions
  })();

  // Flight Time Distribution
  const flightTimeDistribution = (() => {
    const timeRanges = [
      { range: '0-5 min', min: 0, max: 5, count: 0 },
      { range: '5-10 min', min: 5, max: 10, count: 0 },
      { range: '10-15 min', min: 10, max: 15, count: 0 },
      { range: '15-20 min', min: 15, max: 20, count: 0 },
      { range: '20+ min', min: 20, max: Infinity, count: 0 }
    ];
    
    filteredProcessedFlights.forEach(f => {
      const time = f.flightTimeMinutes;
      const range = timeRanges.find(r => time >= r.min && time < r.max);
      if (range) range.count++;
    });
    
    return timeRanges;
  })();

  // Battery Voltage Correlation
  const batteryVoltageCorrelation = filteredProcessedFlights
    .filter(f => parseFloat(f['BATTERY 1 (S) TAKE-OFF VOLTAGE']) > 0 && parseFloat(f['BATTERY 1 (S) LANDING VOLTAGE']) > 0)
    .map(f => ({
      takeOff: parseFloat(f['BATTERY 1 (S) TAKE-OFF VOLTAGE']),
      landing: parseFloat(f['BATTERY 1 (S) LANDING VOLTAGE']),
      flightId: f['FLIGHT ID']
    }));

  // Flight frequency by day of week
  const dayOfWeekData = (() => {
    const dayCounts = {};
    filteredProcessedFlights.forEach(f => {
      const day = f.dayOfWeek;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      flights: dayCounts[day] || 0
    }));
  })();

  // Monthly flight trends
  const monthlyData = (() => {
    const monthly = {};
    filteredProcessedFlights.forEach(f => {
      const month = f.month;
      if (!monthly[month]) {
        monthly[month] = { flights: 0, totalTime: 0, issues: 0, avgBattery1Efficiency: 0, avgBattery2Efficiency: 0, battery1Count: 0, battery2Count: 0 };
      }
      monthly[month].flights++;
      monthly[month].totalTime += f.flightTimeMinutes;
      if (f.hasIssues) monthly[month].issues++;
      if (f.battery1Efficiency > 0) {
        monthly[month].avgBattery1Efficiency += f.battery1Efficiency;
        monthly[month].battery1Count++;
      }
      if (f.battery2Efficiency > 0) {
        monthly[month].avgBattery2Efficiency += f.battery2Efficiency;
        monthly[month].battery2Count++;
      }
    });
    return Object.entries(monthly)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .map(([month, data]) => ({
        month,
        flights: data.flights,
        totalTime: Math.round(data.totalTime),
        avgTime: Math.round(data.totalTime / data.flights),
        issues: data.issues,
        issueRate: ((data.issues / data.flights) * 100).toFixed(1),
        avgBattery1Efficiency: data.battery1Count > 0 ? (data.avgBattery1Efficiency / data.battery1Count).toFixed(1) : 0,
        avgBattery2Efficiency: data.battery2Count > 0 ? (data.avgBattery2Efficiency / data.battery2Count).toFixed(1) : 0
      }));
  })();

  // Flight time vs battery efficiency scatter plot
  const efficiencyScatterData = filteredProcessedFlights
    .filter(f => f.flightTimeMinutes > 0 && (f.battery1Efficiency > 0 || f.battery2Efficiency > 0))
    .map(f => ({
      flightTime: f.flightTimeMinutes,
      battery1Efficiency: f.battery1Efficiency,
      battery2Efficiency: f.battery2Efficiency,
      flightId: f['FLIGHT ID']
    }));

  // Battery health chart data
  const batteryChartData = filteredProcessedFlights
    .filter(f => f.dateObject)
    .sort((a, b) => a.dateObject - b.dateObject)
    .map(f => ({
      missionDate: f.formattedDate,
      fullDate: f.fullDate,
      battery1TakeOff: parseFloat(f['BATTERY 1 (S) TAKE-OFF VOLTAGE']) || 0,
      battery1Landing: parseFloat(f['BATTERY 1 (S) LANDING VOLTAGE']) || 0,
      battery2TakeOff: parseFloat(f['BATTERY 2 (S) TAKE-OFF VOLTAGE']) || 0,
      battery2Landing: parseFloat(f['BATTERY 2 (S) LANDING VOLTAGE']) || 0,
      battery1Efficiency: f.battery1Efficiency,
      battery2Efficiency: f.battery2Efficiency,
      flightTime: f.flightTimeMinutes
    }));

  // Battery efficiency distribution
  const batteryEfficiencyData = (() => {
    const b1Efficiencies = filteredProcessedFlights.filter(f => f.battery1Efficiency > 0).map(f => f.battery1Efficiency);
    const b2Efficiencies = filteredProcessedFlights.filter(f => f.battery2Efficiency > 0).map(f => f.battery2Efficiency);
    
    const ranges = [
      { range: '0-10%', b1: 0, b2: 0 },
      { range: '10-20%', b1: 0, b2: 0 },
      { range: '20-30%', b1: 0, b2: 0 },
      { range: '30-40%', b1: 0, b2: 0 },
      { range: '40%+', b1: 0, b2: 0 }
    ];

    b1Efficiencies.forEach(eff => {
      if (eff <= 10) ranges[0].b1++;
      else if (eff <= 20) ranges[1].b1++;
      else if (eff <= 30) ranges[2].b1++;
      else if (eff <= 40) ranges[3].b1++;
      else ranges[4].b1++;
    });

    b2Efficiencies.forEach(eff => {
      if (eff <= 10) ranges[0].b2++;
      else if (eff <= 20) ranges[1].b2++;
      else if (eff <= 30) ranges[2].b2++;
      else if (eff <= 40) ranges[3].b2++;
      else ranges[4].b2++;
    });

    return ranges;
  })();

  // Issue tracker data
  const issueFlights = filteredProcessedFlights.filter(f => f.hasIssues);

  // Export functionality
  const exportDashboard = () => {
    const data = {
      performanceScore,
      metrics: {
        totalFlights,
        totalFlightTime,
        avgFlightTime,
        avgBattery1Efficiency,
        avgBattery2Efficiency,
        flightsWithIssues,
        issueRate
      },
      dateRange: {
        selected: dateRange,
        label: dateRangeInfo.label,
        count: dateRangeInfo.count
      },
      droneModel: selectedModel,
      exportDate: new Date().toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      dataSummary: {
        dateRange: dateRangeInfo.label,
        totalFlights: totalFlights,
        dateRangeCount: dateRangeInfo.count,
        performanceScore: performanceScore.score,
        healthStatus: performanceScore.health
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briech-uas-dashboard-${selectedModel}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print functionality
  const printDashboard = () => {
    window.print();
  };

  // Health indicator colors
  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'poor': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Trend indicator
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  // Custom tooltip for battery chart
  const CustomBatteryTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.fullDate}</p>
          <p className="text-sm text-gray-600 mb-2">Flight Time: {data.flightTime.toFixed(1)} min</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}V
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Get date range display label
  const getDateRangeLabel = () => {
    switch (dateRange) {
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '6m': return 'Last 6 Months';
      case '1y': return 'Last Year';
      default: return 'All Time';
    }
  };

  // Get current date range info
  const getDateRangeInfo = () => {
    if (dateRange === 'all') return { label: 'All Time', count: filteredProcessedFlights.length };
    
    const now = new Date();
    let startDate;
    
    switch (dateRange) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return { label: 'All Time', count: filteredProcessedFlights.length };
    }
    
    return {
      label: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      count: filteredProcessedFlights.length
    };
  };

  const dateRangeInfo = getDateRangeInfo();

  // Model-specific battery configuration
  const modelBatteryConfig = {
    // Argini and Damisa: B1=3S, B2=12S
    'Argini 001': { b1: '3S', b2: '12S' },
    'Argini 002': { b1: '3S', b2: '12S' },
    'Argini 003': { b1: '3S', b2: '12S' },
    'Argini 004': { b1: '3S', b2: '12S' },
    'Argini 005': { b1: '3S', b2: '12S' },
    'Damisa 001': { b1: '3S', b2: '12S' },
    'Damisa 002': { b1: '3S', b2: '12S' },
    'Damisa 003': { b1: '3S', b2: '12S' },
    'Damisa 004': { b1: '3S', b2: '12S' },
    'Damisa 005': { b1: '3S', b2: '12S' },
    // Arsenio: B1=3S, B2=7S
    'Arsenio 001': { b1: '3S', b2: '7S' },
    'Arsenio 002': { b1: '3S', b2: '7S' },
    'Arsenio 003': { b1: '3S', b2: '7S' },
    'Arsenio 004': { b1: '3S', b2: '7S' },
    'Arsenio 005': { b1: '3S', b2: '7S' },
    // Xander: B1=6S, B2=none
    'Xander 001': { b1: '6S', b2: null },
    'Xander 002': { b1: '6S', b2: null },
    'Xander 003': { b1: '6S', b2: null },
    'Xander 004': { b1: '6S', b2: null },
    'Xander 005': { b1: '6S', b2: null },
  };

  // Add 6S to batteryConfigs
  const batteryConfigs = {
    '3S': 3,
    '6S': 6,
    '7S': 7,
    '12S': 12
  };

  // Helper to get battery type for a flight and battery slot
  function getBatteryTypeForFlight(f, slot) {
    const model = f['DRONE MODEL'];
    const config = modelBatteryConfig[model];
    if (!config) return null;
    return slot === 1 ? config.b1 : config.b2;
  }

  // Helper to calculate per-cell voltage
  function getPerCellVoltage(totalVoltage, type) {
    const cells = batteryConfigs[type];
    if (!cells) return null;
    return parseFloat(totalVoltage) / cells;
  }

  // Helper to get battery health status
  function getBatteryHealthStatus(takeoffV, landingV, type) {
    const perCellTakeoff = getPerCellVoltage(takeoffV, type);
    const perCellLanding = getPerCellVoltage(landingV, type);
    let status = 'Unknown';
    let warning = '';
    if (perCellLanding !== null) {
      if (perCellLanding <= 3.4) {
        status = 'Low Voltage';
        warning = 'Consider replacing battery';
      } else if (perCellLanding >= 4.15) {
        status = 'Fully Charged';
      } else if (perCellLanding >= 3.65 && perCellLanding < 4.15) {
        status = 'Nominal';
      }
    }
    return { status, perCellTakeoff, perCellLanding, warning };
  }

  // Helper to check for imbalance (simulate with takeoff/landing diff for now)
  function getImbalanceWarning(takeoffV, landingV, type) {
    // In real world, you'd have per-cell voltages; here we simulate
    const perCellTakeoff = getPerCellVoltage(takeoffV, type);
    const perCellLanding = getPerCellVoltage(landingV, type);
    if (perCellTakeoff !== null && perCellLanding !== null) {
      const diff = Math.abs(perCellTakeoff - perCellLanding);
      if (diff > 0.006) {
        return 'Imbalance detected (isolate battery)';
      }
    }
    return '';
  }

  // Enhance processedFlights with battery health info using model-specific config
  const processedFlightsWithBattery = processedFlights.map(f => {
    // Battery 1
    const b1Type = getBatteryTypeForFlight(f, 1);
    const b1 = b1Type ? getBatteryHealthStatus(f['BATTERY 1 (S) TAKE-OFF VOLTAGE'], f['BATTERY 1 (S) LANDING VOLTAGE'], b1Type) : { status: 'N/A' };
    const b1Imbalance = b1Type ? getImbalanceWarning(f['BATTERY 1 (S) TAKE-OFF VOLTAGE'], f['BATTERY 1 (S) LANDING VOLTAGE'], b1Type) : '';
    // Battery 2
    const b2Type = getBatteryTypeForFlight(f, 2);
    const b2 = b2Type ? getBatteryHealthStatus(f['BATTERY 2 (S) TAKE-OFF VOLTAGE'], f['BATTERY 2 (S) LANDING VOLTAGE'], b2Type) : { status: 'N/A' };
    const b2Imbalance = b2Type ? getImbalanceWarning(f['BATTERY 2 (S) TAKE-OFF VOLTAGE'], f['BATTERY 2 (S) LANDING VOLTAGE'], b2Type) : '';
    return {
      ...f,
      battery1Type: b1Type,
      battery1Status: b1.status,
      battery1PerCellTakeoff: b1.perCellTakeoff,
      battery1PerCellLanding: b1.perCellLanding,
      battery1Warning: b1.warning,
      battery1Imbalance: b1Imbalance,
      battery2Type: b2Type,
      battery2Status: b2.status,
      battery2PerCellTakeoff: b2.perCellTakeoff,
      battery2PerCellLanding: b2.perCellLanding,
      battery2Warning: b2.warning,
      battery2Imbalance: b2Imbalance
    };
  });

  // Summary widgets
  const batteriesToReplace = processedFlightsWithBattery.filter(f => f.battery1Status === 'Low Voltage' || f.battery2Status === 'Low Voltage').length;
  const batteriesImbalanced = processedFlightsWithBattery.filter(f => f.battery1Imbalance || f.battery2Imbalance).length;

  // Add summary widgets for each model
  const modelFlightCounts = allKnownModels.map(model => ({
    model,
    count: flights.filter(f => f['DRONE MODEL'] === model).length
  }));

  const totalEngineHours = filteredProcessedFlights.reduce((sum, f) => sum + f.engineTime, 0);
  const totalFuelUsed = filteredProcessedFlights.reduce((sum, f) => sum + f.fuelUsed, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-gray-50/80 backdrop-blur-sm -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-4 mb-6 border-b border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quality Control Dashboard</h1>
          
          {/* Export & Print Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportDashboard}
              className="btn-secondary flex items-center gap-2 text-sm"
              title="Export Dashboard Data"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={printDashboard}
              className="btn-secondary flex items-center gap-2 text-sm"
              title="Print Dashboard"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>

          
        </div>
      </div>

      {/* Header with Branding and Flight Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quality Control Dashboard</h1>
              <p className="text-gray-600">Briech UAS | Real-time monitoring and analytics</p>
              <p className="text-sm text-primary-600 font-medium">{dateRangeInfo.label} • {dateRangeInfo.count} flights</p>
            </div>
          </div>
          <div className="relative w-80">
            <input
              ref={flightInputRef}
              type="text"
              placeholder="Search Flight ID, Date, or Objective..."
              value={flightSearch}
              onChange={e => setFlightSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              onFocus={() => setFlightSearch('')}
            />
            {flightSearch && (
              <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 w-full max-h-60 overflow-y-auto">
                {filteredFlightOptions.length === 0 && (
                  <div className="px-4 py-2 text-gray-500">No flights found</div>
                )}
                {filteredFlightOptions.map(opt => (
                  <div
                    key={opt.id}
                    className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm"
                    onClick={() => {
                      setSelectedFlightId(opt.id);
                      setFlightSearch(opt.label);
                      setShowFlightModal(true);
                      flightInputRef.current.blur();
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedFlight && showFlightModal && (
            <button
              className="ml-2 px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
              onClick={() => setShowFlightModal(false)}
            >
              Clear Filter
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          {/* Drone Model Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="drone-model" className="text-sm font-medium text-gray-700">Model:</label>
            <select
              id="drone-model"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="ALL">All Models</option>
              {droneModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          
        </div>
      </div>

      {/* Performance Score & Health Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-primary-600" />
                <p className="text-sm font-medium text-gray-600">Performance Score</p>
                <button
                  onClick={() => setShowTooltips(!showTooltips)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Performance Score combines flight efficiency, battery health, and issue rate"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <p className="text-3xl font-bold text-gray-900">{performanceScore.score}/100</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(performanceScore.health)}`}>
                  {performanceScore.health.charAt(0).toUpperCase() + performanceScore.health.slice(1)}
                </span>
                {getTrendIcon(performanceScore.trend)}
              </div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-primary-200 flex items-center justify-center">
              <div 
                className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center"
                style={{
                  background: `conic-gradient(#0A3A67 ${performanceScore.score * 3.6}deg, #e5e7eb ${performanceScore.score * 3.6}deg)`
                }}
              >
                <span className="text-white text-sm font-bold">{performanceScore.score}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Flights</p>
              <p className="text-2xl font-bold text-gray-900">{totalFlights}</p>
              <p className="text-xs text-gray-500">Filtered: {dateRangeInfo.label}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Flight Time</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalFlightTime)} min</p>
              <p className="text-xs text-gray-500">Avg: {avgFlightTime} min/flight</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Issue Rate</p>
              <p className="text-2xl font-bold text-gray-900">{issueRate}%</p>
              <p className="text-xs text-gray-500">{flightsWithIssues} flights with issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Battery Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <Battery className="h-6 w-6 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Battery Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{avgBattery1Efficiency.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">B1: {avgBattery1Efficiency.toFixed(1)}% | B2: {avgBattery2Efficiency.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Battery 1 Used</p>
              <p className="text-2xl font-bold text-gray-900">{totalBattery1Used.toFixed(1)}V</p>
              <p className="text-xs text-gray-500">Avg: {avgBattery1Used.toFixed(1)}V/flight</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Zap className="h-6 w-6 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Battery 2 Used</p>
              <p className="text-2xl font-bold text-gray-900">{totalBattery2Used.toFixed(1)}V</p>
              <p className="text-xs text-gray-500">Avg: {avgBattery2Used.toFixed(1)}V/flight</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <Gauge className="h-6 w-6 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Operational Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{((100 - parseFloat(issueRate)) * (avgBattery1Efficiency / 100)).toFixed(1)}%</p>
              <p className="text-xs text-gray-500">Combined metric</p>
            </div>
          </div>
        </div>
      </div>
   {/* New Summary Widgets */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card bg-blue-50 border-blue-200 text-blue-800">
          <div className="flex items-center">
            <Thermometer className="h-6 w-6" />
            <div className="ml-4">
              <p className="text-sm font-medium">Total Engine Hours</p>
              <p className="text-2xl font-bold">{totalEngineHours.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-purple-200 text-purple-800">
          <div className="flex items-center">
            <BarChart3 className="h-6 w-6" />
            <div className="ml-4">
              <p className="text-sm font-medium">Total Fuel Used</p>
              <p className="text-2xl font-bold">{totalFuelUsed.toFixed(2)} L</p>
            </div>
          </div>
        </div>
      </div>
       {/* Summary Widgets */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card bg-red-50 border-red-200 text-red-800">
          <div className="flex items-center">
            <XCircle className="h-6 w-6" />
            <div className="ml-4">
              <p className="text-sm font-medium">Batteries to Replace</p>
              <p className="text-2xl font-bold">{batteriesToReplace}</p>
            </div>
          </div>
        </div>
        <div className="card bg-yellow-50 border-yellow-200 text-yellow-800">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6" />
            <div className="ml-4">
              <p className="text-sm font-medium">Batteries Imbalanced</p>
              <p className="text-2xl font-bold">{batteriesImbalanced}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mission Objective Analysis */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mission Objective Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={missionObjectiveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="objective" />
              <YAxis />
              <Tooltip formatter={(value, name, props) => [value, props.payload.fullObjective]} />
              <Bar dataKey="count" fill="#0A3A67" name="Flights" />
              <Line type="monotone" dataKey="avgBatteryEfficiency" stroke="#F5B700" strokeWidth={2} name="Battery Efficiency (%)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Flight Time Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={flightTimeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0A3A67" name="Flights" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Battery Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Battery Voltage Correlation */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Battery Voltage Correlation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={batteryVoltageCorrelation}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="takeOff" name="Take-off Voltage" />
              <YAxis name="Landing Voltage" />
              <Tooltip />
              <Scatter dataKey="landing" fill="#0A3A67" name="Landing vs Take-off" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Performance Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="flights" stroke="#0A3A67" fill="#0A3A67" fillOpacity={0.3} name="Flights" />
              <Line type="monotone" dataKey="avgTime" stroke="#F5B700" strokeWidth={2} name="Avg Time (min)" />
              <Line type="monotone" dataKey="issueRate" stroke="#ef4444" strokeWidth={2} name="Issue Rate (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Flight Frequency by Day of Week */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Frequency by Day of Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayOfWeekData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="flights" fill="#0A3A67" name="Flights" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Battery Health Over Time */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Battery Health Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={batteryChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="missionDate" />
              <YAxis />
              <Tooltip content={<CustomBatteryTooltip />} />
              <Line type="monotone" dataKey="battery1TakeOff" stroke="#0A3A67" strokeWidth={2} name="B1 Take-off" />
              <Line type="monotone" dataKey="battery1Landing" stroke="#F5B700" strokeWidth={2} name="B1 Landing" />
              <Line type="monotone" dataKey="battery2TakeOff" stroke="#3b82f6" strokeWidth={2} name="B2 Take-off" />
              <Line type="monotone" dataKey="battery2Landing" stroke="#10b981" strokeWidth={2} name="B2 Landing" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Battery Efficiency Distribution */}
      <div className="card mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Battery Efficiency Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={batteryEfficiencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="b1" fill="#0A3A67" name="Battery 1 (3S)" />
            <Bar dataKey="b2" fill="#F5B700" name="Battery 2 (2S)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Issue Tracker Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Issue Tracker</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mission Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mission Objective</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issueFlights.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-2 text-center text-gray-500">No issues found in the selected time range.</td></tr>
              )}
              {issueFlights.map((f, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{f.formattedDate}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{f['FLIGHT ID']}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{f['MISSION OBJECTIVE']}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{f['TOTAL FLIGHT TIME']}</td>
                  <td className="px-4 py-2 whitespace-pre-line text-sm text-gray-900">{f['COMMENT']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

     

      {/* Model Flight Counts Widgets */}
      {/* This section is removed as per the edit hint. */}

   

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-400">
        © 2025 Briech UAS. All rights reserved. | Dashboard generated on {new Date().toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} | Data range: {dateRangeInfo.label}
      </footer>

      {/* If a flight is selected, show a detailed card and dim the rest of the dashboard */}
      {selectedFlight && showFlightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full relative animate-slide-up">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowFlightModal(false)}>&times;</button>
            <h2 className="text-2xl font-bold mb-2">Flight Details</h2>
            <div className="mb-4 text-gray-700">
              <div><b>Flight ID:</b> {selectedFlight['FLIGHT ID']}</div>
              <div><b>Date:</b> {selectedFlight['MISSION DATE']}</div>
              <div><b>Objective:</b> {selectedFlight['MISSION OBJECTIVE']}</div>
              <div><b>Take-off Time:</b> {selectedFlight['TAKE-OFF TIME']}</div>
              <div><b>Landing Time:</b> {selectedFlight['LANDING TIME']}</div>
              <div><b>Total Flight Time:</b> {selectedFlight['TOTAL FLIGHT TIME']}</div>
              <div><b>Engine Time:</b> {selectedFlight['ENGINE TIME (HOURS)']} hrs</div>
              <div><b>Fuel Used:</b> {selectedFlight['FUEL USED']} L</div>
              <div><b>Battery 1 (Take-off/Landing/Used):</b> {selectedFlight['BATTERY 1 (S) TAKE-OFF VOLTAGE']}V / {selectedFlight['BATTERY 1 (S) LANDING VOLTAGE']}V / {selectedFlight['BATTERY 1 (S) VOLTAGE USED']}V</div>
              <div><b>Battery 2 (Take-off/Landing/Used):</b> {selectedFlight['BATTERY 2 (S) TAKE-OFF VOLTAGE']}V / {selectedFlight['BATTERY 2 (S) LANDING VOLTAGE']}V / {selectedFlight['BATTERY 2 (S) VOLTAGE USED']}V</div>
              <div><b>Battery 1:</b> {selectedFlight.battery1Type} | {selectedFlight.battery1Status} | Per-cell: {selectedFlight.battery1PerCellLanding?.toFixed(3)}V {selectedFlight.battery1Warning && <span className="text-red-600">({selectedFlight.battery1Warning})</span>} {selectedFlight.battery1Imbalance && <span className="text-yellow-600">({selectedFlight.battery1Imbalance})</span>}</div>
              <div><b>Battery 2:</b> {selectedFlight.battery2Type} | {selectedFlight.battery2Status} | Per-cell: {selectedFlight.battery2PerCellLanding?.toFixed(3)}V {selectedFlight.battery2Warning && <span className="text-red-600">({selectedFlight.battery2Warning})</span>} {selectedFlight.battery2Imbalance && <span className="text-yellow-600">({selectedFlight.battery2Imbalance})</span>}</div>
              <div><b>Inspector:</b> {selectedFlight['INSPECTOR'] || 'N/A'}</div>
              <div><b>Comment:</b> {selectedFlight['COMMENT']}</div>
            </div>
            {/* Mini battery chart for this flight */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Battery Voltage</h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={[
                  { name: 'Take-off', B1: parseFloat(selectedFlight['BATTERY 1 (S) TAKE-OFF VOLTAGE']) || 0, B2: parseFloat(selectedFlight['BATTERY 2 (S) TAKE-OFF VOLTAGE']) || 0 },
                  { name: 'Landing', B1: parseFloat(selectedFlight['BATTERY 1 (S) LANDING VOLTAGE']) || 0, B2: parseFloat(selectedFlight['BATTERY 2 (S) LANDING VOLTAGE']) || 0 }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="B1" stroke="#0A3A67" strokeWidth={2} name="Battery 1" />
                  <Line type="monotone" dataKey="B2" stroke="#F5B700" strokeWidth={2} name="Battery 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Issue/Comment highlight */}
            {selectedFlight['COMMENT'] && (
              <div className="p-3 rounded-lg bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 mb-2">
                <b>Comment:</b> {selectedFlight['COMMENT']}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 