"use client";

// without loading Screen

import { useCallback, useState, useEffect, memo } from "react";
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import Banner from "./_components/Banner";
import About from "./_components/About";
import Workshop from "./_components/Workshop";
import PastEvent from "./_components/PastEvent";
import Council from "./_components/Council";

// Memoize UI components to prevent unnecessary re-renders
const ScrollIndicator = memo(({ visible }) => (
  <div 
    className={`fixed bottom-8 w-full flex justify-center z-50 transition-opacity duration-500 ${
      visible ? 'opacity-80 hover:opacity-100' : 'opacity-0 pointer-events-none'
    }`}
  >
    <div className="flex flex-col items-center animate-bounce">
      <span className="text-sm text-gray-600 mb-1 text-center px-4">Scroll to explore</span>
      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </div>
));

const ScrollToTopButton = memo(({ visible, onClick }) => (
  <button
    onClick={onClick}
    className={`fixed bottom-4 right-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 z-40 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
    }`}
    aria-label="Scroll to top"
  >
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  </button>
));

export default function Home() {
  const [scroll, setScroll] = useState({
    showIndicator: true,
    showTopButton: false
  });

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          setScroll({
            showIndicator: scrollY < 100,
            showTopButton: scrollY > 300
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <Header />
      <main>
        <Banner />
        <About />
        <Workshop />
        <PastEvent />
        <Council />
        <ScrollIndicator visible={scroll.showIndicator} />
        <ScrollToTopButton visible={scroll.showTopButton} onClick={scrollToTop} />
      </main>
      <Footer />
    </>
  );
}

{/* <>

// with loading screen

import { useCallback, useState, useEffect, memo, useMemo, useRef } from "react";
import { Loader2, Code2, Sparkles, Binary, Gauge } from "lucide-react";
import dynamic from 'next/dynamic';
import Header from "./_components/Header";
import Footer from "./_components/Footer";
import Banner from "./_components/Banner";
import About from "./_components/About";
import Workshop from "./_components/Workshop";
import PastEvent from "./_components/PastEvent";
import Council from "./_components/Council";

// Constants
const LOADING_MESSAGES = [
  { icon: <Binary className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Initializing systems..." },
  { icon: <Gauge className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Optimizing performance..." },
  { icon: <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Loading components..." },
  { icon: <Loader2 className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Almost there..." },
  { icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />, text: "Preparing interface..." },
];

// Components to preload
const COMPONENTS_TO_LOAD = [
  { name: "Main layout", weight: 10 },
  { name: "Header", weight: 15 },
  { name: "Banner", weight: 20 },
  { name: "About section", weight: 15 },
  { name: "Workshop", weight: 15 },
  { name: "Past Events", weight: 15 },
  { name: "Council", weight: 10 }
];

// Generate particles only once
const generateParticles = (count = 12) => 
  Array(count).fill().map(() => ({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    width: `${Math.random() * 4 + 2}px`,
    height: `${Math.random() * 4 + 2}px`,
    opacity: Math.random() * 0.5 + 0.3,
    animationDuration: `${Math.random() * 10 + 15}s`,
    animationDelay: `${Math.random() * -15}s`,
  }));

// Optimized UI components
const LoadingMessage = memo(({ icon, text }) => (
  <div className="backdrop-blur-sm py-2 sm:py-3">
    <div className="flex items-center justify-center space-x-2 sm:space-x-3 px-3 sm:px-4">
      <div className="text-gradient-blue-purple animate-pulse">{icon}</div>
      <span className="text-xs sm:text-sm md:text-base font-light tracking-wide text-gray-300">{text}</span>
    </div>
  </div>
));

const ParticlesBackground = memo(() => {
  // Use useMemo to avoid regenerating particles on every render
  const particles = useMemo(() => generateParticles(), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      {particles.map((style, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-blue-400"
          style={{
            top: style.top,
            left: style.left,
            width: style.width,
            height: style.height,
            opacity: style.opacity,
            animation: `float ${style.animationDuration} linear infinite`,
            animationDelay: style.animationDelay,
          }}
        />
      ))}
    </div>
  );
});

const Logo = memo(() => (
  <div className="relative p-3 sm:p-4 overflow-visible w-full text-center animate-fade-in">
    <div className="absolute -inset-8 sm:-inset-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl animate-pulse"></div>
    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold tracking-wider bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
      WEBSTERS
    </h1>
    <div className="absolute -right-2 sm:-right-4 -top-2 sm:-top-4 w-4 sm:w-8 h-4 sm:h-8">
      <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
    </div>
  </div>
));

const ProgressIndicator = memo(({ progress, currentComponent }) => (
  <div className="space-y-3 sm:space-y-4 group">
    <div className="h-1.5 sm:h-2 w-full bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm group-hover:h-2 sm:group-hover:h-2.5 transition-all duration-300">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
    <div className="flex items-center justify-between text-xs sm:text-sm md:text-base text-gray-400">
      <span className="group-hover:text-white transition-colors duration-300">{progress.toFixed(0)}%</span>
      <span className="group-hover:text-white transition-colors duration-300">
        {currentComponent ? `Loading ${currentComponent}...` : 'Loading...'}
      </span>
    </div>
  </div>
));

const AnimatedDots = memo(() => {
  // Pre-compute animation delays
  const delays = [0, 0.15, 0.3];
  const pingDelays = [0, 0.2, 0.4];
  
  return (
    <div className="flex justify-center space-x-2 sm:space-x-4 mt-4 sm:mt-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="relative">
          <div
            className="absolute inset-0 bg-blue-500/30 rounded-full blur-md animate-ping"
            style={{ animationDelay: `${pingDelays[i]}s` }}
          />
          <div
            className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: `${delays[i]}s` }}
          />
        </div>
      ))}
    </div>
  );
});

const LoadingScreenComponent = memo(({ progress, currentComponent }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Set message rotation interval
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(messageInterval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center bg-black text-white z-50">
      <ParticlesBackground />
      
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md px-3 sm:px-4 md:px-8 space-y-4 sm:space-y-6 md:space-y-8 relative z-10">
        <Logo />
        <div className="space-y-1 sm:space-y-2 text-center">
          <p className="text-sm sm:text-base md:text-2xl font-light tracking-wide">
            The Computer Science Society of Shivaji College
          </p>
          <p className="text-xs sm:text-sm md:text-lg text-gray-400 font-light">
            University of Delhi
          </p>
        </div>
        <ProgressIndicator progress={progress} currentComponent={currentComponent} />
        <LoadingMessage {...LOADING_MESSAGES[currentMessageIndex]} />
        <AnimatedDots />
      </div>
    </div>
  );
});

// Client-side only loading screen
const LoadingScreen = dynamic(() => Promise.resolve(LoadingScreenComponent), {
  ssr: false
});

const ScrollIndicator = memo(({ visible }) => (
  <div 
    className={`fixed bottom-8 w-full flex justify-center z-50 transition-opacity duration-500 ${
      visible ? 'opacity-80 hover:opacity-100' : 'opacity-0 pointer-events-none'
    }`}
  >
    <div className="flex flex-col items-center animate-bounce">
      <span className="text-sm text-gray-600 mb-1 text-center px-4">
        Scroll to explore
      </span>
      <svg 
        className="w-5 h-5 text-blue-500" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 14l-7 7m0 0l-7-7m7 7V3" 
        />
      </svg>
    </div>
  </div>
));

const ScrollToTopButton = memo(({ visible, onClick }) => (
  <button
    onClick={onClick}
    className={`fixed bottom-4 right-4 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 z-40 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
    }`}
    aria-label="Scroll to top"
  >
    <svg 
      className="w-5 h-5" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M5 10l7-7m0 0l7 7m-7-7v18" 
      />
    </svg>
  </button>
));

// Custom hooks for real-time loading with improved progress tracking
const useRealTimeLoading = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentComponentIndex, setCurrentComponentIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  
  // Use ref to track the highest progress value reached to prevent going backward
  const highestProgress = useRef(0);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Skip loading if we've already shown it or if using hash navigation
    const hasLoadingBeenShown = sessionStorage.getItem('loadingShown');
    if (hasLoadingBeenShown || window.location.hash) {
      setIsLoading(false);
      setProgress(100);
      return;
    }

    // Create a function to update progress that ensures it never decreases
    const updateProgressSafely = (newValue) => {
      const roundedValue = Math.round(newValue * 10) / 10; // Round to one decimal place
      if (roundedValue > highestProgress.current) {
        highestProgress.current = roundedValue;
        setProgress(roundedValue);
      }
    };

    // Initialize component loading sequence
    const totalWeight = COMPONENTS_TO_LOAD.reduce((sum, comp) => sum + comp.weight, 0);
    let accumulatedProgress = 0;

    // Load components sequentially with realistic timing
    const loadComponents = async () => {
      for (let i = 0; i < COMPONENTS_TO_LOAD.length; i++) {
        const component = COMPONENTS_TO_LOAD[i];
        setCurrentComponentIndex(i);
        
        // Calculate progress increment for this component
        const componentProgressShare = (component.weight / totalWeight) * 85;
        
        // Simulate loading time based on component weight
        const loadTime = component.weight * 40 + 100 + (Math.random() * 150);
        
        // Simulate gradual loading of the component
        const startTime = Date.now();
        const startProgress = accumulatedProgress;
        
        // Create animation frame loop for smooth progress
        await new Promise(resolve => {
          const animateProgress = () => {
            const elapsed = Date.now() - startTime;
            const completion = Math.min(1, elapsed / loadTime);
            
            // Use easeOutQuad for more natural progression
            const eased = 1 - (1 - completion) * (1 - completion);
            const currentComponentProgress = startProgress + (componentProgressShare * eased);
            
            updateProgressSafely(currentComponentProgress);
            
            if (completion < 1) {
              requestAnimationFrame(animateProgress);
            } else {
              accumulatedProgress += componentProgressShare;
              resolve();
            }
          };
          
          animateProgress();
        });
      }
      
      // Final progress animation to 100%
      const startTime = Date.now();
      const startProgress = accumulatedProgress;
      const remainingProgress = 100 - startProgress;
      const finalLoadTime = 300;
      
      await new Promise(resolve => {
        const animateFinalProgress = () => {
          const elapsed = Date.now() - startTime;
          const completion = Math.min(1, elapsed / finalLoadTime);
          
          // Ease out for smooth finish
          const eased = 1 - Math.pow(1 - completion, 3);
          const finalProgress = startProgress + (remainingProgress * eased);
          
          updateProgressSafely(finalProgress);
          
          if (completion < 1) {
            requestAnimationFrame(animateFinalProgress);
          } else {
            setProgress(100);
            setTimeout(() => {
              setIsLoading(false);
              sessionStorage.setItem('loadingShown', 'true');
            }, 200);
            resolve();
          }
        };
        
        animateFinalProgress();
      });
    };

    // Start loading sequence
    loadComponents();
    
    // No cleanup needed for this approach as it resolves naturally
  }, []);

  const currentComponent = 
    currentComponentIndex < COMPONENTS_TO_LOAD.length 
      ? COMPONENTS_TO_LOAD[currentComponentIndex].name 
      : 'Finalizing...';

  return { isLoading, progress, isMounted, currentComponent };
};

// More efficient scroll handling with debouncing
const useScrollState = (isMounted) => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    if (!isMounted) return;
    
    let rafId;
    let lastKnownScrollY = 0;
    let ticking = false;
    
    const handleScroll = () => {
      lastKnownScrollY = window.scrollY;
      
      if (!ticking) {
        rafId = window.requestAnimationFrame(() => {
          setScrollY(lastKnownScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [isMounted]);

  return scrollY;
};

// MainContent as a separate component to prevent unnecessary re-renders
const MainContent = memo(({ scrollY }) => {
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showScrollIndicator = scrollY < 100;
  const showScrollToTop = scrollY > 300;

  return (
    <>
      <Header />
      <main>
        <Banner />
        <About />
        <Workshop />
        <PastEvent />
        <Council />
        
        <ScrollIndicator visible={showScrollIndicator} />
        <ScrollToTopButton visible={showScrollToTop} onClick={scrollToTop} />
      </main>
      <Footer />
    </>
  );
});

export default function Home() {
  const { isLoading, progress, isMounted, currentComponent } = useRealTimeLoading();
  const scrollY = useScrollState(isMounted);
  
  // SSR placeholder
  if (!isMounted) {
    return <div className="min-h-screen bg-black"></div>;
  }

  if (isLoading) {
    return <LoadingScreen progress={progress} currentComponent={currentComponent} />;
  }

  return <MainContent scrollY={scrollY} />;
}

</> */}