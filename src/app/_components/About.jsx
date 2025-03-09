"use client";
import React from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const About = () => {
    const { ref, inView } = useInView({
        threshold: 0.2,
        triggerOnce: true
    });

    const smoothEasing = [0.25, 0.1, 0.25, 1];

    return (
        <section
            id="about"
            className="flex items-center justify-center px-6 mb-12 md:px-12 lg:px-20 xl:px-32"
            ref={ref}
        >
            <motion.div
                className="text-center mt-10 md:mt-16"
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                    duration: 0.7,
                    ease: smoothEasing
                }}
            >
                <motion.h1
                    className="text-6xl sm:text-8xl lg:text-9xl font-extrabold text-gray-900 dark:text-white mb-8"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ amount: 0.5 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                >
                    About Websters
                </motion.h1>
                <motion.div
                    className="mt-6 md:mt-8 text-gray-600 text-base md:text-lg lg:text-xl max-w-4xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{
                        duration: 0.9,
                        delay: 0.4,
                        ease: smoothEasing
                    }}
                >
                    <p><strong>Websters: The Computer Science Society of Shivaji College</strong></p>
                    <p className="mt-4">
                        At Websters, we believe in the power of technology to shape the future, and our mission is to equip students with the knowledge, skills, and opportunities to thrive in this dynamic field. We serve as a vibrant community where students can not only deepen their understanding of computer science but also engage with cutting-edge developments in the tech world. Through a blend of academic events and hands-on activities, we aim to create an environment that sparks curiosity and encourages innovation.
                    </p>
                    <p className="mt-4">
                        Our society is led by a passionate and dedicated student council, which plays a pivotal role in curating and executing a range of events, from expert talks and coding competitions to hackathons and project showcases. These events provide students with the chance to network with industry professionals, gain insights into emerging technologies, and develop practical skills that are essential in today's competitive tech landscape.
                    </p>
                    <p className="mt-4">
                        In addition to skill-building workshops, Websters is also home to a number of collaborative projects that enable students to work together on real-world applications and tech solutions. Whether you're a budding programmer, an aspiring data scientist, or simply someone with an interest in technology, Websters offers a supportive and inspiring space for growth.
                    </p>
                    <p className="mt-4">
                        Join us as we embark on a journey of learning, collaboration, and innovation—together, we can push the boundaries of what's possible and make a lasting impact in the world of technology.
                    </p>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default About;