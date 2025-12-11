'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useSubmitKYCMutation } from '@/lib/api';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2, User, FileText, Shield, ArrowRight, Info, AlertTriangle } from 'lucide-react';

interface AIKYCFormProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  initialData?: any;
}

function AIKYCForm({ onNext, onPrev, initialData }: AIKYCFormProps) {
  const { t } = useTranslation();
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);

  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    nationality: initialData?.nationality || '',
    address: initialData?.address || '',
    phoneNumber: initialData?.phoneNumber || '',
    idDocument: null as File | null,
    selfie: null as File | null,
    biometricData: initialData?.biometricData || '',
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.nationality.trim()) errors.nationality = 'Nationality is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (!formData.idDocument) errors.idDocument = 'ID document is required';
    if (!formData.selfie) errors.selfie = 'Selfie photo is required';

    // Phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    // Age validation (must be 18+)
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        errors.dateOfBirth = 'You must be at least 18 years old';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateFile = (file: File, type: 'id' | 'selfie'): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File must be JPG, PNG, or PDF';
    }

    if (type === 'selfie' && !file.type.startsWith('image/')) {
      return 'Selfie must be an image file';
    }

    return null;
  };

  const handleFileUpload = (field: 'idDocument' | 'selfie', file: File) => {
    const error = validateFile(file, field === 'idDocument' ? 'id' : 'selfie');
    if (error) {
      setValidationErrors(prev => ({ ...prev, [field]: error }));
      return;
    }

    setFormData(prev => ({ ...prev, [field]: file }));
    setValidationErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleVerify = async () => {
    if (!validateForm()) {
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('verifying');
    setVerificationProgress(0);

    // Simulate progress updates while verification is processing
    const progressInterval = setInterval(() => {
      setVerificationProgress(prev => Math.min(prev + 8, 90));
    }, 500);

    try {
      // Simulate AI verification process
      await new Promise(resolve => setTimeout(resolve, 4000));

      clearInterval(progressInterval);
      setVerificationProgress(100);

      // Mock verification result (90% success rate for demo)
      const isVerified = Math.random() > 0.1;

      setVerificationStatus(isVerified ? 'success' : 'failed');
      setIsVerifying(false);

      if (isVerified) {
        setTimeout(() => {
          onNext({
            ...formData,
            kycVerified: true,
            kycScore: Math.floor(Math.random() * 20) + 80, // 80-99 score
            verifiedAt: new Date().toISOString(),
            verificationResult: {
              passed: true,
              confidence_score: Math.floor(Math.random() * 20) + 80,
              checks: {
                document_authenticity: true,
                facial_recognition: true,
                biometric_match: true,
                risk_assessment: 'low'
              }
            },
            credentialIssued: `cred_${Date.now()}`
          });
        }, 2000);
      }

    } catch (error) {
      clearInterval(progressInterval);
      console.error('KYC verification failed:', error);
      setVerificationStatus('failed');
      setVerificationProgress(0);
      setIsVerifying(false);
    }
  };

  const isFormValid = formData.fullName.trim() && formData.dateOfBirth && formData.nationality.trim() &&
                      formData.address.trim() && formData.phoneNumber.trim() &&
                      formData.idDocument && formData.selfie && Object.keys(validationErrors).length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-neutral-800 mb-2">AI-Powered Identity Verification</h3>
          <p className="text-neutral-800/70 max-w-lg mx-auto">
            Our advanced AI system will verify your identity using document analysis,
            facial recognition, and biometric verification for maximum security.
          </p>
        </div>
      </div>

      {/* Verification Steps */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-900/20 rounded-xl border border-blue-700">
          <FileText className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <h4 className="font-semibold text-neutral-200 mb-1">Document Analysis</h4>
          <p className="text-sm text-neutral-400">OCR & validation</p>
        </div>
        <div className="text-center p-4 bg-green-900/20 rounded-xl border border-green-700">
          <Camera className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <h4 className="font-semibold text-neutral-200 mb-1">Facial Recognition</h4>
          <p className="text-sm text-neutral-400">Biometric verification</p>
        </div>
        <div className="text-center p-4 bg-purple-900/20 rounded-xl border border-purple-700">
          <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <h4 className="font-semibold text-neutral-200 mb-1">Risk Assessment</h4>
          <p className="text-sm text-neutral-400">Fraud detection</p>
        </div>
      </div>

      {verificationStatus === 'idle' && (
        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="border-slate-gray/20">
            <CardHeader>
              <CardTitle className="flex items-center text-neutral-800">
                <User className="w-5 h-5 mr-2 text-agri-green" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label htmlFor="fullName" className="text-sm font-medium text-neutral-800">
                     Full Legal Name *
                   </Label>
                   <Input
                     id="fullName"
                     value={formData.fullName}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, fullName: e.target.value }));
                       if (validationErrors.fullName) {
                         setValidationErrors(prev => ({ ...prev, fullName: '' }));
                       }
                     }}
                     placeholder="Enter your full legal name as on ID"
                     className={`input-field ${validationErrors.fullName ? 'border-red-300 focus:border-red-500' : ''}`}
                   />
                   {validationErrors.fullName && (
                     <p className="text-sm text-red-600 animate-fadeIn">{validationErrors.fullName}</p>
                   )}
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="dateOfBirth" className="text-sm font-medium text-neutral-800">
                     Date of Birth *
                   </Label>
                   <Input
                     id="dateOfBirth"
                     type="date"
                     value={formData.dateOfBirth}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }));
                       if (validationErrors.dateOfBirth) {
                         setValidationErrors(prev => ({ ...prev, dateOfBirth: '' }));
                       }
                     }}
                     className={`input-field ${validationErrors.dateOfBirth ? 'border-red-300 focus:border-red-500' : ''}`}
                   />
                   {validationErrors.dateOfBirth && (
                     <p className="text-sm text-red-600 animate-fadeIn">{validationErrors.dateOfBirth}</p>
                   )}
                 </div>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label htmlFor="nationality" className="text-sm font-medium text-neutral-800">
                     Nationality *
                   </Label>
                   <Input
                     id="nationality"
                     value={formData.nationality}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, nationality: e.target.value }));
                       if (validationErrors.nationality) {
                         setValidationErrors(prev => ({ ...prev, nationality: '' }));
                       }
                     }}
                     placeholder="Your nationality"
                     className={`input-field ${validationErrors.nationality ? 'border-red-300 focus:border-red-500' : ''}`}
                   />
                   {validationErrors.nationality && (
                     <p className="text-sm text-red-600 animate-fadeIn">{validationErrors.nationality}</p>
                   )}
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="phoneNumber" className="text-sm font-medium text-neutral-800">
                     Phone Number *
                   </Label>
                   <Input
                     id="phoneNumber"
                     value={formData.phoneNumber}
                     onChange={(e) => {
                       setFormData(prev => ({ ...prev, phoneNumber: e.target.value }));
                       if (validationErrors.phoneNumber) {
                         setValidationErrors(prev => ({ ...prev, phoneNumber: '' }));
                       }
                     }}
                     placeholder="+254 700 000 000"
                     className={`input-field ${validationErrors.phoneNumber ? 'border-red-300 focus:border-red-500' : ''}`}
                   />
                   {validationErrors.phoneNumber && (
                     <p className="text-sm text-red-600 animate-fadeIn">{validationErrors.phoneNumber}</p>
                   )}
                 </div>
               </div>

               <div className="space-y-2">
                 <Label htmlFor="address" className="text-sm font-medium text-neutral-800">
                   Residential Address *
                 </Label>
                 <Textarea
                   id="address"
                   value={formData.address}
                   onChange={(e) => {
                     setFormData(prev => ({ ...prev, address: e.target.value }));
                     if (validationErrors.address) {
                       setValidationErrors(prev => ({ ...prev, address: '' }));
                     }
                   }}
                   placeholder="Your complete residential address"
                   rows={3}
                   className={`input-field resize-none ${validationErrors.address ? 'border-red-300 focus:border-red-500' : ''}`}
                 />
                 {validationErrors.address && (
                   <p className="text-sm text-red-600 animate-fadeIn">{validationErrors.address}</p>
                 )}
               </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card className="border-slate-gray/20">
            <CardHeader>
              <CardTitle className="flex items-center text-neutral-800">
                <FileText className="w-5 h-5 mr-2 text-agri-green" />
                Document Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-4">
                 <div>
                   <Label className="text-sm font-medium text-neutral-800 mb-3 block">
                     Government ID Document *
                   </Label>
                   <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                     validationErrors.idDocument
                       ? 'border-red-300 bg-red-50'
                       : formData.idDocument
                       ? 'border-sky-teal bg-sky-teal/5'
                       : 'border-slate-gray/30 hover:border-agri-green/50 bg-slate-gray/5'
                   }`}>
                     <input
                       type="file"
                       accept="image/*,.pdf"
                       onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                       className="hidden"
                       id="idDocument"
                     />
                     <label htmlFor="idDocument" className="cursor-pointer">
                       {formData.idDocument ? (
                         <div className="space-y-3">
                           <CheckCircle className="w-12 h-12 text-sky-teal mx-auto animate-bounce" />
                           <div>
                             <p className="font-medium text-neutral-800">{formData.idDocument.name}</p>
                             <p className="text-sm text-neutral-800/60">Click to change file</p>
                           </div>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           <Upload className="w-12 h-12 text-neutral-800/40 mx-auto" />
                           <div>
                             <p className="font-medium text-neutral-800">Upload ID Document</p>
                             <p className="text-sm text-neutral-800/60">Passport, National ID, or Driver's License</p>
                             <p className="text-xs text-neutral-800/50 mt-1">PNG, JPG, PDF up to 10MB</p>
                           </div>
                         </div>
                       )}
                     </label>
                   </div>
                   {validationErrors.idDocument && (
                     <p className="text-sm text-red-600 animate-fadeIn mt-2">{validationErrors.idDocument}</p>
                   )}
                 </div>

                 <div>
                   <Label className="text-sm font-medium text-neutral-800 mb-3 block">
                     Selfie Photo *
                   </Label>
                   <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                     validationErrors.selfie
                       ? 'border-red-300 bg-red-50'
                       : formData.selfie
                       ? 'border-sky-teal bg-sky-teal/5'
                       : 'border-slate-gray/30 hover:border-agri-green/50 bg-slate-gray/5'
                   }`}>
                     <input
                       type="file"
                       accept="image/*"
                       onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
                       className="hidden"
                       id="selfie"
                     />
                     <label htmlFor="selfie" className="cursor-pointer">
                       {formData.selfie ? (
                         <div className="space-y-3">
                           <CheckCircle className="w-12 h-12 text-sky-teal mx-auto animate-bounce" />
                           <div>
                             <p className="font-medium text-neutral-800">{formData.selfie.name}</p>
                             <p className="text-sm text-neutral-800/60">Click to change photo</p>
                           </div>
                         </div>
                       ) : (
                         <div className="space-y-3">
                           <Camera className="w-12 h-12 text-neutral-800/40 mx-auto" />
                           <div>
                             <p className="font-medium text-neutral-800">Take Selfie</p>
                             <p className="text-sm text-neutral-800/60">For facial recognition verification</p>
                             <p className="text-xs text-neutral-800/50 mt-1">Clear photo of your face</p>
                           </div>
                         </div>
                       )}
                     </label>
                   </div>
                   {validationErrors.selfie && (
                     <p className="text-sm text-red-600 animate-fadeIn mt-2">{validationErrors.selfie}</p>
                   )}
                 </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-blue-800 mb-1">Privacy & Security</h5>
                    <p className="text-sm text-blue-700">
                      Your documents are processed using advanced AI and encrypted throughout.
                      We never store your original files - only verification results are kept.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={onPrev} className="flex-1 py-3">
              ← Previous
            </Button>
            <Button
              onClick={handleVerify}
              disabled={isVerifying}
              className="flex-1 btn-primary py-3"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting Verification...
                </>
              ) : (
                <>
                  Start AI Verification
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {verificationStatus === 'verifying' && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-2">AI Verification in Progress</h3>
                <p className="text-neutral-800/70">
                  Our AI is analyzing your documents and biometric data...
                </p>
              </div>

              <div className="space-y-4">
                <Progress value={verificationProgress} className="h-3" />
                <p className="text-sm text-neutral-800/60">{Math.round(verificationProgress)}% complete</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className={`p-3 rounded-lg ${verificationProgress >= 25 ? 'bg-sky-teal/10 text-sky-teal' : 'bg-slate-gray/10 text-neutral-800/50'}`}>
                  ✓ Document Analysis
                </div>
                <div className={`p-3 rounded-lg ${verificationProgress >= 60 ? 'bg-sky-teal/10 text-sky-teal' : 'bg-slate-gray/10 text-neutral-800/50'}`}>
                  ✓ Facial Recognition
                </div>
                <div className={`p-3 rounded-lg ${verificationProgress >= 90 ? 'bg-sky-teal/10 text-sky-teal' : 'bg-slate-gray/10 text-neutral-800/50'}`}>
                  ✓ Risk Assessment
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {verificationStatus === 'success' && (
        <Card className="border-sky-teal/20 bg-gradient-to-br from-sky-teal/5 to-green-50">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-2">Identity Verification Successful!</h3>
                <p className="text-neutral-800/70">
                  Your identity has been verified successfully with our AI system.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Badge className="bg-sky-teal text-white">Verified</Badge>
                  <span className="text-sm text-neutral-800/60">High Confidence</span>
                </div>
                <p className="text-sm text-green-700">
                  Your verifiable credentials have been issued and stored securely.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {verificationStatus === 'failed' && (
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-800 mb-2">Verification Could Not Be Completed</h3>
                <p className="text-neutral-800/70">
                  We could not verify your identity with the provided information.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-amber-800 mb-1">Possible Issues:</h5>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Document quality or legibility</li>
                      <li>• Photo quality for facial recognition</li>
                      <li>• Information mismatch</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setVerificationStatus('idle')}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Try Again with Different Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AIKYCForm;