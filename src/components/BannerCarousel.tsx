import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Banner {
  id: string;
  image_url: string;
  title: string;
  link_url?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

export function BannerCarousel({ 
  banners, 
  autoPlay = true, 
  autoPlayInterval = 4000 
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Auto-play functionality
  React.useEffect(() => {
    if (!autoPlay || banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, banners.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? banners.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === banners.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (banners.length === 0) return null;

  if (banners.length === 1) {
    return (
      <section className="sm:container px-0">
        <div className="flex justify-center">
          <div className="aspect-[4/5] w-full max-w-sm sm:max-w-md overflow-hidden shadow-card">
            <img 
              src={banners[0].image_url} 
              alt={banners[0].title} 
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
              onClick={() => banners[0].link_url && window.open(banners[0].link_url, '_blank')} 
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sm:container px-0">
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Carousel Container */}
        <div className="relative overflow-hidden shadow-card">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div 
                key={banner.id} 
                className="aspect-[4/5] w-full flex-shrink-0"
              >
                <img 
                  src={banner.image_url} 
                  alt={banner.title} 
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300" 
                  onClick={() => banner.link_url && window.open(banner.link_url, '_blank')} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 z-10"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90 z-10"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  index === currentIndex 
                    ? 'bg-primary' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}