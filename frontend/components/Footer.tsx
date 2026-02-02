// frontend/components/Footer.tsx
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">StudentRetain</span>
            </div>
            <p className="text-gray-400 mb-4">
              ML-powered student dropout risk prediction system with personalized support recommendations.
              A Design Thinking Lab project by RV College of Engineering students.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/" className="hover:text-purple-400 transition-colors">Home</Link></li>
              <li><Link href="/assessment" className="hover:text-purple-400 transition-colors">Take Assessment</Link></li>
              <li><Link href="/dashboard" className="hover:text-purple-400 transition-colors">Dashboard</Link></li>
              <li><Link href="/about" className="hover:text-purple-400 transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Team */}
          <div>
            <h3 className="font-semibold mb-4">Team</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Sathvik K Y</li>
              <li>Sandesh S Patrot</li>
              <li>Roshan George</li>
              <li>S Dheeran</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2026 Design Thinking Lab Project - RV College of Engineering
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">
            Built with Next.js, FastAPI & Gradient Boosting ML
          </p>
        </div>
      </div>
    </footer>
  );
}
