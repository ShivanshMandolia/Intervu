// src/components/pages/LandingPage.js
import React, { useState } from 'react';
import { Video, Code, Zap, ArrowRight, CheckCircle, Star, Sparkles, Globe, Cpu } from 'lucide-react';
import Login from '../auth/Login';
import Register from '../auth/Register';

const LandingPage = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [isVisible, setIsVisible] = useState(true);

  if (currentView === 'login') {
    return <Login setCurrentView={setCurrentView} />;
  }

  if (currentView === 'register') {
    return <Register setCurrentView={setCurrentView} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-emerald-200 to-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-emerald-100 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-300 to-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-50 bg-white/60 backdrop-blur-xl border-b border-emerald-200/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="text-2xl font-bold text-slate-800 tracking-tight">
                intervU
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('login')}
                className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-all duration-300 hover:bg-emerald-50 rounded-xl backdrop-blur-sm"
              >
                Sign in
              </button>
              <button
                onClick={() => setCurrentView('register')}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10">Get started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
         
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
              Code Together,
            </span>
            <br />
            <span className="text-slate-800">
              Interview Better
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            The ultimate platform for technical interviews with{' '}
            <span className="text-emerald-600 font-semibold">HD video calls</span>,{' '}
            <span className="text-teal-600 font-semibold">real-time collaboration</span>, and{' '}
            <span className="text-blue-600 font-semibold">instant code execution</span> - all in one seamless experience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              onClick={() => setCurrentView('register')}
              className="group relative px-10 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center">
                Start Interviewing
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </button>
            
            <button className="group px-10 py-5 bg-white/70 backdrop-blur-xl text-slate-800 text-xl font-semibold rounded-2xl border border-emerald-200 hover:bg-white/90 transition-all duration-300 hover:scale-105 flex items-center">
              <Globe className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                Everything You Need
              </span>
              <br />
              <span className="text-slate-800">for Perfect Interviews</span>
            </h2>
            <p className="text-2xl text-slate-600 max-w-3xl mx-auto">
              Built by developers, for developers - with love ❤️
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/50 to-teal-300/50 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-emerald-200 shadow-2xl hover:shadow-emerald-300/50 transition-all duration-500 hover:scale-105 hover:bg-white/80">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">Crystal Clear Video</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Experience ultra-HD video calls with AI-powered noise cancellation and seamless screen sharing.
                </p>
                <div className="space-y-3">
                  {['4K Ultra HD Quality', 'AI Noise Cancellation', 'One-Click Screen Share', 'Multi-Room Support'].map((feature, index) => (
                    <div key={index} className="flex items-center text-slate-600 group-hover:text-slate-800 transition-colors duration-300">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-300/50 to-blue-300/50 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-emerald-200 shadow-2xl hover:shadow-teal-300/50 transition-all duration-500 hover:scale-105 hover:bg-white/80">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Code className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">Live Code Collaboration</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Real-time collaborative coding with intelligent syntax highlighting and smart autocomplete.
                </p>
                <div className="space-y-3">
                  {['50+ Programming Languages', 'Real-Time Synchronization', 'Smart Code Completion', 'Version History'].map((feature, index) => (
                    <div key={index} className="flex items-center text-slate-600 group-hover:text-slate-800 transition-colors duration-300">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-300/50 to-emerald-300/50 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
              <div className="relative bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-emerald-200 shadow-2xl hover:shadow-blue-300/50 transition-all duration-500 hover:scale-105 hover:bg-white/80">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">Lightning Fast Execution</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Instant code compilation and execution with comprehensive debugging and performance metrics.
                </p>
                <div className="space-y-3">
                  {['Sub-Second Compilation', 'Advanced Error Detection', 'Performance Monitoring', 'Memory Usage Tracking'].map((feature, index) => (
                    <div key={index} className="flex items-center text-slate-600 group-hover:text-slate-800 transition-colors duration-300">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/30 via-teal-300/30 to-blue-300/30 rounded-3xl blur-2xl"></div>
            <div className="relative bg-white/60 backdrop-blur-xl rounded-3xl p-12 border border-emerald-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center group">
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    50k+
                  </div>
                  <div className="text-slate-600 group-hover:text-slate-800 transition-colors duration-300">Active Developers</div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    100+
                  </div>
                  <div className="text-slate-600 group-hover:text-slate-800 transition-colors duration-300">Languages Supported</div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    99.99%
                  </div>
                  <div className="text-slate-600 group-hover:text-slate-800 transition-colors duration-300">Uptime Guarantee</div>
                </div>
                <div className="text-center group">
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    24/7
                  </div>
                  <div className="text-slate-600 group-hover:text-slate-800 transition-colors duration-300">Expert Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/40 via-teal-300/40 to-blue-300/40 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-16 border border-emerald-200 shadow-2xl">
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                Ready to Transform
              </span>
              <br />
              <span className="text-slate-800">Your Interviews?</span>
            </h2>
            <p className="text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join the revolution of technical interviews. Experience the future of coding interviews.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
             
              
              <button
                onClick={() => setCurrentView('login')}
                className="group px-12 py-6 bg-white/70 backdrop-blur-xl text-slate-800 text-xl font-bold rounded-2xl border-2 border-emerald-300 hover:bg-white/90 hover:border-emerald-400 transition-all duration-300 hover:scale-105 flex items-center"
              >
                Sign In
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </div>
            
           
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/60 backdrop-blur-xl border-t border-emerald-200 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-8 md:mb-0 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="text-2xl font-bold text-slate-800">intervU</span>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end gap-8 text-slate-600">
              {['Privacy', 'Terms', 'Support', 'Documentation', 'API'].map((link, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="hover:text-slate-800 transition-colors duration-300 hover:scale-105 transform"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-emerald-200 text-center">
            <p className="text-slate-500 text-lg">
              © 2025 intervU. All rights reserved. 
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-semibold">
                {' '}Crafted with ❤️ for developers worldwide.
              </span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

