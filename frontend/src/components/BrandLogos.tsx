import React from 'react';

interface AirlineLogoProps {
  airline: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AirlineLogo: React.FC<AirlineLogoProps> = ({ airline, size = 'md' }) => {
  const name = airline.toLowerCase();

  const sizeClasses = {
    sm: 'h-6 px-2 text-[10px]',
    md: 'h-8 px-2.5 text-xs',
    lg: 'h-10 px-3.5 text-sm',
  }[size];

  if (name.includes('indigo') || name.includes('6e')) {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 rounded-lg bg-[#001B94] text-white font-bold tracking-tight shadow-xs ${sizeClasses}`}
        title="IndiGo Airlines"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#00A3E0]" />
        <span>IndiGo</span>
      </div>
    );
  }

  if (name.includes('air india') || name.includes('ai-') || name.includes('ai ')) {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 rounded-lg bg-[#ED1B24] text-white font-bold tracking-tight shadow-xs ${sizeClasses}`}
        title="Air India"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#FDB813]" />
        <span>Air India</span>
      </div>
    );
  }

  if (name.includes('akasa') || name.includes('qp')) {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-[#FF5722] to-[#673AB7] text-white font-bold tracking-tight shadow-xs ${sizeClasses}`}
        title="Akasa Air"
      >
        <span className="w-2 h-2 rounded-xs bg-white" />
        <span>Akasa Air</span>
      </div>
    );
  }

  if (name.includes('spicejet') || name.includes('sg')) {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 rounded-lg bg-[#E41C23] text-white font-bold tracking-tight shadow-xs ${sizeClasses}`}
        title="SpiceJet"
      >
        <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
        <span>SpiceJet</span>
      </div>
    );
  }

  if (name.includes('vistara') || name.includes('uk')) {
    return (
      <div
        className={`inline-flex items-center space-x-1.5 rounded-lg bg-[#5C1D48] text-[#E0B973] font-bold tracking-tight shadow-xs ${sizeClasses}`}
        title="Vistara"
      >
        <span>✦</span>
        <span>Vistara</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center space-x-1.5 rounded-lg bg-slate-800 text-white font-bold tracking-tight shadow-xs ${sizeClasses}`}
    >
      <span>✈</span>
      <span>{airline.split(' ')[0]}</span>
    </div>
  );
};

interface ProviderLogoProps {
  provider: 'booking' | 'agoda' | 'mmt' | 'google';
  size?: 'sm' | 'md';
}

export const ProviderLogo: React.FC<ProviderLogoProps> = ({ provider, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'h-5 px-1.5 text-[9px]' : 'h-6 px-2 text-[10px]';

  if (provider === 'booking') {
    return (
      <div
        className={`inline-flex items-center space-x-1 rounded bg-[#003580] text-white font-black tracking-tight ${sizeClasses}`}
        title="Booking.com"
      >
        <span className="font-serif">B.</span>
        <span className="font-sans font-bold">Booking.com</span>
      </div>
    );
  }

  if (provider === 'agoda') {
    return (
      <div
        className={`inline-flex items-center space-x-1 rounded bg-white border border-slate-200 text-slate-900 font-bold ${sizeClasses}`}
        title="Agoda"
      >
        <div className="flex space-x-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1A73E8]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
        </div>
        <span>agoda</span>
      </div>
    );
  }

  if (provider === 'google') {
    return (
      <div
        className={`inline-flex items-center space-x-1 rounded bg-white border border-slate-200 text-slate-800 font-medium ${sizeClasses}`}
        title="Google Travel"
      >
        <span className="font-bold text-[#4285F4]">G</span>
        <span>Google</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center space-x-1 rounded bg-slate-700 text-white font-medium ${sizeClasses}`}
    >
      <span>Official</span>
    </div>
  );
};

interface PlacePhotoBadgeProps {
  neighbourhood: string;
  city: string;
  className?: string;
}

export const PlacePhotoBadge: React.FC<PlacePhotoBadgeProps> = ({
  neighbourhood,
  city,
  className = '',
}) => {
  const placeGradients: Record<string, { bg: string; subtitle: string }> = {
    'MG Road': {
      bg: 'from-blue-600 via-indigo-600 to-slate-900',
      subtitle: 'Central Metro & Commercial Hub',
    },
    'High Grounds': {
      bg: 'from-amber-600 via-emerald-700 to-slate-900',
      subtitle: 'Heritage Enclave & Palace District',
    },
    'Indiranagar': {
      bg: 'from-fuchsia-600 via-purple-700 to-slate-900',
      subtitle: 'Boutique Cafes, Dining & Design',
    },
    'Electronic City': {
      bg: 'from-teal-600 via-cyan-700 to-slate-900',
      subtitle: 'Tech Corridor & Peaceful Campus',
    },
    'Connaught Place': {
      bg: 'from-rose-600 via-red-700 to-slate-900',
      subtitle: 'Colonial Circular Promenade',
    },
  };

  const meta = placeGradients[neighbourhood] || {
    bg: 'from-indigo-600 via-slate-700 to-slate-900',
    subtitle: `${city} City Hub`,
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden text-white p-3.5 bg-gradient-to-br ${meta.bg} shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider font-semibold bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full">
          📍 {neighbourhood}
        </span>
        <span className="text-[10px] text-white/80">{city}</span>
      </div>
      <div className="mt-2">
        <div className="font-bold text-xs text-white">{meta.subtitle}</div>
        <div className="text-[10px] text-white/70">Verified Accommodation Zone</div>
      </div>
    </div>
  );
};
