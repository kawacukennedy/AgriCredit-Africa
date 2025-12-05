'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export function FarmMap() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Farm Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Interactive map would be here</p>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>NDVI Index</span>
            <span className="text-success">0.72</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-agri-green h-2 rounded-full" style={{ width: '72%' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}