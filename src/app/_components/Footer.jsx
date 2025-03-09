"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { motion } from "framer-motion";

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const Footer = () => {
    const [developerInfo, setDeveloperInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchDeveloperInfo = async () => {
            try {
                const response = await fetch("https://credit-api.vercel.app/api/credits", {
                    method: "GET",
                    headers: { "Content-Type": "application/json" }
                });
                if (!response.ok) throw new Error("Failed to fetch developer info");
                const data = await response.json();
                if (isMounted) setDeveloperInfo(data);
            } catch (error) {
                if (isMounted) setError(error.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDeveloperInfo();
        return () => { isMounted = false; };
    }, []);

    return (
        <motion.footer
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="bg-gradient-to-b from-gray-900 to-black text-gray-300 py-10"
        >
            <div className="container mx-auto px-6 lg:px-20 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
                <motion.div variants={fadeInUp} className="flex-shrink-0 flex justify-center md:justify-start">
                    <a href="/" className="flex items-center gap-2">
                        <Image
                            alt="logo"
                            src="/assets/Footer_logo.png"
                            className="h-10 w-auto brightness-110 hover:brightness-125 transition"
                            width={250}
                            height={65}
                        />
                    </a>
                </motion.div>

                <motion.div variants={fadeInUp} className="text-lg text-white font-bold flex flex-col md:flex-row items-center gap-1">
                    <span>Contact:</span>
                    <a href="mailto:websters@shivaji.du.ac.in" className="hover:underline transition text-blue-400">websters@shivaji.du.ac.in</a>
                </motion.div>

                <motion.div variants={fadeInUp} className="flex space-x-6 text-2xl justify-center md:justify-start">
                    <a href="https://www.instagram.com/websters.shivaji/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition transform hover:scale-110 duration-300">
                        <FaInstagram />
                    </a>
                    <a href="https://www.linkedin.com/company/websters-shivaji-college/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition transform hover:scale-110 duration-300">
                        <FaLinkedinIn />
                    </a>
                </motion.div>
            </div>

            {/* //credit section */}

            <motion.div variants={fadeInUp} className="text-center text-sm mt-8 border-t border-gray-700 pt-4 text-gray-500">
                <p className="text-lg">&copy; {new Date().getFullYear()} Websters. All rights reserved.</p>
                {loading ? (
                    <p className="mt-4 text-gray-400 text-lg">Loading developer info...</p>
                ) : error ? (
                    <p className="mt-4 text-red-400 text-lg">{error}</p>
                ) : (
                    developerInfo && (
                        <p className="mt-4 text-gray-400 text-lg">
                            Designed & Developed by: <a href={developerInfo.linkedin} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{developerInfo.credit}</a>
                        </p>
                    )
                )}
            </motion.div>
        </motion.footer>
    );
};

export default Footer;