import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react'; // Assuming Loader2 comes from 'lucide-react'

const LoadingScreen: React.FC = () => {
    return (
        <motion.div
            className="flex items-center justify-center h-screen w-screen bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex flex-col items-center">
                <Loader2 className="h-16 w-16 text-[#F97316] animate-spin" />
                <h1 className="mt-4 text-3xl font-bold text-[#F97316]">FitForge</h1>
            </div>
        </motion.div>
    );
};

export default LoadingScreen;
