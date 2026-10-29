import React from 'react';
import { ExternalLink, ShieldCheck, Plane, Building } from 'lucide-react';
import type { SiteBookingLinks } from '../types';
import { AirlineLogo, ProviderLogo } from './BrandLogos';

interface SiteBookingLinksCardProps {
  links?: SiteBookingLinks;
  airlineName: string;
  hotelName: string;
}

export const SiteBookingLinksCard: React.FC<SiteBookingLinksCardProps> = ({
  links,
  airlineName,
  hotelName,
}) => {
  if (!links) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 border border-indigo-500/30 text-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-indigo-800/50">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <span>Agent-Free Direct Site Booking</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-medium">
                0% Extra Commission
              </span>
            </h4>
            <p className="text-[11px] text-indigo-200">
              Book directly on the provider&apos;s official site at base inventory prices without intermediary fees.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Airline Direct Links */}
        <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold">
                <Plane size={15} />
                <span>Official Airline Portal</span>
              </div>
              <AirlineLogo airline={airlineName} size="sm" />
            </div>
            <p className="text-[11px] text-slate-300">
              Go to <strong>{airlineName}</strong> official reservation portal with prefilled route &amp; dates:
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={links.flight_search_url || links.flight_direct_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <span>Book on Carrier Site</span>
              <ExternalLink size={13} />
            </a>

            <a
              href={links.flight_google_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              <ProviderLogo provider="google" size="sm" />
              <span>Google Flights</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Hotel Direct Links */}
        <div className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/60 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold">
                <Building size={15} />
                <span>Official Hotel Reservation</span>
              </div>
              <ProviderLogo provider="booking" size="sm" />
            </div>
            <p className="text-[11px] text-slate-300">
              Reserve <strong>{hotelName}</strong> directly on top travel platforms with zero agency markup:
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={links.hotel_direct_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <ProviderLogo provider="booking" size="sm" />
              <span>Book on Booking.com</span>
              <ExternalLink size={13} />
            </a>

            <a
              href={links.hotel_google_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition cursor-pointer"
            >
              <ProviderLogo provider="google" size="sm" />
              <span>Google Hotels</span>
              <ExternalLink size={11} />
            </a>

            <a
              href={links.hotel_agoda_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 text-[11px] transition cursor-pointer"
            >
              <ProviderLogo provider="agoda" size="sm" />
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
