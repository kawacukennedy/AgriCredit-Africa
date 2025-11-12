'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { getCreditScore, getYieldPrediction, CreditScoringRequest, YieldPredictionRequest, applyForLoan } from '@/lib/api';
import { contractInteractions } from '@/lib/contractInteractions';
import { useWallet } from '@/hooks/useWallet';

const steps = [
  { title: 'Farm Data', description: 'Enter your farming details' },
  { title: 'Collateral', description: 'Provide loan collateral' },
  { title: 'AI Assessment', description: 'Get credit score and terms' },
  { title: 'Review & Apply', description: 'Submit loan application' }
];

export default function LoanApplication() {
  const { address, isConnected } = useWallet();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [aiResults, setAiResults] = useState<{
    creditScore?: number;
    riskLevel?: string;
    predictedYield?: number;
    confidence?: number;
    explanation?: string;
  }>({});
   const [formData, setFormData] = useState({
     cropType: '',
     farmSize: '',
     location: '',
     expectedYield: '',
     collateralToken: '0x0000000000000000000000000000000000000000', // Default to ETH
     collateralAmount: '',
     loanPurpose: ''
   });

   const nextStep = async () => {
     if (currentStep === 0) {
       // Validate farm data
       if (!formData.cropType || !formData.farmSize || !formData.location) {
         alert('Please fill in all required fields');
         return;
       }
     } else if (currentStep === 1) {
       // Validate collateral data
       if (!formData.collateralAmount || parseFloat(formData.collateralAmount) <= 0) {
         alert('Please provide valid collateral amount');
         return;
       }
     } else if (currentStep === 2) {
       // Get AI assessment
       setIsLoading(true);
       try {
         // Prepare farmer data for credit scoring
         const farmerData = {
           crop_type: formData.cropType,
           farm_size: parseFloat(formData.farmSize),
           location: formData.location,
           expected_yield: parseFloat(formData.expectedYield || '0'),
           collateral_amount: parseFloat(formData.collateralAmount),
           loan_purpose: formData.loanPurpose
         };

         const creditRequest: CreditScoringRequest = {
           crop_type: formData.cropType,
           farm_size: parseFloat(formData.farmSize),
           location: formData.location,
           historical_data: farmerData
         };

         const yieldRequest: YieldPredictionRequest = {
           crop_type: formData.cropType,
           farm_size: parseFloat(formData.farmSize),
           location: formData.location,
           weather_data: {},
           soil_quality: 0.7, // Default
           irrigation_access: true
         };

         const [creditResponse, yieldResponse] = await Promise.all([
           getCreditScore(creditRequest),
           getYieldPrediction(yieldRequest)
         ]);

         setAiResults({
           creditScore: creditResponse.data.score,
           riskLevel: creditResponse.data.risk_level,
           predictedYield: yieldResponse.data.predicted_yield,
           confidence: Math.max(creditResponse.data.confidence, yieldResponse.data.confidence),
           explanation: creditResponse.data.explanation?.join(', ') || 'AI assessment completed',
         });
       } catch (error) {
         console.error('AI assessment failed:', error);
         alert('Failed to get AI assessment. Please try again.');
         setIsLoading(false);
         return;
       }
       setIsLoading(false);
     } else if (currentStep === steps.length - 1) {
       // Submit loan application
       if (!isConnected || !address) {
         alert('Please connect your wallet to submit the loan application.');
         return;
       }

       setIsDeploying(true);
       try {
         // Calculate loan amount based on credit score and collateral
         const maxLoanAmount = (parseFloat(formData.collateralAmount) * 0.8); // 80% LTV
         const recommendedAmount = Math.min(maxLoanAmount, 5000); // Cap at $5000

         const loanApplication = {
           amount: recommendedAmount,
           collateral_token: formData.collateralToken,
           collateral_amount: parseFloat(formData.collateralAmount),
           farmer_data: {
             crop_type: formData.cropType,
             farm_size: parseFloat(formData.farmSize),
             location: formData.location,
             expected_yield: parseFloat(formData.expectedYield || '0'),
             historical_repayment_rate: 0.85, // Default
             mobile_money_usage: 50,
             satellite_ndvi: 0.7,
             weather_risk: 0.3,
             cooperative_membership: true,
             loan_history: 2,
             income_stability: 0.8,
             location_risk: 0.2,
             crop_diversity: 3,
             soil_quality: 0.8,
             irrigation_access: true,
             market_distance: 5,
             digital_literacy: 0.9
           },
           purpose: formData.loanPurpose
         };

         const result = await applyForLoan(loanApplication);

         if (result.success) {
           alert(`Loan application submitted successfully! Application ID: ${result.loan_id}`);
           window.location.href = '/dashboard';
         } else {
           alert(`Loan application failed: ${result.error}`);
         }
       } catch (error) {
         console.error('Loan application failed:', error);
         alert('Failed to submit loan application. Please try again.');
         setIsDeploying(false);
         return;
       }
       setIsDeploying(false);
       return;
     }

     setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
   };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Loan Application</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    index <= currentStep ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  {index + 1}
                </motion.div>
                <div className="ml-4">
                  <h3 className={`font-medium ${index <= currentStep ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 ${index < currentStep ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm"
        >
           {currentStep === 0 && (
             <div>
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Farm Information</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Crop Type
                   </label>
                   <select
                     value={formData.cropType}
                     onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                     className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                   >
                     <option value="">Select crop</option>
                     <option value="maize">Maize</option>
                     <option value="rice">Rice</option>
                     <option value="cassava">Cassava</option>
                     <option value="wheat">Wheat</option>
                     <option value="coffee">Coffee</option>
                     <option value="tea">Tea</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Farm Size (hectares)
                   </label>
                   <input
                     type="number"
                     value={formData.farmSize}
                     onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                     className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                     placeholder="Enter farm size"
                     min="0.1"
                     step="0.1"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Location
                   </label>
                   <input
                     type="text"
                     value={formData.location}
                     onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                     className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                     placeholder="Enter location (e.g., Nairobi, Kenya)"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Expected Yield (tons)
                   </label>
                   <input
                     type="number"
                     value={formData.expectedYield}
                     onChange={(e) => setFormData({ ...formData, expectedYield: e.target.value })}
                     className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                     placeholder="Enter expected yield"
                     min="0"
                     step="0.1"
                   />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Loan Purpose
                   </label>
                   <textarea
                     value={formData.loanPurpose}
                     onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value })}
                     className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                     placeholder="Describe how you will use the loan (e.g., purchasing seeds, fertilizers, equipment)"
                     rows={3}
                   />
                 </div>
               </div>
             </div>
           )}

           {currentStep === 1 && (
             <div>
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Collateral Information</h2>
               <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
                 <p className="text-blue-800 dark:text-blue-200 text-sm">
                   <strong>Collateral Requirement:</strong> You need to provide collateral worth at least 120% of the loan amount.
                   This ensures the loan is secured and helps you get better interest rates.
                 </p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Collateral Token
                   </label>
                   <select
                     value={formData.collateralToken}
                     onChange={(e) => setFormData({ ...formData, collateralToken: e.target.value })}
                     className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                   >
                     <option value="0x0000000000000000000000000000000000000000">ETH</option>
                     <option value="0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e44d8">cUSD (Celo Dollar)</option>
                     <option value="0x765DE816845861e75A25fCA122bb6898B8B1282a0">cEUR (Celo Euro)</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Collateral Amount
                   </label>
                   <input
                     type="number"
                     value={formData.collateralAmount}
                     onChange={(e) => setFormData({ ...formData, collateralAmount: e.target.value })}
                     className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                     placeholder="Enter collateral amount"
                     min="0"
                     step="0.01"
                   />
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                     Minimum: $3,000 (for $2,500 loan at 120% LTV)
                   </p>
                 </div>
               </div>
               <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                 <h3 className="font-medium text-gray-800 dark:text-white mb-2">Estimated Loan Terms</h3>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-gray-600 dark:text-gray-400">Max Loan Amount:</span>
                     <span className="font-medium ml-2">
                       ${formData.collateralAmount ? (parseFloat(formData.collateralAmount) * 0.8).toFixed(0) : '0'}
                     </span>
                   </div>
                   <div>
                     <span className="text-gray-600 dark:text-gray-400">LTV Ratio:</span>
                     <span className="font-medium ml-2">80%</span>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {currentStep === 2 && (
             <div>
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">AI Prediction</h2>
               {isLoading ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                   <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing your data with AI...</p>
                 </div>
               ) : (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
                       <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Predicted Yield</h3>
                       <div className="text-3xl font-bold text-green-600">
                         {aiResults.predictedYield ? `${aiResults.predictedYield.toFixed(1)} tons` : 'N/A'}
                       </div>
                       <p className="text-sm text-green-700 dark:text-green-300">
                         Confidence: {aiResults.confidence ? `${(aiResults.confidence * 100).toFixed(0)}%` : 'N/A'}
                       </p>
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg">
                       <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">Credit Score</h3>
                       <div className="text-3xl font-bold text-blue-600">
                         {aiResults.creditScore ? aiResults.creditScore.toFixed(0) : 'N/A'}
                       </div>
                       <p className="text-sm text-blue-700 dark:text-blue-300">
                         Risk Level: {aiResults.riskLevel || 'N/A'}
                       </p>
                     </div>
                   </div>
                   <div className="mt-6">
                     <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">AI Explainability Report</h3>
                     <p className="text-gray-600 dark:text-gray-400">
                       {aiResults.explanation || 'Your credit score is based on historical repayment data, farm size, crop type, and regional weather patterns. The AI predicts yield based on weather data, soil quality, and farming practices.'}
                     </p>
                   </div>
                 </>
               )}
             </div>
           )}

           {currentStep === 2 && (
             <div>
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">AI Credit Assessment</h2>
               {isLoading ? (
                 <div className="text-center py-8">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                   <p className="mt-4 text-gray-600 dark:text-gray-400">Analyzing your application with AI...</p>
                 </div>
               ) : (
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
                       <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Credit Score</h3>
                       <div className="text-3xl font-bold text-green-600">
                         {aiResults.creditScore ? aiResults.creditScore.toFixed(0) : 'N/A'}
                       </div>
                       <p className="text-sm text-green-700 dark:text-green-300">
                         Risk Level: {aiResults.riskLevel || 'N/A'}
                       </p>
                       <p className="text-sm text-green-700 dark:text-green-300">
                         Confidence: {aiResults.confidence ? `${(aiResults.confidence * 100).toFixed(0)}%` : 'N/A'}
                       </p>
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg">
                       <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-400 mb-2">Yield Prediction</h3>
                       <div className="text-3xl font-bold text-blue-600">
                         {aiResults.predictedYield ? `${aiResults.predictedYield.toFixed(1)} tons` : 'N/A'}
                       </div>
                       <p className="text-sm text-blue-700 dark:text-blue-300">
                         Based on your farm data
                       </p>
                     </div>
                   </div>

                   <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                     <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Loan Terms</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                         <span className="text-sm text-gray-600 dark:text-gray-400">Recommended Amount:</span>
                         <div className="text-xl font-bold text-gray-800 dark:text-white">
                           ${formData.collateralAmount ? Math.min((parseFloat(formData.collateralAmount) * 0.8), 5000).toFixed(0) : '0'}
                         </div>
                       </div>
                       <div>
                         <span className="text-sm text-gray-600 dark:text-gray-400">Interest Rate:</span>
                         <div className="text-xl font-bold text-gray-800 dark:text-white">
                           {aiResults.creditScore && aiResults.creditScore >= 750 ? '5%' :
                            aiResults.creditScore && aiResults.creditScore >= 650 ? '7%' : '10%'} APR
                         </div>
                       </div>
                       <div>
                         <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                         <div className="text-xl font-bold text-gray-800 dark:text-white">
                           {aiResults.creditScore && aiResults.creditScore >= 750 ? '24 months' :
                            aiResults.creditScore && aiResults.creditScore >= 650 ? '18 months' : '12 months'}
                         </div>
                       </div>
                     </div>
                   </div>

                   <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                     <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">AI Explainability</h3>
                     <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                       {aiResults.explanation || 'Your credit assessment is based on farm size, crop type, location, historical data, and collateral provided. Higher credit scores result in better loan terms.'}
                     </p>
                   </div>
                 </>
               )}
             </div>
           )}

           {currentStep === 3 && (
             <div>
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Review & Submit Application</h2>
               <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Loan Application Summary</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <h4 className="font-medium text-gray-800 dark:text-white mb-3">Farm Details</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600 dark:text-gray-400">Crop Type:</span>
                         <span className="font-medium">{formData.cropType}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600 dark:text-gray-400">Farm Size:</span>
                         <span className="font-medium">{formData.farmSize} hectares</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600 dark:text-gray-400">Location:</span>
                         <span className="font-medium">{formData.location}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600 dark:text-gray-400">Expected Yield:</span>
                         <span className="font-medium">{formData.expectedYield} tons</span>
                       </div>
                     </div>
                   </div>
                   <div>
                     <h4 className="font-medium text-gray-800 dark:text-white mb-3">Loan Terms</h4>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600 dark:text-gray-400">Loan Amount:</span>
                         <span className="font-medium">${formData.collateralAmount ? Math.min((parseFloat(formData.collateralAmount) * 0.8), 5000).toFixed(0) : '0'}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                         <span className="font-medium">
                           {aiResults.creditScore && aiResults.creditScore >= 750 ? '5%' :
                            aiResults.creditScore && aiResults.creditScore >= 650 ? '7%' : '10%'} APR
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                         <span className="font-medium">
                           {aiResults.creditScore && aiResults.creditScore >= 750 ? '24 months' :
                            aiResults.creditScore && aiResults.creditScore >= 650 ? '18 months' : '12 months'}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600 dark:text-gray-400">Collateral:</span>
                         <span className="font-medium">{formData.collateralAmount} tokens</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg mb-6">
                 <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">AI Assessment Results</h3>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-green-700 dark:text-green-300">Credit Score:</span>
                     <span className="font-medium ml-2">{aiResults.creditScore?.toFixed(0) || 'N/A'}</span>
                   </div>
                   <div>
                     <span className="text-green-700 dark:text-green-300">Risk Level:</span>
                     <span className="font-medium ml-2">{aiResults.riskLevel || 'N/A'}</span>
                   </div>
                 </div>
               </div>

               <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg mb-6">
                 <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                   <strong>Important:</strong> By submitting this application, you agree to provide the specified collateral.
                   The loan will be processed through our AI-powered lending protocol on the blockchain.
                   Funds will be disbursed automatically upon approval based on your credit assessment.
                 </p>
               </div>

               <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                 <p className="text-blue-800 dark:text-blue-200 text-sm">
                   <strong>Next Steps:</strong> After submission, your application will be reviewed by our AI system.
                   If approved, you'll receive a smart contract to sign and collateral will be locked.
                   Funds will be transferred instantly upon contract execution.
                 </p>
               </div>
             </div>
           )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
          >
            Previous
          </button>
            <button
              onClick={nextStep}
              disabled={isDeploying}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeploying ? 'Submitting Application...' : currentStep === steps.length - 1 ? 'Submit Application' : 'Next'}
            </button>
        </div>
      </main>
    </div>
  );
}