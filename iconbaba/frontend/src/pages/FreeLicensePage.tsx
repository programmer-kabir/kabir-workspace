import React from 'react';
import SiteHeader from '@/components/header/SiteHeader';
import SiteFooter from '@/components/footer/SiteFooter';
import ContentPage from '@/components/content/ContentPage';

export default function FreeLicensePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0e15]">
      <SiteHeader />
      <div className="flex-1">
        <ContentPage slug="free-license" />
      </div>
      <SiteFooter />
    </div>
  );
}
