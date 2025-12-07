'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

interface DocumentsFormProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  initialData?: any;
}

export function DocumentsForm({ onNext, onPrev, initialData }: DocumentsFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    id_document: initialData?.id_document || null,
    farm_ownership: initialData?.farm_ownership || null,
    offtake_agreement: initialData?.offtake_agreement || null,
    bank_statements: initialData?.bank_statements || null,
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_document) {
      newErrors.id_document = 'Government ID is required';
    }
    if (!formData.farm_ownership) {
      newErrors.farm_ownership = 'Farm ownership document is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const FileUpload = ({ label, field, required = false }: { label: string; field: string; required?: boolean }) => (
    <div>
      <Label htmlFor={field}>
        {label} {required && '*'}
      </Label>
      <Input
        id={field}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
        className={errors[field] ? 'border-error' : ''}
      />
      {formData[field as keyof typeof formData] && (
        <p className="text-sm text-muted-foreground mt-1">
          Selected: {(formData[field as keyof typeof formData] as File)?.name}
        </p>
      )}
      {errors[field] && <p className="text-error text-sm mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm text-muted-foreground mb-4">
        Please upload the following documents. Supported formats: PDF, JPG, PNG. Maximum file size: 5MB each.
      </div>

      <FileUpload
        label="Government ID (Passport, National ID, or Driver's License)"
        field="id_document"
        required
      />

      <FileUpload
        label="Farm Ownership Document (Title Deed, Lease Agreement, or Certificate)"
        field="farm_ownership"
        required
      />

      <FileUpload
        label="Offtake Agreement (if applicable)"
        field="offtake_agreement"
      />

      <FileUpload
        label="Bank Statements (last 6 months, if available)"
        field="bank_statements"
      />

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Document Verification</h4>
        <p className="text-sm text-muted-foreground">
          All documents will be encrypted and stored securely. We use AI-powered verification to process your documents quickly and securely.
          Your privacy is protected - documents are only used for loan assessment and compliance purposes.
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