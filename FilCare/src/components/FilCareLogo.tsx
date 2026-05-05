import { Activity, Heart } from 'lucide-react';

interface FilCareLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function FilCareLogo({ size = 'md', showText = true }: FilCareLogoProps) {
  const sizes = {
    sm: {
      container: 'w-8 h-8',
      pulse: 'w-5 h-5',
      text: 'text-base',
      heart: 'w-3 h-3',
      subtext: 'text-xs',
    },
    md: {
      container: 'w-10 h-10',
      pulse: 'w-6 h-6',
      text: 'text-lg sm:text-xl',
      heart: 'w-4 h-4',
      subtext: 'text-xs',
    },
    lg: {
      container: 'w-16 h-16',
      pulse: 'w-10 h-10',
      text: 'text-2xl sm:text-3xl',
      heart: 'w-5 h-5',
      subtext: 'text-sm',
    },
  };

  const currentSize = sizes[size];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Pulse/Activity icon */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl w-full h-full flex items-center justify-center shadow-lg">
          <Activity className={`${currentSize.pulse} text-white drop-shadow-lg`} />
        </div>
      </div>
      {showText && (
        <div>
          <div className="flex items-center gap-1">
            <h1 className={`${currentSize.text} font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight`}>
              FilCare
            </h1>
            <Heart className={`${currentSize.heart} text-red-500 fill-red-500`} />
          </div>
          {size !== 'sm' && (
            <p className={`${currentSize.subtext} text-gray-500 hidden sm:block`}>
              Smart Healthcare Service
            </p>
          )}
        </div>
      )}
    </div>
  );
}
