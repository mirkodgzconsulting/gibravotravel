"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import Image from "next/image"

export function WelcomeLoader() {
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Prevent scrolling while loading
        document.body.style.overflow = "hidden"

        const timer = setTimeout(() => {
            setIsLoading(false)
            document.body.style.overflow = "unset"
        }, 2000)

        return () => {
            clearTimeout(timer)
            document.body.style.overflow = "unset"
        }
    }, [])

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        backgroundColor: "rgba(255, 255, 255, 0)",
                        backdropFilter: "blur(0px)",
                        transition: {
                            duration: 0.8,
                            ease: [0.22, 1, 0.36, 1]
                        }
                    }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-white"
                >
                    <div className="relative flex flex-col items-center">
                        {/* Logo Animation */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{
                                scale: 1,
                                opacity: 1,
                            }}
                            transition={{
                                duration: 0.8,
                                ease: "easeOut"
                            }}
                            className="relative mb-10"
                        >
                            <div className="relative z-10 p-4">
                                <Image
                                    src="/Logo_gibravo.svg"
                                    alt="GiBravo Logo"
                                    width={200}
                                    height={60}
                                    className="h-16 md:h-20 w-auto object-contain"
                                    priority
                                />
                            </div>

                            {/* Decorative Rings */}
                            <motion.div
                                className="absolute inset-0 rounded-full border border-[#004BA5]/10"
                                animate={{
                                    scale: [1, 2],
                                    opacity: [0.6, 0]
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeOut"
                                }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full border border-[#3186FF]/5"
                                animate={{
                                    scale: [1, 2.5],
                                    opacity: [0.4, 0]
                                }}
                                transition={{
                                    duration: 2.5,
                                    delay: 0.8,
                                    repeat: Infinity,
                                    ease: "easeOut"
                                }}
                            />
                        </motion.div>

                        {/* Modern Spinner - Circle Filled Style */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="relative flex items-center justify-center"
                        >
                            <svg
                                className="w-8 h-8 animate-spin"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    className="opacity-20"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="#004BA5"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    className="opacity-100"
                                    d="M12 2C6.47715 2 2 6.47715 2 12"
                                    stroke="#004BA5"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
