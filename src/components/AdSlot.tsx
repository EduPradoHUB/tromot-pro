import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useApp } from '@/contexts/AppContext';
import type { Database } from '@/integrations/supabase/types';

type Advertisement = Database['public']['Tables']['advertisements']['Row'];

interface AdSlotProps {
  slot: 'home_hero' | 'product_banner' | 'feed_sponsored';
  className?: string;
  productId?: string;
}

export default function AdSlot({ slot, className = '', productId }: AdSlotProps) {
  const { getActiveAd, trackEvent, currentUser } = useApp();
  const [ad, setAd] = useState<Advertisement | null>(null);
  const [impressionTracked, setImpressionTracked] = useState(false);

  useEffect(() => {
    const activeAd = getActiveAd(slot);
    setAd(activeAd);
    setImpressionTracked(false);
  }, [slot, getActiveAd]);

  useEffect(() => {
    if (ad && !impressionTracked) {
      // Track impression
      trackEvent({ 
        type: 'ad_impression', 
        ad_id: ad.id,
        product_id: productId 
      });
      setImpressionTracked(true);
    }
  }, [ad, impressionTracked, trackEvent, productId]);

  const handleAdClick = () => {
    if (ad) {
      trackEvent({ 
        type: 'ad_click', 
        ad_id: ad.id,
        product_id: productId 
      });
      
      if (ad.target_url) {
        window.open(ad.target_url, '_blank');
      }
    }
  };

  if (!ad) return null;

  const isHomeHero = slot === 'home_hero';
  const isProductBanner = slot === 'product_banner';
  const isFeedSponsored = slot === 'feed_sponsored';

  if (isHomeHero) {
    return (
      <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${className}`} onClick={handleAdClick}>
        <CardContent className="p-0">
          <div className="relative">
            <img
              src={ad.creative_url}
              alt="Anúncio"
              className="w-full h-96 object-cover rounded-t-2xl"
            />
            <Badge className="absolute top-3 right-3 bg-background/90 text-foreground">
              Patrocinado
            </Badge>
          </div>
          <div className="p-4">
            <p className="font-semibold text-foreground">{ad.advertiser}</p>
            <p className="text-sm text-muted-foreground">Clique para saber mais</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isProductBanner) {
    return (
      <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${className}`} onClick={handleAdClick}>
        <CardContent className="p-0">
          <AspectRatio ratio={5/4} className="relative">
            <img
              src={ad.creative_url}
              alt="Anúncio"
              className="w-full h-full object-cover rounded-t-2xl"
            />
            <Badge className="absolute top-2 right-2 bg-background/90 text-foreground text-xs">
              Patrocinado
            </Badge>
          </AspectRatio>
          <div className="p-3">
            <p className="font-medium text-sm">{ad.advertiser}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isFeedSponsored) {
    return (
      <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${className}`} onClick={handleAdClick}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <img
              src={ad.creative_url}
              alt="Anúncio"
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  Patrocinado
                </Badge>
              </div>
              <p className="font-semibold text-sm">{ad.advertiser}</p>
              <p className="text-xs text-muted-foreground">
                Conteúdo promocional - Clique para saber mais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}