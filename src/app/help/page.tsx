'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function HelpPage() {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('help.gettingStarted'),
      answer: 'To get started with AgriCredit, first connect your wallet and complete your profile with farm details. Then you can apply for loans or explore the marketplace.'
    },
    {
      question: t('help.loanProcess'),
      answer: 'Apply for a loan by filling out the application form with your farm details. Our AI will assess your credit score, and lenders can fund your loan on the marketplace.'
    },
    {
      question: t('help.carbonTrading'),
      answer: 'Earn carbon credits by participating in sustainable farming practices. Trade them on our marketplace or use them to offset emissions.'
    },
    {
      question: 'How do I connect my wallet?',
      answer: 'Click the "Connect Wallet" button in the top right. We support MetaMask and other Web3 wallets for secure blockchain interactions.'
    },
    {
      question: 'What is a DID?',
      answer: 'DID stands for Decentralized Identity. It\'s a secure, blockchain-based identity that verifies your information without revealing personal details.'
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-gray mb-8">
          {t('help.title')}
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('help.faq')}</CardTitle>
                <CardDescription>
                  Find answers to common questions about AgriCredit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('help.contact')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">{t('help.support')}</p>
                  <p className="text-sm text-muted-foreground">{t('help.email')}</p>
                  <p className="text-sm text-muted-foreground">{t('help.phone')}</p>
                </div>
                <Button className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('help.guides')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  {t('help.gettingStarted')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  {t('help.loanProcess')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  {t('help.carbonTrading')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}