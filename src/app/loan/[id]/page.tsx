'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function LoanDetailPage({ params }: { params: { id: string } }) {
  const { t } = useTranslation();

  // Mock data
  const loan = {
    id: params.id,
    farmer: 'John Doe',
    amount: 1000,
    interest: 12,
    term: 12,
    score: 750,
    location: 'Kenya',
    crop: 'Maize',
    status: 'funded',
    aiReport: {
      score: 750,
      factors: [
        'High NDVI index',
        'Consistent payment history',
        'Good farm location',
      ],
      cid: 'Qm...',
    },
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">${loan.amount} Loan</CardTitle>
                      <p className="text-muted-foreground">Farmer: {loan.farmer}</p>
                    </div>
                    <Badge variant="secondary">{loan.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      <p className="text-lg font-semibold">{loan.interest}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Term</p>
                      <p className="text-lg font-semibold">{loan.term} months</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Credit Score</p>
                      <p className="text-lg font-semibold">{loan.score}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-lg font-semibold">{loan.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Report */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Credit Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Credit Score</span>
                      <Badge variant="secondary">{loan.aiReport.score}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Key Factors:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {loan.aiReport.factors.map((factor, index) => (
                          <li key={index}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Report CID: {loan.aiReport.cid}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full" size="lg">
                      Fund Loan
                    </Button>
                    <Button variant="outline" className="w-full">
                      View on Explorer
                    </Button>
                    <Button variant="outline" className="w-full">
                      Download Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Default Risk</span>
                      <span className="text-success">Low</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Expected Return</span>
                      <span>15.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}