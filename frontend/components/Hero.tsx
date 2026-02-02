// frontend/components/Hero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Shield, Users, Brain, TrendingUp, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#f0f4f8]">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'linear-gradient(135deg, #fec8a0 0%, #f8a4b8 100%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'linear-gradient(135deg, #a8d4e6 0%, #c8d0f0 100%)', filter: 'blur(80px)' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white shadow-sm border border-gray-100 text-gray-600 font-medium text-sm mb-8">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-3 h-3 text-white" />
              </div>
              Design Thinking Lab Project - RVCE
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-gray-900">
              Predict.
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                Prevent.
              </span>
              <br />
              Prosper.
            </h1>

            <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-lg">
              An intelligent early warning system that identifies at-risk students
              and connects them with personalized support—before it's too late.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button asChild size="lg"
                className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 hover:opacity-90 text-white text-lg h-14 px-8 rounded-2xl shadow-lg">
                <Link href="/assessment">
                  Take Assessment
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline"
                className="text-lg h-14 px-8 rounded-2xl border-2 border-gray-200 hover:bg-gray-50">
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-12">
              {[
                { value: '87.8%', label: 'Model Accuracy' },
                { value: '0.9211', label: 'AUC-ROC Score' },
                { value: '4.4K', label: 'Students Trained' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Large Gradient Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="col-span-2 p-6 rounded-3xl relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fec8a0 0%, #f8a4b8 50%, #e8b4d0 100%)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">ML Prediction</p>
                    <p className="text-white text-2xl font-bold">Gradient Boosting</p>
                    <p className="text-white/70 text-sm mt-2">87.8% Accuracy, 0.9211 AUC-ROC</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Smaller Cards */}
              {[
                { icon: Users, title: 'Personalized', desc: 'Support matching', gradient: 'linear-gradient(135deg, #a8d4e6 0%, #c8d0f0 100%)' },
                { icon: Shield, title: 'Early Detection', desc: 'Proactive alerts', gradient: 'linear-gradient(135deg, #e0f0e8 0%, #d0e8e0 100%)' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="p-5 rounded-3xl cursor-pointer transition-all hover:shadow-lg"
                  style={{ background: feature.gradient }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center mb-3">
                    <feature.icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-600">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
