// frontend/app/about/page.tsx
'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import {
  CheckCircle, Clock, Users, Brain, Shield, TrendingUp,
  Target, Lightbulb, Heart, Rocket
} from 'lucide-react';

export default function AboutPage() {
  const teamMembers = [
    { name: 'Sathvik K Y', usn: '1RV24CS255' },
    { name: 'Sandesh S Patrot', usn: '1RV24CS250' },
    { name: 'Roshan George', usn: '1RV24CS235' },
    { name: 'S Dheeran', usn: '1RV24CS237' },
  ];

  const designThinkingPhases = [
    { phase: 'Empathize', icon: Heart, description: 'Conducted surveys with 45+ students, identified pain points through interviews and empathy maps' },
    { phase: 'Define', icon: Target, description: 'Created POV statement: Students need early personalized intervention because current systems act too late' },
    { phase: 'Ideate', icon: Lightbulb, description: 'Used Brainstorming, SCAMPER, Worst Possible Idea techniques to generate solutions' },
    { phase: 'Prototype', icon: Rocket, description: 'Built ML model with 87.8% accuracy and web dashboard for risk assessment' },
    { phase: 'Test', icon: CheckCircle, description: 'Validated with sample data, iterating based on feedback' },
  ];

  const currentFeatures = [
    'ML-based dropout risk prediction using Gradient Boosting (87.8% accuracy, 0.9211 AUC-ROC)',
    'Multi-factor assessment covering academic, mental, and financial indicators',
    'Real-time risk scoring with model confidence display',
    'Admin analytics dashboard with auto-refresh every 30 seconds',
    'Interactive risk trends chart with weekly data visualization',
    'Integrated RVCE Support Services with real contact information',
    'Clickable phone and email links for immediate support access',
    'Privacy-first approach with honest consent collection',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About This Project
          </h1>
          <p className="text-xl text-gray-600">
            Design Thinking Lab - RV College of Engineering
          </p>
        </motion.div>

        {/* Project Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Overview</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>StudentRetain</strong> is an ML-powered student dropout risk prediction system
              developed as part of the Design Thinking Lab course. The system identifies at-risk
              students early and connects them with personalized support resources before crisis
              situations develop.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our research found that over 90% of students experience academic stress, and 42%
              have considered withdrawing. Traditional support systems often identify problems
              too late. Our solution uses machine learning to predict risk early and enable
              proactive intervention.
            </p>
          </Card>
        </motion.div>

        {/* Design Thinking Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Design Thinking Process</h2>
          <div className="space-y-4">
            {designThinkingPhases.map((item, i) => (
              <motion.div
                key={item.phase}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Card className="p-4 flex items-start gap-4 hover:shadow-lg transition-shadow">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.phase}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Current Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Features</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {currentFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Technical Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Stack</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Frontend</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Next.js 14 with App Router</li>
                  <li>• React 18 with TypeScript</li>
                  <li>• Tailwind CSS + shadcn/ui</li>
                  <li>• Framer Motion for animations</li>
                  <li>• Recharts for data visualization</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Backend & ML</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• FastAPI (Python)</li>
                  <li>• scikit-learn Gradient Boosting</li>
                  <li>• Grid Search optimization</li>
                  <li>• 5-fold cross-validation</li>
                  <li>• Kaggle dataset (4,424 students)</li>
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>



        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Team</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {teamMembers.map((member, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-500">{member.usn}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
