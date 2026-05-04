import React from "react";
import { UserCircle, Stethoscope, Brain, Clock, Heart, Shield } from 'lucide-react';
import { Header } from "../components/Header";

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
        { icon: Brain, title: 'AI Triage', description: 'Smart symptom analysis' },
        { icon: Clock, title: 'Virtual Queue', description: 'Real-time wait updates' },
        { icon: Heart, title: 'Find Facilities', description: 'Nearest care centers' },
        { icon: Shield, title: 'QR Records', description: 'Secure medical data' },
    ];
    const currentSize = sizes["lg"];
    return (
        <>
            <Header />

            <main className="Main_Body relative w-full min-h-screen text-black dark:text-black overflow-y-auto bg-gray-50">
                <section className="max-w-6xl mx-auto px-6 py-16">
                    <div className="flex flex-col items-center text-center">
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
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2  gap-2 w-auto mx-auto">
                        <a href="#patient" className="group md:ml-30 block p-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transform-gpu hover:-translate-y-1 transition">
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="bg-white p-4 rounded-lg">
                                    <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">I'm a Patient</h2>
                                    <p className="text-sm opacity-90 mt-1">Get AI triage & book appointments</p>
                                </div>
                            </div>
                        </a>

                        <a href="#provider" className="group block md:mr-30 p-10 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg transform-gpu hover:-translate-y-1 transition">
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="bg-white p-4 rounded-lg">
                                    <Stethoscope className="w-10 h-10 sm:w-12 sm:h-12 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Healthcare Provider</h2>
                                    <p className="text-sm opacity-90 mt-1">Manage queue & patient records</p>
                                </div>
                            </div>
                        </a>
                    </div>

                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title} className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm justify-center items-center text-center">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{feature.title}</h4>
                                    <p className="text-gray-600 text-xs sm:text-sm">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </section>
                <section className="px-4 sm:px-6 py-8 sm:py-12 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
                            Priority System
                        </h3>
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-lg">
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
                            </div>

                            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-5 text-white shadow-lg">
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
                            </div>

                            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
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
                            </div>
                        </div>
                    </div>
                </section>

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