'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useCompleteProfileMutation } from '@/lib/api';
import { MapPin, Tractor, Users } from 'lucide-react';

interface ProfileSetupFormProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  initialData?: any;
}

export function ProfileSetupForm({ onNext, onPrev, initialData }: ProfileSetupFormProps) {
  const { t } = useTranslation();
  const [completeProfile, { isLoading: isSubmitting }] = useCompleteProfileMutation();
  const [formData, setFormData] = useState({
    farmName: initialData?.farmName || '',
    farmSize: initialData?.farmSize || '',
    farmLocation: initialData?.farmLocation || '',
    primaryCrop: initialData?.primaryCrop || '',
    farmingExperience: initialData?.farmingExperience || '',
    equipmentOwned: initialData?.equipmentOwned || '',
    householdSize: initialData?.householdSize || '',
    incomeSource: initialData?.incomeSource || '',
    challenges: initialData?.challenges || '',
  });

  const handleSubmit = async () => {
    try {
      const result = await completeProfile({
        farm_name: formData.farmName,
        farm_size: parseFloat(formData.farmSize),
        farm_location: formData.farmLocation,
        primary_crop: formData.primaryCrop,
        farming_experience: formData.farmingExperience,
        equipment_owned: formData.equipmentOwned,
        household_size: formData.householdSize ? parseInt(formData.householdSize) : null,
        income_source: formData.incomeSource,
        challenges: formData.challenges
      }).unwrap();

      onNext({
        ...formData,
        profileCompleted: true,
        completedAt: new Date().toISOString(),
        credential: result.credential
      });
    } catch (error) {
      console.error('Failed to complete profile:', error);
      alert('Failed to complete profile. Please try again.');
    }
  };

  const isFormValid = formData.farmName && formData.farmSize && formData.farmLocation &&
                     formData.primaryCrop && formData.farmingExperience;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Tractor className="mx-auto h-12 w-12 text-agri-green mb-4" />
        <h3 className="text-lg font-semibold mb-2">Complete Your Farmer Profile</h3>
        <p className="text-muted-foreground">
          Tell us about your farming operation to personalize your experience
          and improve our AI recommendations.
        </p>
      </div>

      <div className="space-y-6">
        {/* Farm Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Tractor className="mr-2 h-5 w-5" />
              Farm Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farmName">Farm Name *</Label>
                <Input
                  id="farmName"
                  value={formData.farmName}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmName: e.target.value }))}
                  placeholder="Enter your farm's name"
                />
              </div>
              <div>
                <Label htmlFor="farmSize">Farm Size (hectares) *</Label>
                <Input
                  id="farmSize"
                  type="number"
                  value={formData.farmSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmSize: e.target.value }))}
                  placeholder="Total farm area"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="farmLocation">Farm Location *</Label>
              <div className="flex gap-2">
                <Input
                  id="farmLocation"
                  value={formData.farmLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, farmLocation: e.target.value }))}
                  placeholder="City, Region, Country"
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryCrop">Primary Crop *</Label>
                <Select value={formData.primaryCrop} onValueChange={(value) => setFormData(prev => ({ ...prev, primaryCrop: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary crop" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maize">Maize</SelectItem>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="cassava">Cassava</SelectItem>
                    <SelectItem value="potatoes">Potatoes</SelectItem>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="coffee">Coffee</SelectItem>
                    <SelectItem value="cocoa">Cocoa</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="farmingExperience">Years of Experience *</Label>
                <Select value={formData.farmingExperience} onValueChange={(value) => setFormData(prev => ({ ...prev, farmingExperience: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="11-20">11-20 years</SelectItem>
                    <SelectItem value="20+">20+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="equipmentOwned">Equipment Owned</Label>
              <Textarea
                id="equipmentOwned"
                value={formData.equipmentOwned}
                onChange={(e) => setFormData(prev => ({ ...prev, equipmentOwned: e.target.value }))}
                placeholder="List farming equipment you own (tractor, irrigation system, etc.)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Household Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Household Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="householdSize">Household Size</Label>
                <Input
                  id="householdSize"
                  type="number"
                  value={formData.householdSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, householdSize: e.target.value }))}
                  placeholder="Number of people"
                />
              </div>
              <div>
                <Label htmlFor="incomeSource">Primary Income Source</Label>
                <Select value={formData.incomeSource} onValueChange={(value) => setFormData(prev => ({ ...prev, incomeSource: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farming">Farming only</SelectItem>
                    <SelectItem value="farming_part">Farming + other work</SelectItem>
                    <SelectItem value="other">Other sources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="challenges">Farming Challenges</Label>
              <Textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => setFormData(prev => ({ ...prev, challenges: e.target.value }))}
                placeholder="Describe main challenges you face in farming (pests, weather, access to credit, etc.)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onPrev} className="flex-1">
            Previous
          </Button>
           <Button
             onClick={handleSubmit}
             disabled={!isFormValid || isSubmitting}
             className="flex-1"
           >
             {isSubmitting ? 'Completing...' : 'Complete Onboarding'}
           </Button>
        </div>
      </div>
    </div>
  );
}