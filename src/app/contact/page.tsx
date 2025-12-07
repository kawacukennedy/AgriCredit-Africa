'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Users,
  Headphones,
  Globe,
  CheckCircle
} from 'lucide-react';

export default function ContactPage() {
  const { t } = useTranslation();

  const contactMethods = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Get instant support from our team',
      availability: 'Available 24/7',
      action: 'Start Chat',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us a detailed message',
      availability: 'Response within 24 hours',
      action: 'Send Email',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our experts',
      availability: 'Mon-Fri, 9AM-5PM EAT',
      action: 'Call Now',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Community Forum',
      description: 'Connect with other farmers',
      availability: 'Community driven',
      action: 'Join Community',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const offices = [
    {
      city: 'Nairobi, Kenya',
      address: 'Westlands Business Park, Nairobi CBD',
      phone: '+254 700 123 456',
      email: 'kenya@agricredit.africa',
      hours: 'Mon-Fri: 9AM-6PM EAT'
    },
    {
      city: 'Lagos, Nigeria',
      address: 'Victoria Island, Lagos State',
      phone: '+234 801 234 5678',
      email: 'nigeria@agricredit.africa',
      hours: 'Mon-Fri: 9AM-6PM WAT'
    },
    {
      city: 'Accra, Ghana',
      address: 'East Legon, Accra',
      phone: '+233 24 123 4567',
      email: 'ghana@agricredit.africa',
      hours: 'Mon-Fri: 9AM-6PM GMT'
    }
  ];

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-16">
        <div className="container text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Contact Us
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Get in touch with our team for support, partnerships, or any questions about AgriCredit Africa
          </p>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Contact Methods */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Card key={index} className="shadow-level1 border-0 hover:shadow-level2 transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-gray mb-2">{method.title}</h3>
                    <p className="text-slate-gray/70 text-sm mb-3">{method.description}</p>
                    <p className="text-xs text-slate-gray/60 mb-4">{method.availability}</p>
                    <Button size="sm" className="w-full">
                      {method.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Send className="w-5 h-5 mr-2 text-agri-green" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="Your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Your last name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                      <SelectItem value="loans">Loan Application Help</SelectItem>
                      <SelectItem value="carbon">Carbon Credits</SelectItem>
                      <SelectItem value="governance">Governance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    rows={5}
                    className="resize-none"
                  />
                </div>

                <Button className="w-full btn-primary">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Offices */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <MapPin className="w-5 h-5 mr-2 text-agri-green" />
                    Our Offices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {offices.map((office, index) => (
                    <div key={index} className="border-b border-slate-gray/10 pb-4 last:border-b-0 last:pb-0">
                      <h4 className="font-semibold text-slate-gray mb-2">{office.city}</h4>
                      <div className="space-y-2 text-sm text-slate-gray/70">
                        <p className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          {office.address}
                        </p>
                        <p className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                          {office.phone}
                        </p>
                        <p className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                          {office.email}
                        </p>
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                          {office.hours}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Support Hours */}
              <Card className="shadow-level1 border-0 bg-gradient-to-br from-agri-green/5 to-sky-teal/5">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Headphones className="w-8 h-8 text-agri-green flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-gray mb-2">Support Hours</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-gray/70">Monday - Friday:</span>
                          <span className="font-medium">9:00 AM - 6:00 PM EAT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-gray/70">Saturday:</span>
                          <span className="font-medium">10:00 AM - 4:00 PM EAT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-gray/70">Sunday:</span>
                          <span className="font-medium">Emergency support only</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          24/7 emergency support available for critical issues
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="shadow-level1 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Globe className="w-5 h-5 mr-2 text-agri-green" />
                    Connect With Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Discord
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Globe className="w-4 h-4 mr-2" />
                      LinkedIn
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Mail className="w-4 h-4 mr-2" />
                      Newsletter
                    </Button>
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