'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Leaf, Twitter, Github, Mail, MapPin, Phone, ExternalLink, ArrowUp, Shield, Award, CheckCircle, Linkedin, MessageCircle, Send } from 'lucide-react';

export function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const footerLinks = {
    platform: [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'Marketplace', href: '/marketplace' },
      { name: 'Carbon Credits', href: '/carbon' },
      { name: 'Yield Farming', href: '/farming' },
    ],
    governance: [
      { name: 'DAO Governance', href: '/governance' },
      { name: 'Proposals', href: '/governance/proposals' },
      { name: 'Voting', href: '/governance/vote' },
      { name: 'Treasury', href: '/governance/treasury' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Documentation', href: '/docs' },
      { name: 'API Reference', href: '/api' },
      { name: 'Contact Us', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Compliance', href: '/compliance' },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/agricreditafrica', icon: Twitter },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/agricreditafrica', icon: Linkedin },
    { name: 'GitHub', href: 'https://github.com/agricreditafrica', icon: Github },
    { name: 'Telegram', href: 'https://t.me/agricreditafrica', icon: Send },
    { name: 'Discord', href: 'https://discord.gg/agricreditafrica', icon: MessageCircle },
    { name: 'Email', href: 'mailto:hello@agricredit.africa', icon: Mail },
  ];

  const certifications = [
    { name: 'ISO 27001', icon: Shield, description: 'Information Security' },
    { name: 'Blockchain Verified', icon: CheckCircle, description: 'Smart Contract Audited' },
    { name: 'Carbon Certified', icon: Award, description: 'Climate Action Verified' },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Mock subscription
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-gray text-paper-white">
      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-agri-green to-sky-teal rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="font-black text-2xl text-paper-white group-hover:text-harvest-gold transition-colors">
                  AgriCredit
                </div>
                <div className="text-sm text-paper-white/60">Africa</div>
              </div>
            </Link>

            <p className="text-paper-white/80 mb-6 leading-relaxed">
              Empowering African farmers with AI-powered microfinance and blockchain technology.
              Transparent, fair, and sustainable agricultural finance for the future.
            </p>

            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-paper-white/10 rounded-lg flex items-center justify-center hover:bg-harvest-gold hover:text-slate-gray transition-all duration-200 group"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-harvest-gold">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-paper-white/70 hover:text-harvest-gold transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Governance Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-harvest-gold">Governance</h3>
            <ul className="space-y-3">
              {footerLinks.governance.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-paper-white/70 hover:text-harvest-gold transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-harvest-gold">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-paper-white/70 hover:text-harvest-gold transition-colors duration-200 flex items-center group"
                  >
                    {link.name}
                    <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-harvest-gold">Stay Connected</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-harvest-gold mt-0.5 flex-shrink-0" />
                <div className="text-paper-white/70 text-sm">
                  <div>Nairobi, Kenya</div>
                  <div>Lagos, Nigeria</div>
                  <div>Accra, Ghana</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-harvest-gold flex-shrink-0" />
                <a
                  href="tel:+254700000000"
                  className="text-paper-white/70 hover:text-harvest-gold transition-colors text-sm"
                >
                  +254 700 000 000
                </a>
              </div>

               <div className="pt-4">
                 <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                   <div className="flex space-x-2">
                     <Input
                       type="email"
                       placeholder="Enter your email"
                       value={email}
                       onChange={(e) => setEmail(e.target.value)}
                       className="flex-1 bg-paper-white/10 border-paper-white/20 text-paper-white placeholder:text-paper-white/60 focus:border-harvest-gold focus:ring-harvest-gold/20"
                       required
                     />
                     <Button
                       type="submit"
                       size="sm"
                       className="bg-harvest-gold hover:bg-harvest-gold/90 text-slate-gray px-4"
                       disabled={isSubscribed}
                     >
                       {isSubscribed ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                     </Button>
                   </div>
                   {isSubscribed && (
                     <p className="text-sm text-harvest-gold">Successfully subscribed!</p>
                   )}
                 </form>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-paper-white/5 border-t border-paper-white/10">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              {certifications.map((cert) => (
                <div key={cert.name} className="flex items-center space-x-3 text-paper-white/80">
                  <cert.icon className="w-6 h-6 text-harvest-gold" />
                  <div>
                    <div className="font-semibold text-sm">{cert.name}</div>
                    <div className="text-xs text-paper-white/60">{cert.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Back to Top Button */}
            <Button
              onClick={scrollToTop}
              variant="outline"
              size="sm"
              className="border-harvest-gold text-harvest-gold hover:bg-harvest-gold hover:text-slate-gray"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Back to Top
            </Button>
          </div>
        </div>
      </div>

      <Separator className="bg-paper-white/10" />

      {/* Bottom Footer */}
      <div className="container py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-paper-white/60">
            <p>© 2025 AgriCredit Africa. All rights reserved.</p>
            <div className="flex space-x-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="hover:text-harvest-gold transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-paper-white/60">
            <span>Powered by</span>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-agri-green to-sky-teal rounded"></div>
              <span className="font-semibold text-harvest-gold">AI + Blockchain</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}