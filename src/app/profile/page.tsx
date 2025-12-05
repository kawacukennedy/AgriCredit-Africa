'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);

  // Mock data for profile
  const profileData = {
    name: user?.name || 'John Farmer',
    email: 'john.farmer@example.com',
    phone: '+254 712 345 678',
    location: 'Nairobi, Kenya',
    didId: 'did:agricredit:0x1234567890abcdef',
    verified: true,
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-gray mb-8">
          {t('profile.title')}
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.personalInfo')}</CardTitle>
              <CardDescription>
                Manage your personal information and farm details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('profile.name')}</label>
                <p className="text-sm text-muted-foreground">{profileData.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('profile.email')}</label>
                <p className="text-sm text-muted-foreground">{profileData.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('profile.phone')}</label>
                <p className="text-sm text-muted-foreground">{profileData.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('profile.location')}</label>
                <p className="text-sm text-muted-foreground">{profileData.location}</p>
              </div>
              <Button variant="outline" size="sm">
                {t('common.edit')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('profile.did')}</CardTitle>
              <CardDescription>
                Your decentralized identity for secure transactions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('profile.didId')}</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {profileData.didId}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={profileData.verified ? 'default' : 'secondary'}>
                  {profileData.verified ? 'Verified' : 'Unverified'}
                </Badge>
                <Button variant="outline" size="sm">
                  {t('profile.verifyDid')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('profile.settings')}</CardTitle>
              <CardDescription>
                Customize your experience and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('profile.language')}</label>
                <p className="text-sm text-muted-foreground">English</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('profile.theme')}</label>
                <p className="text-sm text-muted-foreground">Light</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('profile.notifications')}</label>
                <p className="text-sm text-muted-foreground">Enabled</p>
              </div>
              <Button variant="outline" size="sm">
                {t('common.edit')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}