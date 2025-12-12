'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

import { MapPin, Tractor, Users } from 'lucide-react';

interface ProfileSetupFormProps {
  onNext: (data: any) => void;
  onPrev: () => void;
  initialData?: any;
  role?: string;
}

function ProfileSetupForm({ onNext, onPrev, initialData, role }: ProfileSetupFormProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFarmer = role === 'farmer';
  const isInvestor = role === 'investor';

  const [formData, setFormData] = useState({
    // Farmer fields
    farmName: initialData?.farmName || '',
    farmSize: initialData?.farmSize || '',
    farmLocation: initialData?.farmLocation || '',
    primaryCrop: initialData?.primaryCrop || '',
    farmingExperience: initialData?.farmingExperience || '',
    equipmentOwned: initialData?.equipmentOwned || '',
    householdSize: initialData?.householdSize || '',
    incomeSource: initialData?.incomeSource || '',
    challenges: initialData?.challenges || '',
    // Investor fields
    investmentExperience: initialData?.investmentExperience || '',
    riskTolerance: initialData?.riskTolerance || '',
    investmentGoals: initialData?.investmentGoals || '',
    preferredSectors: initialData?.preferredSectors || [],
    initialInvestment: initialData?.initialInvestment || '',
    investmentHorizon: initialData?.investmentHorizon || '',
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    onNext({
      ...formData,
      profileCompleted: true,
      completedAt: new Date().toISOString(),
      credential: `cred_${Date.now()}`
    });
  };

  const isFormValid = isFarmer
    ? (formData.farmName && formData.farmSize && formData.farmLocation &&
       formData.primaryCrop && formData.farmingExperience)
    : isInvestor
    ? (formData.investmentExperience && formData.riskTolerance && formData.investmentGoals &&
       formData.initialInvestment && formData.investmentHorizon)
    : false;

  return (
    <div className="space-y-6">
      <div className="text-center">
        {isFarmer ? (
          <>
            <Tractor className="mx-auto h-12 w-12 text-agri-green mb-4" />
            <h3 className="text-lg font-semibold mb-2">Complete Your Farmer Profile</h3>
            <p className="text-muted-foreground">
              Tell us about your farming operation to personalize your experience
              and improve our AI recommendations.
            </p>
          </>
        ) : isInvestor ? (
          <>
            <Users className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Complete Your Investment Profile</h3>
            <p className="text-muted-foreground">
              Tell us about your investment preferences to personalize your portfolio
              and optimize your returns.
            </p>
          </>
        ) : null}
      </div>

      <div className="space-y-6">
        {isFarmer ? (
          <>
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
                      <SelectTrigger className="bg-harvest-gold text-slate-gray">
                        <SelectValue placeholder="Select primary crop" />
                      </SelectTrigger>
                      <SelectContent className="bg-harvest-gold text-slate-gray">
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
                      <SelectTrigger className="bg-harvest-gold text-slate-gray">
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent className="bg-harvest-gold text-slate-gray">
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
                      <SelectTrigger className="bg-harvest-gold text-slate-gray">
                        <SelectValue placeholder="Select income source" />
                      </SelectTrigger>
                      <SelectContent className="bg-harvest-gold text-slate-gray">
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
          </>
        ) : isInvestor ? (
          <>
            {/* Investment Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Investment Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investmentExperience">Investment Experience *</Label>
                    <Select value={formData.investmentExperience} onValueChange={(value) => setFormData(prev => ({ ...prev, investmentExperience: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                        <SelectItem value="advanced">Advanced (6+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="riskTolerance">Risk Tolerance *</Label>
                    <Select value={formData.riskTolerance} onValueChange={(value) => setFormData(prev => ({ ...prev, riskTolerance: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select risk tolerance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="investmentGoals">Investment Goals *</Label>
                  <Select value={formData.investmentGoals} onValueChange={(value) => setFormData(prev => ({ ...prev, investmentGoals: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Regular Income</SelectItem>
                      <SelectItem value="growth">Capital Growth</SelectItem>
                      <SelectItem value="balanced">Balanced Approach</SelectItem>
                      <SelectItem value="sustainability">Sustainable Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="initialInvestment">Initial Investment Amount *</Label>
                    <Input
                      id="initialInvestment"
                      type="number"
                      value={formData.initialInvestment}
                      onChange={(e) => setFormData(prev => ({ ...prev, initialInvestment: e.target.value }))}
                      placeholder="Amount in USD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="investmentHorizon">Investment Horizon *</Label>
                    <Select value={formData.investmentHorizon} onValueChange={(value) => setFormData(prev => ({ ...prev, investmentHorizon: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time horizon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short-term (1-3 years)</SelectItem>
                        <SelectItem value="medium">Medium-term (3-7 years)</SelectItem>
                        <SelectItem value="long">Long-term (7+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}

        <div className="flex gap-4">
          <Button variant="outline" onClick={onPrev} className="flex-1">
            Previous
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Completing...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProfileSetupForm;