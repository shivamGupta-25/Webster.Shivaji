"use client";
import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

// Memoize animation configurations
const animations = {
    container: {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } }
    },
    title: {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
        }
    },
    content: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.9, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] } }
    }
};

// Memoized content paragraphs to prevent re-creation on each render
const contentParagraphs = [
    { id: 1, content: "<strong>Websters: The Computer Science Society of Shivaji College</strong>" },
    { id: 2, content: "At Websters, we believe in the power of technology to shape the future, and our mission is to equip students with the knowledge, skills, and opportunities to thrive in this dynamic field. We serve as a vibrant community where students can not only deepen their understanding of computer science but also engage with cutting-edge developments in the tech world. Through a blend of academic events and hands-on activities, we aim to create an environment that sparks curiosity and encourages innovation." },
    { id: 3, content: "Our society is led by a passionate and dedicated student council, which plays a pivotal role in curating and executing a range of events, from expert talks and coding competitions to hackathons and project showcases. These events provide students with the chance to network with industry professionals, gain insights into emerging technologies, and develop practical skills that are essential in today's competitive tech landscape." },
    { id: 4, content: "In addition to skill-building workshops, Websters is also home to a number of collaborative projects that enable students to work together on real-world applications and tech solutions. Whether you're a budding programmer, an aspiring data scientist, or simply someone with an interest in technology, Websters offers a supportive and inspiring space for growth." },
    { id: 5, content: "Join us as we embark on a journey of learning, collaboration, and innovation—together, we can push the boundaries of what's possible and make a lasting impact in the world of technology." }
];

// Memoized paragraph component for better performance
const Paragraph = memo(({ html, className }) => (
    <p className={className} dangerouslySetInnerHTML={{ __html: html }} />
));

Paragraph.displayName = 'Paragraph';

const About = () => {
    const { ref, inView } = useInView({
        threshold: 0.2,
        triggerOnce: true
    });

    return (
        <section
            id="about"
            className="flex items-center justify-center px-6 mb-12 md:px-12 lg:px-20 xl:px-32"
            ref={ref}
        >
            <motion.div
                className="text-center mt-10 md:mt-16"
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                variants={animations.container}
            >
                <motion.h1
                    className="text-6xl sm:text-8xl lg:text-9xl font-extrabold text-gray-900 dark:text-white mb-8"
                    variants={animations.title}
                >
                    About Websters
                </motion.h1>
                <motion.div
                    className="mt-6 md:mt-8 text-gray-600 text-base md:text-lg lg:text-xl max-w-4xl mx-auto"
                    variants={animations.content}
                >
                    {contentParagraphs.map((paragraph) => (
                        <Paragraph
                            key={paragraph.id}
                            html={paragraph.content}
                            className={paragraph.id === 1 ? "" : "mt-4"}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </section>
    );
};

export default memo(About);