'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

interface FarmDetailsFormProps {
  onNext: (data: any) => void;
  initialData?: any;
}

export function FarmDetailsForm({ onNext, initialData }: FarmDetailsFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    farm_size: initialData?.farm_size || '',
    location: initialData?.location || '',
    crops: initialData?.crops || [],
    land_size: initialData?.land_size || '',
    soil_type: initialData?.soil_type || '',
    irrigation_access: initialData?.irrigation_access || false,
    farming_experience: initialData?.farming_experience || '',
    equipment_owned: initialData?.equipment_owned || '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.farm_size || parseFloat(formData.farm_size) <= 0) {
      newErrors.farm_size = 'Farm size is required and must be greater than 0';
    }
    if (!formData.location) {
      newErrors.location = 'Location is required';
    }
    if (!formData.crops || formData.crops.length === 0) {
      newErrors.crops = 'At least one crop type is required';
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

  const handleCropChange = (crop: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      crops: checked
        ? [...prev.crops, crop]
        : prev.crops.filter((c: string) => c !== crop)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="farm_size">Farm Size (hectares) *</Label>
          <Input
            id="farm_size"
            type="number"
            step="0.1"
            value={formData.farm_size}
            onChange={(e) => setFormData(prev => ({ ...prev, farm_size: e.target.value }))}
            className={errors.farm_size ? 'border-error' : ''}
          />
          {errors.farm_size && <p className="text-error text-sm mt-1">{errors.farm_size}</p>}
        </div>

        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="City, Region, Country"
            className={errors.location ? 'border-error' : ''}
          />
          {errors.location && <p className="text-error text-sm mt-1">{errors.location}</p>}
        </div>
      </div>

      <div>
        <Label>Crop Types *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          {['Maize', 'Rice', 'Cassava', 'Soybean', 'Wheat', 'Potato', 'Tomato', 'Other'].map((crop) => (
            <label key={crop} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.crops.includes(crop)}
                onChange={(e) => handleCropChange(crop, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{crop}</span>
            </label>
          ))}
        </div>
        {errors.crops && <p className="text-error text-sm mt-1">{errors.crops}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="soil_type">Soil Type</Label>
          <Select value={formData.soil_type} onValueChange={(value) => setFormData(prev => ({ ...prev, soil_type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select soil type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clay">Clay</SelectItem>
              <SelectItem value="sandy">Sandy</SelectItem>
              <SelectItem value="loamy">Loamy</SelectItem>
              <SelectItem value="silt">Silt</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="farming_experience">Farming Experience (years)</Label>
          <Input
            id="farming_experience"
            type="number"
            min="0"
            value={formData.farming_experience}
            onChange={(e) => setFormData(prev => ({ ...prev, farming_experience: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="irrigation_access">Irrigation Access</Label>
          <Select value={formData.irrigation_access ? 'yes' : 'no'} onValueChange={(value) => setFormData(prev => ({ ...prev, irrigation_access: value === 'yes' }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="equipment_owned">Equipment Owned</Label>
          <Textarea
            id="equipment_owned"
            value={formData.equipment_owned}
            onChange={(e) => setFormData(prev => ({ ...prev, equipment_owned: e.target.value }))}
            placeholder="List farming equipment you own..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">
          Next Step
        </Button>
      </div>
    </form>
  );
}