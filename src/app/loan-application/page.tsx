'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { getCreditScore, getYieldPrediction, CreditScoringRequest, YieldPredictionRequest } from '@/lib/api';
import { contractInteractions } from '@/lib/contractInteractions';
import { useWallet } from '@/hooks/useWallet';

const steps = [
  { title: 'Crop Data', description: 'Enter your farming details' },
  { title: 'AI Prediction', description: 'Get yield and credit score' },
  { title: 'Loan Terms', description: 'Select repayment options' },
  { title: 'Review & Deploy', description: 'Confirm smart contract' }
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
    expectedYield: ''
  });

  const nextStep = async () => {
    if (currentStep === 0) {
      // Validate form data before proceeding
      if (!formData.cropType || !formData.farmSize || !formData.location) {
        alert('Please fill in all required fields');
        return;
      }

      // Call AI APIs when moving to step 1
      setIsLoading(true);
      try {
        const creditRequest: CreditScoringRequest = {
          crop_type: formData.cropType,
          farm_size: parseFloat(formData.farmSize),
          location: formData.location,
        };

        const yieldRequest: YieldPredictionRequest = {
          crop_type: formData.cropType,
          farm_size: parseFloat(formData.farmSize),
          location: formData.location,
        };

        const [creditResponse, yieldResponse] = await Promise.all([
          getCreditScore(creditRequest),
          getYieldPrediction(yieldRequest)
        ]);

        setAiResults({
          creditScore: creditResponse.data.credit_score,
          riskLevel: creditResponse.data.risk_level,
          predictedYield: yieldResponse.data.predicted_yield,
          confidence: Math.max(creditResponse.data.confidence, yieldResponse.data.confidence),
          explanation: creditResponse.data.explanation,
        });
      } catch (error) {
        console.error('AI prediction failed:', error);
        alert('Failed to get AI predictions. Please try again.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    } else if (currentStep === steps.length - 1) {
      // Deploy contract on final step
      if (!isConnected || !address) {
        alert('Please connect your wallet to deploy the loan contract.');
        return;
      }

      setIsDeploying(true);
      try {
        // Deploy loan contract
        const loanAmount = "2500"; // $2500 loan
        const interestRate = 850; // 8.5% APR in basis points
        const duration = 365 * 24 * 60 * 60; // 1 year in seconds

        const result = await contractInteractions.createLoan(address, loanAmount, interestRate, duration);

        alert(`Loan contract deployed successfully! Transaction hash: ${result.transactionHash}`);
        // Redirect to dashboard or loan management page
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Contract deployment failed:', error);
        alert('Failed to deploy loan contract. Please try again.');
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Crop Information</h2>
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
                    placeholder="Enter location"
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
                  />
                </div>
              </div>
            </div>
          )}

           {currentStep === 1 && (
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
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Loan Terms</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    defaultValue="2500"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Repayment Period (months)
                  </label>
                  <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="18">18 months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Interest Rate
                  </label>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">8.5% APR</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Based on your credit score</p>
                </div>
              </div>
            </div>
          )}

           {currentStep === 3 && (
             <div>
               <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Review & Deploy</h2>
               <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                 <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Smart Contract Summary</h3>
                 <div className="space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-gray-600 dark:text-gray-400">Loan Amount:</span>
                     <span className="font-medium">$2,500</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                     <span className="font-medium">8.5% APR</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600 dark:text-gray-400">Repayment Period:</span>
                     <span className="font-medium">12 months</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                     <span className="font-medium">$225</span>
                   </div>
                 </div>
               </div>
               <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg mb-6">
                 <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                   By confirming, you agree to deploy this loan contract on the blockchain. Funds will be disbursed instantly upon approval.
                 </p>
               </div>
               <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                 <p className="text-blue-800 dark:text-blue-200 text-sm">
                   <strong>AI Credit Assessment:</strong> Based on your farm data and credit score, this loan has been pre-approved.
                   The smart contract will automatically disburse funds upon confirmation.
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
             {isDeploying ? 'Deploying Contract...' : currentStep === steps.length - 1 ? 'Deploy Contract' : 'Next'}
           </button>
        </div>
      </main>
    </div>
  );
}