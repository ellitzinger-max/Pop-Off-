import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';

export const NativeAd = () => {
  return (
    <Card 
      className="glass-effect border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100"
      data-testid="native-ad-card"
    >
      <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
        <Badge variant="secondary" className="mb-3 bg-gray-200 text-gray-600">
          <Megaphone className="w-3 h-3 mr-1" />
          Sponsored
        </Badge>
        
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
          <Megaphone className="w-8 h-8 text-primary/60" />
        </div>
        
        <h3 className="font-bold text-lg text-gray-700 mb-2">
          Advertisement Space
        </h3>
        <p className="text-sm text-muted-foreground max-w-[200px]">
          This is a placeholder for native advertising content. Real ads would appear here.
        </p>
        
        <div className="mt-4 text-xs text-gray-400">
          [MOCK AD - Integration Pending]
        </div>
      </CardContent>
    </Card>
  );
};
