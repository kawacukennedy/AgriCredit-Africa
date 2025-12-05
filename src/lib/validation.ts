export interface LoanApplication {
  amount: number;
  term: number;
  purpose: string;
  farmSize: number;
  location: string;
  crops: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export interface CarbonCreditListing {
  amount: number;
  price: number;
  type: string;
  location: string;
}

export interface GovernanceProposal {
  title: string;
  description: string;
  type: string;
}

export const validateLoanApplication = (data: Partial<LoanApplication>): string[] => {
  const errors: string[] = [];
  if (!data.amount || data.amount < 100 || data.amount > 10000) {
    errors.push('Amount must be between 100 and 10000');
  }
  if (!data.term || data.term < 1 || data.term > 24) {
    errors.push('Term must be between 1 and 24 months');
  }
  if (!data.purpose || data.purpose.length < 10 || data.purpose.length > 500) {
    errors.push('Purpose must be between 10 and 500 characters');
  }
  if (!data.farmSize || data.farmSize < 0.1 || data.farmSize > 100) {
    errors.push('Farm size must be between 0.1 and 100 hectares');
  }
  if (!data.location || data.location.length < 2 || data.location.length > 100) {
    errors.push('Location must be between 2 and 100 characters');
  }
  if (!data.crops || data.crops.length === 0) {
    errors.push('At least one crop must be selected');
  }
  return errors;
};

export const validateUserProfile = (data: Partial<UserProfile>): string[] => {
  const errors: string[] = [];
  if (!data.name || data.name.length < 2 || data.name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email is required');
  }
  if (!data.phone || !/^\+?[\d\s\-\(\)]+$/.test(data.phone)) {
    errors.push('Valid phone number is required');
  }
  if (!data.location || data.location.length < 2 || data.location.length > 100) {
    errors.push('Location must be between 2 and 100 characters');
  }
  return errors;
};