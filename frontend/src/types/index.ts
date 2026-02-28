export interface User {
  id: number;
  email: string;
  company_id: number;
  role: string;
}

export interface Company {
  id: number;
  company_name: string;
  description: string;
  industry: string;
  size: 'startup' | 'small' | 'medium' | 'large';
  website: string;
  membership_start_date: string;
  loyalty_level: LoyaltyLevel;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  membership_duration_months?: number;
  computed_loyalty_level?: LoyaltyLevel;
  next_level?: LoyaltyLevel | null;
  months_until_next_level?: number | null;
  /** Optional URL for company logo image */
  logo_url?: string | null;
}

export type LoyaltyLevel = 'Explorer' | 'Participant' | 'Contributor' | 'Champion';

export interface Listing {
  id: number;
  company_id: number;
  title: string;
  description: string;
  category: 'resource' | 'event' | 'collaboration' | 'session';
  created_at: string;
  updated_at: string;
  company_name?: string;
  company_loyalty_level?: LoyaltyLevel;
  /** Optional URL for the listing company's logo */
  company_logo_url?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Filters {
  industries: string[];
  sizes: string[];
}
