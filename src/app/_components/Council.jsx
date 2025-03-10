'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Linkedin } from "lucide-react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/autoplay";
import { memo, useCallback, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

// Council members data - kept outside component to prevent re-creation
const councilMembers = [
    {
        name: "Shivani Singh",
        role: "President",
        image: "/assets/Council/Shivani Singh.jpg",
        linkedin: null
    },
    {
        name: "Jai Solanki",
        role: "Vice-President",
        image: "/assets/Council/Jai.JPG",
        linkedin: "https://www.linkedin.com/in/jai-solanki-a84078295"
    },
    {
        name: "Manish Pathak",
        role: "Vice-President",
        image: "/assets/Council/Manish Pathak.jpg",
        linkedin: null
    },
    {
        name: "Shivam Raj Gupta",
        role: "Technical Head",
        image: "/assets/Council/Shivam Raj Gupta.png",
        linkedin: "https://www.linkedin.com/in/shivam-raj-gupta/"
    },
    {
        name: "Keshav",
        role: "Creative Head",
        image: "/assets/Council/keshav.jpg",
        linkedin: "https://www.linkedin.com/in/keshavjangra075?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
    },
    {
        name: "Yugal",
        role: "Secretary",
        image: "/assets/Council/Yugal.jpg",
        linkedin: "https://www.linkedin.com/in/yugalofficial"
    },
    {
        name: "Prateek",
        role: "PR & Social Media Head",
        image: "/assets/Council/Prateek Tiwari.jpg",
        linkedin: "https://www.linkedin.com/in/prateek-tiwari-a01243277?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
    },
    {
        name: "Gaurav Rai",
        role: "PR & Social Media Head",
        image: "/assets/Council/Gaurav.jpg",
        linkedin: "https://www.linkedin.com/in/gaurav-rai-228b32269?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
    }
];

// Optimized blur data URL for image placeholders (smaller SVG)
const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmMWYxZjEiLz48L3N2Zz4=";

// Animation variants - simplified for better performance
const animations = {
    title: {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0, 
            transition: { duration: 0.5 } 
        }
    },
    card: {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { duration: 0.3 } 
        }
    }
};

// LinkedIn button component - memoized
const LinkedInButton = memo(({ url, name }) => {
    if (!url) return null;
    
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-blue-500 hover:text-blue-700 transition-colors"
            aria-label={`LinkedIn profile of ${name}`}
        >
            <Linkedin className="w-5 h-5" />
        </a>
    );
});

LinkedInButton.displayName = 'LinkedInButton';

// MemberCard component - memoized with proper dependency tracking
const MemberCard = memo(({ member, index }) => {
    // Only prioritize loading for the first visible cards
    const isPriority = index < 2;
    
    return (
        <motion.div
            variants={animations.card}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
        >
            <Card className="overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-200 p-0">
                <div className="relative w-full h-[380px]">
                    <Image
                        src={member.image}
                        alt={`${member.name} - ${member.role}`}
                        className="object-cover"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                        loading={isPriority ? "eager" : "lazy"}
                        priority={isPriority}
                        quality={75}
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                    />
                </div>
                <CardContent className="p-4 text-center">
                    <h2 className="text-lg font-bold truncate mb-1">
                        {member.name}
                    </h2>
                    <p className="text-md text-gray-600 mb-2">
                        {member.role}
                    </p>
                    <LinkedInButton url={member.linkedin} name={member.name} />
                </CardContent>
            </Card>
        </motion.div>
    );
});

MemberCard.displayName = 'MemberCard';

// Swiper configuration - defined outside component to prevent recreation
const SWIPER_CONFIG = {
    modules: [Autoplay, EffectCoverflow],
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    loop: true,
    coverflowEffect: {
        rotate: 10,
        depth: 100,
        modifier: 1,
        slideShadows: false,
    },
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
    },
    breakpoints: {
        320: { slidesPerView: 1, spaceBetween: 12 },
        640: { slidesPerView: 2, spaceBetween: 16 },
        768: { slidesPerView: 3, spaceBetween: 24 },
        1024: { slidesPerView: 4, spaceBetween: 24 }
    }
};

// Skeleton loader component for better UX during loading
const CouncilSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
            <div key={index} className="h-[460px] bg-gray-100 animate-pulse rounded-lg" />
        ))}
    </div>
);

const Council = () => {
    // Use a ref to track if component is mounted to prevent hydration issues
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    // Memoize the slider content to prevent unnecessary re-renders
    const renderSlides = useMemo(() => 
        councilMembers.map((member, index) => (
            <SwiperSlide key={member.name} className="h-auto">
                <MemberCard member={member} index={index} />
            </SwiperSlide>
        )),
    []);

    return (
        <section
            id="council"
            className="mb-8 px-4 max-w-[1400px] mx-auto overflow-hidden"
            aria-labelledby="council-heading"
        >
            <motion.h1
                id="council-heading"
                className="text-center text-6xl sm:text-7xl lg:text-9xl font-extrabold text-gray-900 dark:text-white mb-8"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={animations.title}
            >
                Council
            </motion.h1>

            {!isMounted ? (
                <CouncilSkeleton />
            ) : (
                <Swiper {...SWIPER_CONFIG} className="w-full">
                    {renderSlides}
                </Swiper>
            )}
        </section>
    );
};

export default memo(Council);