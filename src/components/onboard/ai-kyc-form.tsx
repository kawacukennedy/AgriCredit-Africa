'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { useSubmitKYCMutation } from '@/lib/api';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AIKYCFormProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  initialData?: any;
}

export function AIKYCForm({ onNext, onPrev, initialData }: AIKYCFormProps) {
  const { t } = useTranslation();
  const [submitKYC, { isLoading: isVerifying }] = useSubmitKYCMutation();
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');

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

  const handleFileUpload = (field: 'idDocument' | 'selfie', file: File) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleVerify = async () => {
    setVerificationStatus('verifying');

    // Simulate progress updates while API call is processing
    const progressInterval = setInterval(() => {
      setVerificationProgress(prev => Math.min(prev + 20, 90));
    }, 500);

    try {
      const result = await submitKYC({
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        nationality: formData.nationality,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        // Note: File uploads would need proper handling in production
        idDocumentUploaded: !!formData.idDocument,
        selfieUploaded: !!formData.selfie
      }).unwrap();

      clearInterval(progressInterval);
      setVerificationProgress(100);

      const isVerified = result.verification_result.passed;
      setVerificationStatus(isVerified ? 'success' : 'failed');

      if (isVerified) {
        setTimeout(() => {
          onNext({
            ...formData,
            kycVerified: true,
            kycScore: result.verification_result.confidence_score,
            verifiedAt: new Date().toISOString(),
            verificationResult: result.verification_result,
            credentialIssued: result.credential_issued
          });
        }, 2000);
      }

    } catch (error) {
      clearInterval(progressInterval);
      console.error('KYC verification failed:', error);
      setVerificationStatus('failed');
    }
  };

  const isFormValid = formData.fullName && formData.dateOfBirth && formData.nationality &&
                     formData.address && formData.phoneNumber && formData.idDocument && formData.selfie;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="mx-auto h-12 w-12 text-agri-green mb-4" />
        <h3 className="text-lg font-semibold mb-2">AI-Powered KYC Verification</h3>
        <p className="text-muted-foreground">
          Our advanced AI system will verify your identity using document analysis,
          facial recognition, and biometric verification.
        </p>
      </div>

      {verificationStatus === 'idle' && (
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full legal name"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
                    placeholder="Your nationality"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Your complete address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Government ID Document *</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('idDocument', e.target.files[0])}
                    className="hidden"
                    id="idDocument"
                  />
                  <label htmlFor="idDocument">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-agri-green transition-colors">
                      {formData.idDocument ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mr-2" />
                          <span className="text-green-600 font-medium">{formData.idDocument.name}</span>
                        </div>
                      ) : (
                        <div>
                          <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-gray-600">Upload ID document (passport, driver's license, etc.)</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <Label>Selfie Photo *</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
                    className="hidden"
                    id="selfie"
                  />
                  <label htmlFor="selfie">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-agri-green transition-colors">
                      {formData.selfie ? (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-600 mr-2" />
                          <span className="text-green-600 font-medium">{formData.selfie.name}</span>
                        </div>
                      ) : (
                        <div>
                          <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-gray-600">Take or upload a selfie for facial verification</p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" onClick={onPrev} className="flex-1">
              Previous
            </Button>
            <Button
              onClick={handleVerify}
              disabled={!isFormValid || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Start AI Verification'
              )}
            </Button>
          </div>
        </div>
      )}

      {verificationStatus === 'verifying' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">AI Verification in Progress</h3>
                <p className="text-blue-700">Analyzing your documents and biometric data...</p>
              </div>
              <Progress value={verificationProgress} className="w-full" />
              <p className="text-sm text-blue-600">{Math.round(verificationProgress)}% complete</p>
            </div>
          </CardContent>
        </Card>
      )}

      {verificationStatus === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">KYC Verification Successful</h3>
              <p className="text-green-700">
                Your identity has been verified successfully. You can now proceed to complete your profile.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {verificationStatus === 'failed' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="text-lg font-semibold text-red-800">Verification Failed</h3>
              <p className="text-red-700">
                We could not verify your identity. Please check your documents and try again.
              </p>
              <Button
                variant="outline"
                onClick={() => setVerificationStatus('idle')}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}