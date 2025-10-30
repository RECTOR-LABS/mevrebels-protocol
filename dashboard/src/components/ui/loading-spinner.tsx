export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-rebellious border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-midnight-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-midnight-black border-2 border-rebellious rounded-lg p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        {message && (
          <p className="text-white font-mono text-lg">{message}</p>
        )}
      </div>
    </div>
  );
}
