import { ciiRatingColor } from '../../utils/formatters';

interface Props {
  rating: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CIIRatingBadge({ rating, size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${ciiRatingColor(rating)} ${sizeClasses[size]}`}
    >
      {rating}
    </span>
  );
}
