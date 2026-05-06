

// lucide-react may not be installed in this environment; provide lightweight local SVG components


const Activity = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12h2l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Heart = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.1 20.55l-.1.1-.11-.1C7.14 16.24 4 13.39 4 10.28 4 8.08 5.78 6.3 8 6.3c1.54 0 3.04.99 4 2.54 0 0 .96-1.54 2.99-2.54 2.22-1 4 .78 4 2.98 0 3.11-3.14 5.96-7.89 10.27z" />
  </svg>
);

interface FilCareLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Header({ size = 'md', showText = true }: FilCareLogoProps) {
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
    <>
      
      <div
        className="top-0 left l-margin-auto r-margin-auto p-4 shadow-sm sticky z-50 bg-white/80 backdrop-blur-sm"
        style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.12))' }}
      >
        <div className="flex items-center gap-2 sm:gap-3 ">
          <div className={`relative ${currentSize.container} flex items-center justify-center`}>
            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl w-full h-full flex items-center  justify-center shadow-lg">
              <Activity className={`${currentSize.pulse} text-white drop-shadow-lg ml-1`} />
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
                  Smart Healthcare
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
}