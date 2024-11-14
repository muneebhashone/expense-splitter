import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface LoadingCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  items?: number;
}

export function LoadingCard({ icon: Icon, title, description, color, items = 3 }: LoadingCardProps) {
  return (
    <Card className={`border-t-4 border-t-${color}-500`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 text-${color}-500`} />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className={`bg-${color}-100 text-${color}-800 px-3 py-1 rounded-full text-sm animate-pulse`}>
            Loading...
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border">
              <div className="flex flex-col space-y-3">
                <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="w-1/3 h-3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
