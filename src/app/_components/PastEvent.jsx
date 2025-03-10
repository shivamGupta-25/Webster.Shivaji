"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Autoplay } from "swiper/modules";
import Image from "next/image";
import { motion } from "framer-motion";
import "swiper/css";
import "swiper/css/effect-cards";
import React from "react";

// Slides data defined outside component to prevent recreation on each render
const SLIDES = [
  { title: "UI/UX Workshop", imageUrl: "/assets/Events/UI-UX_Workshop.png" },
  { title: "AI Artistry-23", imageUrl: "/assets/Events/AI_Artistry_23.jpg" },
  { title: "AI Artistry-24", imageUrl: "/assets/Events/AI_Artistry_24.jpg" },
  { title: "Dark Coding-23", imageUrl: "/assets/Events/DarkCoding_23.jpg" },
  { title: "Dark Coding-24", imageUrl: "/assets/Events/DarkCoding_24.jpg" },
  { title: "E-Lafda-24", imageUrl: "/assets/Events/E-Lafda_24.jpg" },
  { title: "Git & GitHub Workshop", imageUrl: "/assets/Events/Git_GitHub.jpg" },
  { title: "Googler-23", imageUrl: "/assets/Events/Googler_23.jpg" },
  { title: "Googler-24", imageUrl: "/assets/Events/Googler_24.jpg" },
  { title: "Techelons-23", imageUrl: "/assets/Events/Techelons_23.jpg" },
  { title: "Techelons-24", imageUrl: "/assets/Events/Techelons_24.jpg" },
  { title: "TechnoQuiz-24", imageUrl: "/assets/Events/TechnoQuiz_24.jpg" },
  { title: "Web Hive-23", imageUrl: "/assets/Events/Web_Hive_23.jpg" },
  { title: "Whatzapper-23", imageUrl: "/assets/Events/Whatzapper_23.jpg" }
];

// Memoized heading component to prevent re-renders
const SectionHeading = React.memo(() => (
  <motion.h1
    className="flex justify-center items-center text-6xl sm:text-8xl lg:text-9xl font-extrabold text-gray-900 dark:text-white mb-8"
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ amount: 0.5, once: true }}
    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
  >
    Past Event
  </motion.h1>
));

SectionHeading.displayName = 'SectionHeading';

const PastEvent = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Properly implemented resize handler with useCallback
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth < 640);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    
    // Set initial state
    handleResize();
    
    // Proper debounce implementation
    let timeoutId;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    
    // Clean up
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, [handleResize]);

  // Memoized autoplay config
  const autoplayConfig = useMemo(() => ({
    delay: isMobile ? 2500 : 3000,
    disableOnInteraction: false
  }), [isMobile]);

  // Only render content client-side to prevent hydration issues
  if (!isMounted) return null;

  return (
    <section
      id="pastevent"
      className="mb-8 sm:py-16 md:py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden"
    >
      <SectionHeading />

      <div className="flex justify-center overflow-hidden">
        <div className="w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
          <Swiper
            effect="cards"
            grabCursor={true}
            modules={[EffectCards, Autoplay]}
            className="aspect-[16/9] rounded-xl"
            loop={true}
            autoplay={autoplayConfig}
            speed={800}
            cardsEffect={{
              slideShadows: false,
              perSlideOffset: 8,
              perSlideRotate: 2,
              rotate: true,
            }}
          >
            {SLIDES.map((slide, index) => (
              <SwiperSlide key={slide.title} className="rounded-xl shadow-lg overflow-hidden bg-gray-800">
                <div className="relative w-full h-full">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 480px) 280px, (max-width: 640px) 320px, (max-width: 768px) 384px, (max-width: 1024px) 448px, 576px"
                    priority={index < 1} // Only prioritize the first image
                    loading={index < 1 ? "eager" : "lazy"}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgdmlld0JveD0iMCAwIDcwMCA0NzUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzMzMzMzMyIgLz4KPC9zdmc+"
                  />
                  <div className="absolute inset-0 flex items-end">
                    <div className="w-full items-center bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 xs:p-4 sm:p-5">
                      <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white line-clamp-2">{slide.title}</h2>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 text-center">
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hidden sm:block">
          Swipe to navigate through our past events
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 sm:hidden">
          Swipe to view more events
        </p>
      </div>
    </section>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(PastEvent);