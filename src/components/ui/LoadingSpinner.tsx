interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
const colorMap = {
  primary: 'border-brand-primary border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-400 border-t-transparent',
};

export function LoadingSpinner({ size = 'md', color = 'primary' }: SpinnerProps) {
  return (
    <div
      className={`rounded-full border-2 animate-spin ${sizeMap[size]} ${colorMap[color]}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageSpinner({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-brand-bg flex flex-col items-center justify-center z-50 gap-4">
      <LoadingSpinner size="lg" />
      {message && <p className="text-gray-600 text-sm">{message}</p>}
    </div>
  );
}
