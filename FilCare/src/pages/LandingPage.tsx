import { UserCircle, Stethoscope, Brain, Clock, Heart, Shield } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { Header } from "../components/Header";
import { Link } from "react-router-dom";

function LandingPage() {
    const sizes = {
        sm: {
            container: 'w-8 h-8',
            pulse: 'w-5 h-5',
            text: 'text-base',
            heart: 'w-3 h-3',
            subtext: 'text-xs',
        },
        md: {
            container: 'w-10 h-10',
            pulse: 'w-6 h-6',
            text: 'text-lg sm:text-xl',
            heart: 'w-4 h-4',
            subtext: 'text-xs',
        },
        lg: {
            container: 'w-16 h-16',
            pulse: 'w-10 h-10',
            text: 'text-2xl sm:text-3xl',
            heart: 'w-5 h-5',
            subtext: 'text-sm',
        },
    };
    const features = [
        { icon: Brain, title: 'AI Triage', description: 'Smart symptom analysis', color: 'from-purple-50 to-purple-100', iconColor: 'purple' },
        { icon: Clock, title: 'Virtual Queue', description: 'Real-time wait updates', color: 'from-blue-50 to-blue-100', iconColor: 'blue' },
        { icon: Heart, title: 'Find Facilities', description: 'Nearest care centers', color: 'from-green-50 to-green-100', iconColor: 'green' },
        { icon: Shield, title: 'QR Records', description: 'Secure medical data', color: 'from-yellow-50 to-yellow-100', iconColor: 'yellow' },
    ];
    const priorityVariants: Variants = {
        hidden: { opacity: 0, y: 28 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.7,
                staggerChildren: 0.14,
            },
        },
    };
    const priorityItemVariants: Variants = {
        hidden: { opacity: 0, y: 24, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1 },
    };
    const currentSize = sizes["lg"];
    return (
        <>
            <Header />

            <main className="Main_Body relative w-full min-h-screen text-black dark:text-black overflow-y-auto bg-gray-50">
                <motion.section
                    className="max-w-6xl mx-auto px-6 py-16"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeIn' }}
                >
                    <motion.div
                        className="flex flex-col items-center text-center"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: 'easeIn', delay: 0.1 }}
                    >
                        <div className="mb-6">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-white">

                                <svg className={`${currentSize.pulse} text-white drop-shadow-lg ml-2`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 12h2l2-6 4 12 2-6h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>

                            </div>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
                            Healthcare Access, <span className="text-blue-600">Reimagined</span>
                        </h1>
                        <p className="mt-4 text-gray-500 max-w-2xl">
                            Skip the wait. AI-powered triage. Find care instantly.
                        </p>
                    </motion.div>

                    <motion.div
                        className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-2 w-auto mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, ease: 'easeIn', delay: 0.15 }}
                    >
                        <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2, ease: 'easeIn' }} className="md:ml-30">
                            <Link to="/patient" className="group block p-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transform-gpu hover:-translate-y-1 transition">
                                <div className="flex flex-col items-center gap-6 text-center">
                                    <div className="bg-white p-4 rounded-lg">
                                        <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">I'm a Patient</h2>
                                        <p className="text-sm opacity-90 mt-1">Get AI triage & book appointments</p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.2, ease: 'easeIn' }} className="md:mr-30">
                            <Link to="/provider" className="group block p-10 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg transform-gpu hover:-translate-y-1 transition">
                                <div className="flex flex-col items-center gap-6 text-center">
                                    <div className="bg-white p-4 rounded-lg">
                                        <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">Healthcare Provider</h2>
                                        <p className="text-sm opacity-90 mt-1">Manage queue & patient records</p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, ease: 'easeIn', delay: 0.25 }}
                    >
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            const cardColor = feature.color;
                            const iconColor = feature.iconColor;

                            return (

                                <div key={feature.title} className={`bg-gradient-to-br ${cardColor} p-6 rounded-xl`}>
                                    <Icon className={`h-10 w-10 text-${iconColor}-600 mb-3`} />
                                    <h3 className="font-bold text-gray-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-gray-700">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </motion.div>
                </motion.section>
                <motion.section
                    className="px-4 sm:px-6 py-8 sm:py-12 bg-white"
                    variants={priorityVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.35 }}
                >
                    <div className="max-w-7xl mx-auto">
                        <motion.h3
                            className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-8"
                            variants={priorityItemVariants}
                        >
                            Priority System
                        </motion.h3>
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <motion.div
                                variants={priorityItemVariants}
                                transition={{ duration: 0.45, ease: 'easeIn' }}
                                className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-600 font-bold text-lg">
                                        P1
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Immediate</h4>
                                        <p className="text-sm text-red-100">Critical Emergency</p>
                                    </div>
                                </div>
                                <p className="text-sm text-red-50 mb-2">
                                    Chest pain, severe bleeding, difficulty breathing
                                </p>
                                <p className="text-sm font-semibold">
                                    → Direct ER routing + Alert
                                </p>
                            </motion.div>

                            <motion.div
                                variants={priorityItemVariants}
                                transition={{ duration: 0.45, ease: 'easeIn' }}
                                className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-5 text-white shadow-lg"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-yellow-600 font-bold text-lg">
                                        P2
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Urgent</h4>
                                        <p className="text-sm text-yellow-100">Serious but Stable</p>
                                    </div>
                                </div>
                                <p className="text-sm text-yellow-50 mb-2">
                                    High fever, deep laceration, persistent vomiting
                                </p>
                                <p className="text-sm font-semibold">
                                    → Booking within 1-2 hours
                                </p>
                            </motion.div>

                            <motion.div
                                variants={priorityItemVariants}
                                transition={{ duration: 0.45, ease: 'easeIn' }}
                                className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-600 font-bold text-lg">
                                        P3
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">Non-Urgent</h4>
                                        <p className="text-sm text-green-100">Routine Care</p>
                                    </div>
                                </div>
                                <p className="text-sm text-green-50 mb-2">
                                    Cough, cold, prescription refill, mild rash
                                </p>
                                <p className="text-sm font-semibold">
                                    → Telemedicine or next-day slot
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* Footer */}
                <footer className="bg-gray-900 text-white py-6 sm:py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                        <p className="text-gray-400 text-sm">
                            &copy; 2026 FilCare. Revolutionizing Healthcare Access.
                        </p>
                    </div>
                </footer>
            </main>
        </>
    );
}

export default LandingPage;