'use client';

import React, { useEffect, memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useInView } from 'react-intersection-observer';

// Memoize animation configurations to prevent recreating on each render
const animations = {
  container: {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 1.2, ease: [0.33, 1, 0.68, 1] }
    }
  },
  content: {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 1, ease: [0.33, 1, 0.68, 1] }
    }
  }
};

const Banner = () => {
  const router = useRouter();
  const controls = useAnimation();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  // Start animation when component comes into view
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  // Memoize the router navigation function to prevent recreating on each render
  const handleTechelonsClick = useMemo(() => () => {
    router.push('/techelons');
  }, [router]);

  return (
    <section ref={ref} className="container px-8 mx-auto my-4 mb-12">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-center"
        initial="hidden"
        animate={controls}
        variants={animations.container}
      >
        <motion.div
          className="flex flex-col items-center justify-center text-center w-full md:pl-10"
          variants={animations.content}
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold">Websters</h1>
          <h2 className="text-sm md:text-xl font-normal">
            The Computer Science Society of Shivaji College
          </h2>
          <h3 className="text-xl md:text-2xl">University of Delhi</h3>
          <p className="py-6 text-base md:text-lg max-w-2xl">
            Websters established in 1984, the Department of Computer Science is
            dedicated to fostering academic excellence and intellectual growth.
            It strives to enhance the cognitive aspect of education, ensuring a
            strong foundation for its students.
          </p>
          <Button
            onClick={handleTechelonsClick}
            className="p-6 rounded-[30px] shadow-lg hover:scale-105 transition-all text-lg font-bold tracking-wide mt-4"
          >
            Techelons - 25
          </Button>
        </motion.div>

        <div className="flex items-center justify-center">
          <Image
            alt="Websters Logo"
            src="/assets/webstersLogo.png"
            width={350}
            height={350}
            priority
            className="drop-shadow-[0px_8px_10px_rgba(0,0,0,0.9)]"
            loading="eager"
            sizes="(max-width: 768px) 280px, 350px"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default memo(Banner);