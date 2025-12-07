'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';

interface ConsentFormProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  initialData?: any;
}

export function ConsentForm({ onNext, onPrev, initialData }: ConsentFormProps) {
  const { t } = useTranslation();
  const [consents, setConsents] = useState({
    data_usage: initialData?.data_usage || false,
    satellite_data: initialData?.satellite_data || false,
    mobile_data: initialData?.mobile_data || false,
    credit_check: initialData?.credit_check || false,
    terms_agreement: initialData?.terms_agreement || false,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!consents.data_usage) {
      newErrors.data_usage = 'Data usage consent is required';
    }
    if (!consents.terms_agreement) {
      newErrors.terms_agreement = 'Terms and conditions agreement is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(consents);
    }
  };

  const handleConsentChange = (field: string, checked: boolean) => {
    setConsents(prev => ({ ...prev, [field]: checked }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Please review and consent to the following data usage and terms. Your consent is required to proceed with the loan application.
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="data_usage"
              checked={consents.data_usage}
              onCheckedChange={(checked) => handleConsentChange('data_usage', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="data_usage" className="font-medium">
                Data Usage Consent *
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                I consent to AgriCredit collecting and using my personal and farming data for loan assessment,
                including satellite imagery, mobile usage patterns, and farming history.
              </p>
              {errors.data_usage && <p className="text-error text-sm mt-1">{errors.data_usage}</p>}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="satellite_data"
              checked={consents.satellite_data}
              onCheckedChange={(checked) => handleConsentChange('satellite_data', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="satellite_data" className="font-medium">
                Satellite Data Usage
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                I consent to the use of satellite imagery and NDVI data from sources like Sentinel-2
                to assess my farm's health and productivity.
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="mobile_data"
              checked={consents.mobile_data}
              onCheckedChange={(checked) => handleConsentChange('mobile_data', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="mobile_data" className="font-medium">
                Mobile Data Usage
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                I consent to the analysis of my mobile money transaction patterns to assess
                financial behavior and repayment capacity.
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="credit_check"
              checked={consents.credit_check}
              onCheckedChange={(checked) => handleConsentChange('credit_check', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="credit_check" className="font-medium">
                Credit Check Authorization
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                I authorize AgriCredit to perform credit checks and verify my information
                with relevant financial institutions and cooperatives.
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms_agreement"
              checked={consents.terms_agreement}
              onCheckedChange={(checked) => handleConsentChange('terms_agreement', checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="terms_agreement" className="font-medium">
                Terms and Conditions Agreement *
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                I agree to the <a href="/terms" className="text-agri-green underline">Terms and Conditions</a>,
                <a href="/privacy" className="text-agri-green underline ml-1">Privacy Policy</a>, and
                <a href="/loan-agreement" className="text-agri-green underline ml-1">Loan Agreement</a>.
                I understand the risks involved in agricultural lending.
              </p>
              {errors.terms_agreement && <p className="text-error text-sm mt-1">{errors.terms_agreement}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Data Privacy Notice</h4>
        <p className="text-sm text-blue-800">
          Your data is encrypted and stored securely. We comply with GDPR and local data protection regulations.
          You can withdraw consent or request data deletion at any time through your account settings.
        </p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button type="submit">
          Next Step
        </Button>
      </div>
    </form>
  );
}