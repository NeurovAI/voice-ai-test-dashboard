/**
 * Call record from the database
 */
export interface CallRecord {
  /** Unique identifier for the call */
  id: string;
  /** Start time of the call in ISO format */
  created_at: string;
  /** Duration of the call in seconds */
  duration: number;
  /** Cost of the call in dollars */
  cost: number; 
  /** Reason the call ended */
  end_reason: string;
  /** Customer phone number */
  "Customer Phone Number"?: string;
  /** Assistant used for the call */
  "Assistant"?: string;
}

/**
 * Call analytics data for dashboard charts
 */
export interface CallAnalytics {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Number of calls for the date */
  calls: number;
  /** Total minutes of calls for the date */
  minutes: number;
  /** Total cost of calls for the date */
  cost: number;
  /** Average duration of calls in minutes */
  avgDuration: number;
}

/**
 * Call detail data for call details table
 */
export interface CallDetail {
  /** Unique identifier for the call */
  id: string;
  /** Start time of the call in ISO format */
  timestamp: string;
  /** Duration of the call in seconds */
  duration: number;
  /** Cost of the call */
  cost: number;
  /** Status of the call */
  status: string;
  /** Full transcript of the call */
  transcript?: string;
}

/**
 * API response for call analytics
 */
export interface CallAnalyticsResponse {
  /** Array of call analytics data */
  data: CallAnalytics[];
  /** Pagination information */
  pagination?: {
    /** Total number of records */
    total: number;
    /** Current page */
    page: number;
    /** Number of records per page */
    per_page: number;
    /** Total number of pages */
    total_pages: number;
  };
}

/**
 * API response for call details
 */
export interface CallDetailsResponse {
  /** Array of call detail data */
  data: CallDetail[];
  /** Pagination information */
  pagination?: {
    /** Total number of records */
    total: number;
    /** Current page */
    page: number;
    /** Number of records per page */
    per_page: number;
    /** Total number of pages */
    total_pages: number;
  };
}

/**
 * API error response
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** Error code */
  code: string;
  /** HTTP status code */
  status: number;
}