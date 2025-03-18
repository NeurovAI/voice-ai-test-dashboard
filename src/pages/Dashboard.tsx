import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Typography, 
  Paper, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Box,
  SelectChangeEvent,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { fetchCallAnalytics } from '../services/apiService';
import { formatDate, formatCurrency } from '../utils/formatters';
import { CallAnalytics } from '../types/api';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [timeRange, setTimeRange] = useState<string>('week');
  const [analyticsData, setAnalyticsData] = useState<CallAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Premium UI colors
  const uiColors = {
    background: '#111827', // Dark blue-gray for background
    cardBg: '#1f2937', // Slightly lighter blue-gray for cards
    accent: '#6366f1', // Indigo accent color
    text: '#f3f4f6', // Light gray text
    subtext: '#9ca3af', // Medium gray for subtitles
    border: '#374151', // Border color
    success: '#10b981', // Green for positive indicators
    chartColors: {
      calls: '#818cf8', // Indigo
      minutes: '#34d399', // Emerald green
      cost: '#fbbf24', // Amber
      avgDuration: '#f87171', // Rose
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch data from API
        const data = await fetchCallAnalytics(startDate, endDate);
        // Don't set error for empty data, just show empty graphs
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        setError('Failed to fetch data. Please check your Supabase credentials and connection.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setTimeRange(value);
    
    const now = new Date();
    let newStartDate = new Date();
    
    switch (value) {
      case 'day':
        // Set start date to beginning of today (midnight)
        newStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        // Set end date to current time today (to include all data so far today)
        setStartDate(newStartDate);
        setEndDate(now);
        return; // Early return to prevent end date override
      case 'week':
        newStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        newStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        newStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        // Set to a very old date to get all data
        newStartDate = new Date(2000, 0, 1);
        break;
      default:
        newStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    setStartDate(newStartDate);
    setEndDate(now);
  };

  // Calculate totals for summary
  const totalCalls = analyticsData.reduce((sum, item) => sum + item.calls, 0);
  const totalMinutes = analyticsData.reduce((sum, item) => sum + item.minutes, 0);
  const totalCost = analyticsData.reduce((sum, item) => sum + item.cost, 0);
  
  // Calculate average duration simply from total minutes divided by total calls
  const avgDuration = totalCalls > 0 ? Number((totalMinutes / totalCalls).toFixed(2)) : 0;

  // Create a better ensureChartData function
  const ensureChartData = (data: CallAnalytics[], dateRange: string): CallAnalytics[] => {
    if (data.length === 0 && dateRange === 'day') {
      // Create a series of time points throughout the day at 3-hour intervals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const timePoints: CallAnalytics[] = [];
      // Generate points from 0:00 to 21:00 (3-hour intervals)
      for (let hour = 0; hour <= 21; hour += 3) {
        const timePoint = new Date(today);
        timePoint.setHours(hour);
        timePoints.push({
          date: timePoint.toISOString(),
          calls: 0,
          minutes: 0,
          cost: 0,
          avgDuration: 0
        });
      }
      return timePoints;
    }
    return data;
  };

  return (
    <Box sx={{ 
      bgcolor: uiColors.background, 
      minHeight: '100vh',
      p: 3,
      color: uiColors.text
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        borderBottom: `1px solid ${uiColors.border}`,
        pb: 2
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            letterSpacing: '-0.025em'
          }}
        >
          Dashboard
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center',
          '& .MuiInputBase-root': {
            color: uiColors.text,
            bgcolor: 'rgba(255,255,255,0.05)',
            borderRadius: '8px',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.08)'
            }
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255,255,255,0.1)'
          },
          '& .MuiInputLabel-root': {
            color: uiColors.subtext
          }
        }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
              displayEmpty
            >
              <MenuItem value="day">Today</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="quarter">Last 90 Days</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {error && (
        <Card 
          elevation={0} 
          sx={{ 
            mb: 4,
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography sx={{ color: '#ef4444' }}>{error}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: uiColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${uiColors.border}`,
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  color: uiColors.subtext,
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                Total Calls
              </Typography>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: uiColors.chartColors.calls }} />
              ) : (
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    letterSpacing: '-0.025em'
                  }}
                >
                  {totalCalls}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: uiColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${uiColors.border}`,
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  color: uiColors.subtext,
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                Total Minutes
              </Typography>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: uiColors.chartColors.minutes }} />
              ) : (
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    letterSpacing: '-0.025em'
                  }}
                >
                  {totalMinutes.toFixed(1)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: uiColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${uiColors.border}`,
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  color: uiColors.subtext,
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                Total Cost
              </Typography>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: uiColors.chartColors.cost }} />
              ) : (
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    letterSpacing: '-0.025em'
                  }}
                >
                  {formatCurrency(totalCost)}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: uiColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${uiColors.border}`,
              height: '100%'
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography 
                variant="subtitle1" 
                gutterBottom 
                sx={{ 
                  color: uiColors.subtext,
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                Avg Duration
              </Typography>
              {isLoading ? (
                <CircularProgress size={24} sx={{ color: uiColors.chartColors.avgDuration }} />
              ) : (
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    letterSpacing: '-0.025em'
                  }}
                >
                  {avgDuration.toFixed(2)} min
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Total Calls Chart */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: uiColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${uiColors.border}`,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  mb: 2
                }}
              >
                Total Calls
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                  <CircularProgress sx={{ color: uiColors.chartColors.calls }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={ensureChartData(analyticsData, timeRange)}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: uiColors.text }}
                      tickFormatter={(date) => {
                        const dateObj = new Date(date);
                        if (timeRange === 'day') {
                          // Enhanced formatting for Today view with AM/PM
                          return dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toUpperCase();
                        } else if (timeRange === 'week' || timeRange === 'month') {
                          // Format as day of week or day of month
                          return dateObj.toLocaleDateString([], { weekday: 'short' });
                        } else {
                          // Format as month/day for Year view
                          return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        }
                      }}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      tick={{ fill: uiColors.text }} 
                      domain={[0, analyticsData.length > 0 ? 'auto' : 5]}
                      allowDecimals={false}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        borderColor: uiColors.border,
                        borderRadius: '6px',
                        color: uiColors.text
                      }}
                      formatter={(value) => [`${value} calls`, 'Calls']}
                      labelFormatter={(date) => {
                        const dateObj = new Date(date);
                        return dateObj.toLocaleString();
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke={uiColors.chartColors.calls}
                      activeDot={{ r: 8 }}
                      name="Calls"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Chart */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: uiColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${uiColors.border}`,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  mb: 2
                }}
              >
                Cost
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                  <CircularProgress sx={{ color: uiColors.chartColors.cost }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={ensureChartData(analyticsData, timeRange)}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: uiColors.text }}
                      tickFormatter={(date) => {
                        const dateObj = new Date(date);
                        if (timeRange === 'day') {
                          // Enhanced formatting for Today view with AM/PM
                          return dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toUpperCase();
                        } else if (timeRange === 'week' || timeRange === 'month') {
                          // Format as day of week or day of month
                          return dateObj.toLocaleDateString([], { weekday: 'short' });
                        } else {
                          // Format as month/day for Year view
                          return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        }
                      }}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      tick={{ fill: uiColors.text }} 
                      domain={[0, analyticsData.length > 0 ? 'auto' : 5]}
                      allowDecimals={false}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        borderColor: uiColors.border,
                        borderRadius: '6px',
                        color: uiColors.text
                      }}
                      formatter={(value) => [`$${value}`, 'Cost']}
                      labelFormatter={(date) => {
                        const dateObj = new Date(date);
                        return dateObj.toLocaleString();
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="cost" 
                      fill={uiColors.chartColors.cost} 
                      name="Cost" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Call Minutes Chart */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: uiColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${uiColors.border}`,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  mb: 2
                }}
              >
                Call Minutes
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                  <CircularProgress sx={{ color: uiColors.chartColors.minutes }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={ensureChartData(analyticsData, timeRange)}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: uiColors.text }}
                      tickFormatter={(date) => {
                        const dateObj = new Date(date);
                        if (timeRange === 'day') {
                          // Enhanced formatting for Today view with AM/PM
                          return dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toUpperCase();
                        } else if (timeRange === 'week' || timeRange === 'month') {
                          // Format as day of week or day of month
                          return dateObj.toLocaleDateString([], { weekday: 'short' });
                        } else {
                          // Format as month/day for Year view
                          return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        }
                      }}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      tick={{ fill: uiColors.text }} 
                      domain={[0, analyticsData.length > 0 ? 'auto' : 5]}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        borderColor: uiColors.border,
                        borderRadius: '6px',
                        color: uiColors.text
                      }}
                      formatter={(value) => [`${value} min`, 'Minutes']}
                      labelFormatter={(date) => {
                        const dateObj = new Date(date);
                        return dateObj.toLocaleString();
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke={uiColors.chartColors.minutes}
                      fill={`url(#colorMinutes)`}
                      name="Minutes"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={uiColors.chartColors.minutes} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={uiColors.chartColors.minutes} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Average Call Duration Chart */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={0} 
            sx={{ 
              bgcolor: uiColors.cardBg,
              borderRadius: '12px',
              border: `1px solid ${uiColors.border}`,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1.125rem',
                  mb: 2
                }}
              >
                Average Call Duration
              </Typography>
              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                  <CircularProgress sx={{ color: uiColors.chartColors.avgDuration }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={ensureChartData(analyticsData, timeRange)}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: uiColors.text }}
                      tickFormatter={(date) => {
                        const dateObj = new Date(date);
                        if (timeRange === 'day') {
                          // Enhanced formatting for Today view with AM/PM
                          return dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toUpperCase();
                        } else if (timeRange === 'week' || timeRange === 'month') {
                          // Format as day of week or day of month
                          return dateObj.toLocaleDateString([], { weekday: 'short' });
                        } else {
                          // Format as month/day for Year view
                          return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        }
                      }}
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      tick={{ fill: uiColors.text }} 
                      domain={[0, analyticsData.length > 0 ? 'auto' : 5]}
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        borderColor: uiColors.border,
                        borderRadius: '6px',
                        color: uiColors.text
                      }}
                      formatter={(value) => [`${value} min/call`, 'Avg Duration']}
                      labelFormatter={(date) => {
                        const dateObj = new Date(date);
                        return dateObj.toLocaleString();
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="avgDuration"
                      stroke={uiColors.chartColors.avgDuration}
                      fill={`url(#colorAvgDuration)`}
                      name="Avg Duration"
                      strokeWidth={2}
                    />
                    <defs>
                      <linearGradient id="colorAvgDuration" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={uiColors.chartColors.avgDuration} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={uiColors.chartColors.avgDuration} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* API Data Indicator */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: uiColors.subtext }}>
          Displaying data from Supabase database
        </Typography>
      </Box>
    </Box>
  );
};

export default Dashboard;