import axios from 'axios';
import { CallRecord, CallAnalytics, CallDetail } from '../types/api';

// Configure axios defaults
const API_URL = import.meta.env.VITE_API_URL || 'https://api.example.com';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create an axios instance for Supabase
const supabaseApi = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Fetch call analytics data with aggregated metrics by date
 */
export const fetchCallAnalytics = async (startDate: Date, endDate: Date): Promise<CallAnalytics[]> => {
  try {
    // Format the dates for the API request
    const formattedStartDate = startDate.toISOString();
    const formattedEndDate = endDate.toISOString();
    
    // Query Supabase for call records
    const response = await supabaseApi.get('/rest/v1/calls', {
      params: {
        select: '*',
        created_at: `gte.${formattedStartDate},lte.${formattedEndDate}`,
        order: 'created_at.asc'
      }
    });
    
    // Process the raw data into the format needed for analytics
    const callRecords: CallRecord[] = response.data || [];
    
    // Group by date and aggregate metrics
    const analytics: Record<string, CallAnalytics> = {};
    
    callRecords.forEach(item => {
      // Get the date part only (YYYY-MM-DD) for grouping
      const dateStr = new Date(item.created_at).toISOString().split('T')[0];
      
      // Convert seconds to minutes
      const durationMinutes = item.duration / 60;
      
      // Use actual cost from the database
      const callCost = item.cost || 0;
      
      // Initialize date entry if it doesn't exist
      if (!analytics[dateStr]) {
        analytics[dateStr] = {
          date: dateStr,
          calls: 0,
          minutes: 0,
          cost: 0,
          avgDuration: 0
        };
      }
      
      // Update metrics
      analytics[dateStr].calls += 1;
      analytics[dateStr].minutes += durationMinutes;
      analytics[dateStr].cost += callCost;
      
      // Recalculate average duration
      analytics[dateStr].avgDuration = 
        analytics[dateStr].minutes / analytics[dateStr].calls;
    });
    
    // Convert to array and ensure chronological order
    const result = Object.values(analytics).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return result;
  } catch (error) {
    console.error('Error fetching call analytics:', error);
    throw error;
  }
};

/**
 * Fetch call details with pagination
 */
export const fetchCallDetails = async (
  page = 1, 
  pageSize = 10,
  startDate?: Date,
  endDate?: Date
): Promise<{data: CallDetail[], total: number}> => {
  try {
    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Build query parameters
    const params: Record<string, any> = {
      select: '*',
      order: 'created_at.desc'
    };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      params.created_at = `gte.${startDate.toISOString()},lte.${endDate.toISOString()}`;
    }
    
    // Fetch count first
    const countResponse = await supabaseApi.get('/rest/v1/calls', {
      params: {
        ...params,
        count: 'exact',
        limit: 1
      },
      headers: {
        'Range-Unit': 'items',
        'Prefer': 'count=exact'
      }
    });
    
    // Get total count from headers
    const totalCount = parseInt(countResponse.headers['content-range']?.split('/')[1] || '0', 10);
    
    // Then fetch actual page data
    const response = await supabaseApi.get('/rest/v1/calls', {
      params: {
        ...params,
        limit: pageSize,
        offset: from
      },
      headers: {
        'Range': `${from}-${to}`,
        'Range-Unit': 'items',
        'Prefer': 'count=exact'
      }
    });
    
    const data = response.data || [];
    
    // Map to CallDetail format
    const callDetails: CallDetail[] = (data as CallRecord[]).map((item) => {
      return {
        id: item.id,
        timestamp: item.created_at,
        duration: item.duration,
        cost: item.cost || 0, // Use actual cost from database
        status: item.end_reason.includes('assistant') ? 'assistant-ended' : 'customer-ended',
        transcript: `Call with ${item["Customer Phone Number"] || 'unknown'}`
      };
    });
    
    return {
      data: callDetails,
      total: totalCount
    };
  } catch (error) {
    console.error('Error fetching call details:', error);
    throw error;
  }
};