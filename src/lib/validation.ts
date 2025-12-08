import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+?234|0)[789]\d{9}$/, 'Invalid Nigerian phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
  role: z.enum(['farmer', 'lender', 'admin', 'coop']),
  agreeToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const walletConnectSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature is required'),
});

// Loan application validation schemas
export const farmDetailsSchema = z.object({
  farmName: z.string().min(2, 'Farm name is required'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().min(5, 'Address is required'),
  }),
  size: z.number().min(0.1, 'Farm size must be at least 0.1 hectares'),
  crops: z.array(z.string()).min(1, 'At least one crop is required'),
  farmingExperience: z.number().min(0, 'Experience cannot be negative'),
  irrigationType: z.enum(['rainfed', 'drip', 'sprinkler', 'flood']),
  soilType: z.enum(['sandy', 'clay', 'loam', 'silt']),
});

export const loanApplicationSchema = z.object({
  amount: z.number().min(1000, 'Minimum loan amount is ₦1,000').max(10000000, 'Maximum loan amount is ₦10,000,000'),
  term: z.number().min(3, 'Minimum term is 3 months').max(24, 'Maximum term is 24 months'),
  purpose: z.string().min(10, 'Purpose must be at least 10 characters'),
  repaymentPlan: z.enum(['monthly', 'quarterly', 'bullet']),
  collateral: z.object({
    type: z.enum(['land', 'equipment', 'inventory', 'guarantee']),
    value: z.number().min(0),
    description: z.string().min(10, 'Collateral description is required'),
  }),
  references: z.array(z.object({
    name: z.string().min(2),
    phone: z.string().regex(/^(\+?234|0)[789]\d{9}$/, 'Invalid phone number'),
    relationship: z.string().min(2),
  })).min(2, 'At least 2 references required').max(3),
});

export const creditScoreSchema = z.object({
  consent: z.boolean().refine(val => val === true, 'Consent is required for credit scoring'),
  dataSources: z.array(z.string()).min(1, 'At least one data source must be selected'),
});

// Carbon credit validation schemas
export const carbonCreditListingSchema = z.object({
  amount: z.number().min(1, 'Minimum 1 credit'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  type: z.enum(['agriculture', 'forestry', 'renewable_energy', 'industrial']),
  location: z.string().min(2, 'Location is required'),
  vintage: z.number().min(2020).max(new Date().getFullYear() + 1),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  documents: z.array(z.string()).min(1, 'At least one document is required'),
});

export const carbonCreditPurchaseSchema = z.object({
  listingId: z.string().uuid(),
  amount: z.number().min(1),
  paymentMethod: z.enum(['wallet', 'bank_transfer', 'mobile_money']),
});

// Governance validation schemas
export const proposalSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  type: z.enum(['parameter_change', 'funding_request', 'policy_update', 'contract_upgrade']),
  category: z.enum(['loans', 'carbon', 'governance', 'technical']),
  votingPeriod: z.number().min(1).max(30, 'Voting period must be between 1-30 days'),
  executionDelay: z.number().min(0).max(7, 'Execution delay must be between 0-7 days'),
  parameters: z.object({}).catchall(z.any()).optional(),
});

export const voteSchema = z.object({
  proposalId: z.string().uuid(),
  vote: z.enum(['yes', 'no', 'abstain']),
  votingPower: z.number().min(0),
});

// NFT validation schemas
export const nftMintingSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
  farmingReward: z.number().min(0).max(100),
  attributes: z.object({}).catchall(z.any()),
  image: z.string().url('Valid image URL is required'),
});

export const nftTransferSchema = z.object({
  tokenId: z.string(),
  toAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  amount: z.number().min(1),
});

// Marketplace validation schemas
export const loanListingSchema = z.object({
  loanId: z.string().uuid(),
  interestRate: z.number().min(0).max(50, 'Interest rate must be between 0-50%'),
  minInvestment: z.number().min(100),
  maxInvestment: z.number().min(100),
  term: z.number().min(1).max(24),
  riskRating: z.enum(['low', 'medium', 'high', 'very_high']),
  description: z.string().min(20).max(1000),
}).refine(data => data.minInvestment <= data.maxInvestment, {
  message: "Minimum investment cannot be greater than maximum investment",
  path: ["minInvestment"],
});

export const investmentSchema = z.object({
  listingId: z.string().uuid(),
  amount: z.number().min(100, 'Minimum investment is ₦100'),
  autoRepay: z.boolean(),
  dividendPreference: z.enum(['reinvest', 'withdraw']),
});

// General validation helpers
export const emailSchema = z.string().email('Invalid email address');
export const phoneSchema = z.string().regex(/^(\+?234|0)[789]\d{9}$/, 'Invalid Nigerian phone number');
export const walletAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address');
export const urlSchema = z.string().url('Invalid URL');
export const uuidSchema = z.string().uuid('Invalid ID');

// Form validation error types
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type FarmDetailsForm = z.infer<typeof farmDetailsSchema>;
export type LoanApplicationForm = z.infer<typeof loanApplicationSchema>;
export type CarbonCreditListingForm = z.infer<typeof carbonCreditListingSchema>;
export type ProposalForm = z.infer<typeof proposalSchema>;
export type NFTMintingForm = z.infer<typeof nftMintingSchema>;
export type LoanListingForm = z.infer<typeof loanListingSchema>;

// Validation helper function
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
}

// Legacy validation functions for backward compatibility
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

export const validateLoanApplication = (data: Partial<LoanApplication>): string[] => {
  const result = validateForm(loanApplicationSchema, data);
  return result.success ? [] : Object.values(result.errors || {});
};

export const validateUserProfile = (data: Partial<UserProfile>): string[] => {
  const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^(\+?234|0)[789]\d{9}$/, 'Invalid Nigerian phone number'),
    location: z.string().min(2, 'Location must be between 2 and 100 characters'),
  });
  const result = validateForm(profileSchema, data);
  return result.success ? [] : Object.values(result.errors || {});
};