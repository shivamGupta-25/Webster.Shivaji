"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Instagram, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

const Registration = () => {
    const [isExiting, setIsExiting] = useState(false)
    const router = useRouter()

    const handleExit = () => {
        setIsExiting(true)
        setTimeout(() => {
            router.push("/")
        }, 500) // Match animation duration
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
            <AnimatePresence>
                {!isExiting && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white p-8 sm:p-6 rounded-lg shadow-xl max-w-lg md:max-w-md sm:max-w-sm w-full text-center border border-gray-200"
                    >
                        <h1 className="text-3xl sm:text-2xl font-bold mb-4 text-gray-800">
                            Oops! Registration is closed😕
                        </h1>
                        <p className="text-xl sm:text-lg text-gray-600 mb-6">See you next time!</p>

                        <div className="mb-6">
                            <p className="text-gray-700 mb-3">Follow us to never miss an update!</p>
                            <div className="flex justify-center space-x-4">
                                <Link href="https://www.instagram.com/websters.shivaji/" target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="rounded-full hover:bg-purple-100 transition-colors">
                                        <Instagram className="h-5 w-5 sm:h-4 sm:w-4" />
                                    </Button>
                                </Link>
                                <Link href="https://www.linkedin.com/company/websters-shivaji-college/" target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="icon" className="rounded-full hover:bg-indigo-100 transition-colors">
                                        <Linkedin className="h-5 w-5 sm:h-4 sm:w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <Button className="w-full font-semibold sm:text-sm sm:p-2" onClick={handleExit}>
                            Back to Home page
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Registration