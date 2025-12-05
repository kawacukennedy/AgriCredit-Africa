import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for African farmers. Powered by AI and Blockchain.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/help"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t('navigation.help')}
          </Link>
          <Link
            href="/profile"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {t('navigation.profile')}
          </Link>
        </div>
      </div>
    </footer>
  );
}