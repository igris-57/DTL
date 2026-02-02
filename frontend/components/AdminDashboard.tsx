// frontend/components/AdminDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, AlertTriangle, TrendingUp, Activity,
  Search, Bell, ChevronRight, ArrowUpRight, ArrowDownRight,
  GraduationCap, Calendar, X, Phone, Mail, MapPin, Clock,
  Brain, DollarSign, BookOpen, Heart
} from 'lucide-react';
import {
  ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import {
  getDashboardStats,
  getRiskTrends,
  getTopRiskFactors,
  getRecentAssessments,
  type DashboardStats,
  type TrendDataPoint,
  type RiskFactorSummary,
  type AssessmentSummary
} from '@/lib/api';

const supportServices = [
  {
    id: 'counseling',
    name: 'Counseling',
    icon: Brain,
    color: 'bg-purple-100 text-purple-600',
    title: 'Student Counseling Services',
    description: 'Professional counseling and mental health support for students facing academic stress, personal challenges, or emotional difficulties.',
    contact: {
      office: 'Dean-Student Affairs Office',
      phone: '080-68188128',
      email: 'dean.studentaffairs@rvce.edu.in',
      location: 'Administration Block, RVCE Campus',
      hours: 'Mon-Fri: 9 AM - 4 PM, Sat: 9 AM - 1 PM'
    }
  },
  {
    id: 'financial',
    name: 'Financial Aid',
    icon: DollarSign,
    color: 'bg-green-100 text-green-600',
    title: 'Scholarships & Financial Aid',
    description: 'Merit-based scholarships, fee concessions, SC/ST/OBC scholarships, and financial assistance programs for eligible students.',
    contact: {
      office: 'Scholarship Cell',
      phone: '080-68188100',
      email: 'dean.studentaffairs@rvce.edu.in',
      location: 'Administration Block, RVCE Campus',
      hours: 'Mon-Fri: 9 AM - 4 PM'
    }
  },
  {
    id: 'academic',
    name: 'Academic Support',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-600',
    title: 'Academic Mentoring Programme',
    description: 'Faculty mentorship for academic guidance, study support, and career planning. Connect with your assigned mentor for personalized assistance.',
    contact: {
      office: 'Academic Student Services',
      phone: '080-68188135',
      email: 'academics@rvce.edu.in',
      location: 'Department Office',
      hours: 'Mon-Fri: 9 AM - 4 PM'
    }
  },
  {
    id: 'wellness',
    name: 'Wellness',
    icon: Heart,
    color: 'bg-pink-100 text-pink-600',
    title: 'Student Wellness & Health',
    description: 'Health centre services, wellness programs, and support for physical and mental well-being of students.',
    contact: {
      office: 'RVCE Health Centre',
      phone: '080-68188100',
      email: 'dean.studentaffairs@rvce.edu.in',
      location: 'Health Centre, RVCE Campus',
      hours: 'Mon-Sat: 8 AM - 6 PM'
    }
  },
];

export default function AdminDashboard() {
  // State management
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendDataPoint[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactorSummary[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<typeof supportServices[0] | null>(null);

  // Fetch dashboard data on mount and auto-refresh every 30 seconds
  useEffect(() => {
    async function fetchDashboardData(isInitialLoad = false) {
      try {
        if (isInitialLoad) setLoading(true);
        setError(null);

        const [statsData, trendsData, riskFactorsData, assessmentsData] = await Promise.all([
          getDashboardStats(),
          getRiskTrends('weekly'),
          getTopRiskFactors(5),
          getRecentAssessments(4),
        ]);

        setStats(statsData);
        setTrends(trendsData);
        setRiskFactors(riskFactorsData);
        setRecentAssessments(assessmentsData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        if (isInitialLoad) {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    }

    // Initial fetch
    fetchDashboardData(true);

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboardData(false);
    }, 30000);

    // Cleanup on unmount
    return () => clearInterval(refreshInterval);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] pt-20 pb-8 px-4 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] pt-20 pb-8 px-4 lg:px-8 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded-xl hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Default values if data is missing
  const totalStudents = stats?.totalAssessments || 0;
  const highRiskPercentage = stats?.highRiskPercentage || 0;
  const lowRiskPercentage = stats?.lowRiskPercentage || 0;
  const mediumRiskPercentage = stats?.mediumRiskPercentage || 0;
  return (
    <div className="min-h-screen bg-[#f0f4f8] pt-20 pb-8 px-4 lg:px-8">
      <div className="max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Welcome, Admin</h1>
              <p className="text-gray-500 text-sm">Your student retention dashboard overview</p>
            </div>

          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left Column */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900">Overview</h3>
              </div>

              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-200 via-red-200 to-pink-200 p-1">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <GraduationCap className="w-12 h-12 text-gray-700" />
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h4 className="font-semibold text-gray-900 text-lg">RVCE Admin</h4>
                <p className="text-gray-500 text-sm">Student Retention Manager</p>
              </div>

              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-500">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{totalStudents}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Students</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">{Math.round(lowRiskPercentage)}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Success</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold">{stats?.highRiskCount || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">At Risk</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900">Support Services</h3>
              </div>

              <div className="flex gap-3">
                {supportServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`w-12 h-12 rounded-2xl ${service.color} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
                    title={service.name}
                  >
                    <service.icon className="w-5 h-5" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Center Column */}
          <div className="col-span-12 lg:col-span-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fec8a0 0%, #f8a4b8 50%, #e8b4d0 100%)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-white/80 text-sm font-medium">High Risk</p>
                    <p className="text-white/60 text-xs">Students</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="mt-8">
                  <span className="text-5xl font-bold text-white">{Math.round(highRiskPercentage)}%</span>
                  <p className="text-white/70 text-sm mt-1">of total students</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #a8d4e6 0%, #b8c4e8 50%, #c8d0f0 100%)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-700/80 text-sm font-medium">Low Risk</p>
                    <p className="text-gray-600/60 text-xs">Students</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
                <div className="mt-8">
                  <span className="text-5xl font-bold text-gray-800">{Math.round(lowRiskPercentage)}%</span>
                  <p className="text-gray-600/70 text-sm mt-1">of total students</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900">Risk Trends</h3>
                <p className="text-gray-500 text-sm">Student risk analytics</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="highRisk"
                      stroke="#f87171"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorHigh)"
                      name="High Risk %"
                    />
                    <Area
                      type="monotone"
                      dataKey="lowRisk"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorLow)"
                      name="Low Risk %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="text-sm text-gray-500">High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-500">Low Risk</span>
                </div>
              </div>

              <div className="text-right mt-4">
                <span className="text-4xl font-bold text-gray-800">{Math.round(mediumRiskPercentage)}%</span>
                <p className="text-gray-500 text-sm">Medium Risk</p>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900">Recent Cases</h3>
              </div>

              <div className="space-y-4">
                {recentAssessments.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="text-right min-w-[70px]">
                      <p className="text-xs text-gray-500">{item.date}</p>
                      <p className="text-xs font-medium text-gray-700">{item.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.risk === 'high' ? 'bg-red-400' :
                          item.risk === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                          }`}></span>
                        <span className="text-xs text-gray-500">{item.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>


            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900">Risk Factors</h3>
                <p className="text-gray-500 text-xs">Most common indicators</p>
              </div>

              <div className="space-y-4">
                {riskFactors.map((factor, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{factor.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{factor.percentage}%</span>
                        {factor.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
                        style={{ width: `${factor.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedService(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${selectedService.color} flex items-center justify-center`}>
                  <selectedService.icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedService.title}</h2>
                  <p className="text-sm text-gray-500">{selectedService.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">{selectedService.description}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">{selectedService.contact.office}</p>
                  <p className="text-gray-500">{selectedService.contact.location}</p>
                </div>
              </div>

              <a
                href={`tel:${selectedService.contact.phone}`}
                className="flex items-center gap-3 text-sm p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
              >
                <Phone className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-700">{selectedService.contact.phone}</span>
              </a>

              <a
                href={`mailto:${selectedService.contact.email}`}
                className="flex items-center gap-3 text-sm p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-700">{selectedService.contact.email}</span>
              </a>

              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{selectedService.contact.hours}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
