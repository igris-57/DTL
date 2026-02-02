// frontend/components/ResultsDisplay.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, CheckCircle, AlertCircle, Phone, Mail,
  RefreshCw, Info, Shield, MapPin, Clock, Brain, DollarSign, BookOpen, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskPrediction } from '@/types';

export default function ResultsDisplay() {
  const router = useRouter();
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('prediction');
    if (stored) {
      setPrediction(JSON.parse(stored));
    } else {
      router.push('/assessment');
    }
  }, [router]);

  if (!prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  const riskColors = {
    low: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-200' },
    medium: { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50', border: 'border-yellow-200' },
    high: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50', border: 'border-red-200' },
  };

  const riskIcons = {
    low: CheckCircle,
    medium: AlertCircle,
    high: AlertTriangle,
  };

  const RiskIcon = riskIcons[prediction.riskLevel];
  const colors = riskColors[prediction.riskLevel];

  const supportTypeInfo: Record<string, { icon: string; color: string }> = {
    counseling: { icon: '🧠', color: 'from-purple-500 to-indigo-500' },
    financial: { icon: '💰', color: 'from-green-500 to-emerald-500' },
    academic: { icon: '📚', color: 'from-blue-500 to-cyan-500' },
    health: { icon: '🏥', color: 'from-red-500 to-pink-500' },
    peer: { icon: '👥', color: 'from-orange-500 to-amber-500' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Risk Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className={`p-8 mb-8 text-center relative overflow-hidden ${colors.light} ${colors.border} border-2`}>
            <div className="relative">
              {/* Score Circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className={`w-32 h-32 mx-auto rounded-full ${colors.bg} flex items-center justify-center mb-6 shadow-lg`}
              >
                <span className="text-5xl font-bold text-white">{prediction.riskScore}</span>
              </motion.div>

              {/* Risk Level */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <RiskIcon className={`w-6 h-6 ${colors.text}`} />
                <h2 className={`text-2xl font-bold ${colors.text} capitalize`}>
                  {prediction.riskLevel} Risk
                </h2>
              </div>

              {/* Description */}
              <p className="text-gray-600 max-w-md mx-auto mb-4">
                {prediction.riskLevel === 'low' && "Great news! You're on track. Keep up the good work and stay connected with your support network."}
                {prediction.riskLevel === 'medium' && "There are some areas of concern. We recommend connecting with support services to address these factors early."}
                {prediction.riskLevel === 'high' && "We've identified significant risk factors. Immediate intervention is recommended. Please reach out to our support team."}
              </p>

              {/* Model Confidence */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Info className="w-4 h-4" />
                <span>Model Confidence: {(prediction.modelConfidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Risk Factors */}
        {prediction.riskFactors && prediction.riskFactors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h3 className="text-xl font-semibold mb-4">Identified Risk Factors</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {prediction.riskFactors.map((factor, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <Card className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <Badge
                        variant={factor.impact === 'high' ? 'destructive' : factor.impact === 'medium' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {factor.impact}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900">{factor.factor}</p>
                        <p className="text-sm text-gray-500">{factor.description}</p>
                        <p className="text-xs text-purple-600 mt-1">{factor.category}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Privacy Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Privacy Note:</strong> Your assessment data is kept confidential and is only used to provide personalized support recommendations.
                  Results are not shared without your consent.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* RVCE Support Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold mb-4">RVCE Support Services</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Counseling */}
            <Card className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Student Counseling</h4>
                  <p className="text-sm text-gray-500 mb-2">Dean-Student Affairs Office</p>
                  <a href="tel:080-68188128" className="flex items-center gap-2 text-sm text-green-600 hover:underline">
                    <Phone className="w-4 h-4" /> 080-68188128
                  </a>
                  <a href="mailto:dean.studentaffairs@rvce.edu.in" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1">
                    <Mail className="w-4 h-4" /> dean.studentaffairs@rvce.edu.in
                  </a>
                </div>
              </div>
            </Card>

            {/* Financial Aid */}
            <Card className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Scholarships & Financial Aid</h4>
                  <p className="text-sm text-gray-500 mb-2">Scholarship Cell</p>
                  <a href="tel:080-68188100" className="flex items-center gap-2 text-sm text-green-600 hover:underline">
                    <Phone className="w-4 h-4" /> 080-68188100
                  </a>
                  <a href="mailto:dean.studentaffairs@rvce.edu.in" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1">
                    <Mail className="w-4 h-4" /> dean.studentaffairs@rvce.edu.in
                  </a>
                </div>
              </div>
            </Card>

            {/* Academic Support */}
            <Card className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Academic Mentoring</h4>
                  <p className="text-sm text-gray-500 mb-2">Academic Student Services</p>
                  <a href="tel:080-68188135" className="flex items-center gap-2 text-sm text-green-600 hover:underline">
                    <Phone className="w-4 h-4" /> 080-68188135
                  </a>
                  <a href="mailto:academics@rvce.edu.in" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1">
                    <Mail className="w-4 h-4" /> academics@rvce.edu.in
                  </a>
                </div>
              </div>
            </Card>

            {/* Wellness */}
            <Card className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-6 h-6 text-pink-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Wellness & Health Centre</h4>
                  <p className="text-sm text-gray-500 mb-2">RVCE Health Centre</p>
                  <a href="tel:080-68188100" className="flex items-center gap-2 text-sm text-green-600 hover:underline">
                    <Phone className="w-4 h-4" /> 080-68188100
                  </a>
                  <p className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Clock className="w-4 h-4" /> Mon-Sat: 8 AM - 6 PM
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={() => router.push('/assessment')}
            variant="outline"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake Assessment
          </Button>
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
            onClick={() => window.location.href = 'tel:080-68188128'}
          >
            <Phone className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
