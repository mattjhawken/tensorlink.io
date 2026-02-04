import React from 'react'
import { MessageSquare, Network, Coins, Shield, Zap, ChevronRight } from "lucide-react"
import { smallLogoSrc } from '../assets'

export const HomePage: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto sm:px-4 px-2 py-6">
      <div className="relative">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                tensorlink.io
              </h1>
              <img src={smallLogoSrc} alt="task" className="w-[60px] h-[60px] md:hidden mb-1 my-1.5" />
              <span className="hidden sm:inline-block px-2 py-1 text-xs bg-blue-600/20 border border-blue-500/30 rounded text-blue-400 font-medium">
                Beta
              </span>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto space-y-16 py-8 pb-16">
          
          {/* Hero Section */}
          <div className="relative px-6 pt-12 pb-16 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl border border-white/10 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse"></div>
            
            <div className="relative max-w-4xl mx-auto text-center space-y-6">
              <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-gray-100 leading-tight">
                AI-Powered Tools Built on
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Peer-to-Peer Infrastructure
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
                Access powerful AI tools while maintaining privacy, or run a node to earn rewards and contribute compute to the decentralized network.
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <button 
                  className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <MessageSquare size={20} />
                  Start Chatting
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                
                <a href="/tensorlink/docs" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl border-2 border-zinc-700 hover:border-zinc-600 transition-all duration-300 transform hover:scale-105">
                    Learn More
                  </button>
                </a>
                
                <a href="https://discord.com/invite/aCW2kTNzJ2" target="_blank" rel="noopener noreferrer">
                  <button className="px-6 py-3 bg-indigo-700 hover:bg-indigo-600 text-white font-semibold rounded-xl border-2 border-indigo-600 hover:border-indigo-500 transition-all duration-300 transform hover:scale-105">
                    Join Discord
                  </button>
                </a>
              </div>
            </div>
          </div>

          {/* Value Proposition - Two Paths */}
          <div className="px-6">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-100">Choose Your Path</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Use AI Tools */}
              <div className="group relative bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-2xl p-8 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/20 cursor-pointer">
                <div className="absolute top-4 right-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                    <MessageSquare className="text-blue-400" size={24} />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-gray-100">Use AI Tools</h3>
                <p className="text-gray-300 mb-6">
                  Access powerful AI chat, code assistance, and productivity tools with privacy-enhancing features built in.
                </p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <Shield className="text-blue-400 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-300 text-sm">Optional local node for input data obfuscation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="text-blue-400 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-300 text-sm">Fast, reliable AI powered by distributed infrastructure</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Network className="text-blue-400 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-300 text-sm">Seamless experience with decentralized benefits</span>
                  </li>
                </ul>
                
                <div className="flex items-center gap-2 text-blue-400 font-medium group-hover:gap-3 transition-all">
                  Get Started <ChevronRight size={18} />
                </div>
              </div>

              {/* Run a Node */}
              <div className="group relative bg-gradient-to-br from-purple-900/30 to-pink-800/20 rounded-2xl p-8 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/20">
                <div className="absolute top-4 right-4">
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                    <Coins className="text-purple-400" size={24} />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-gray-100">Run a Node</h3>
                <p className="text-gray-300 mb-6">
                  Contribute your GPU to the network, power AI workloads, and earn rewards while supporting decentralized AI.
                </p>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <Coins className="text-purple-400 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-300 text-sm">Earn rewards by serving AI models</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Network className="text-purple-400 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-300 text-sm">Connect your device to your ML workflows</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="text-purple-400 mt-1 flex-shrink-0" size={18} />
                    <span className="text-gray-300 text-sm">Enhanced privacy with local compute</span>
                  </li>
                </ul>
                
                <a href="/tensorlink/docs/nodes" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-400 font-medium group-hover:gap-3 transition-all">
                  Learn About Nodes <ChevronRight size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* Core Features */}
          <div className="px-6" id="features">
            <h2 className="text-3xl font-bold text-center mb-10 text-gray-100">Why Tensorlink?</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              
              <div className="bg-zinc-800/50 rounded-xl p-6 border border-white/10 hover:border-blue-400/30 transition-all hover:shadow-lg hover:shadow-blue-600/10">
                <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
                  <Shield className="text-blue-400" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-100">Privacy First</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Your data stays yours. Run a local node for input obfuscation or use the network with built-in privacy features.
                </p>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-6 border border-white/10 hover:border-purple-400/30 transition-all hover:shadow-lg hover:shadow-purple-600/10">
                <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4 border border-purple-500/30">
                  <Network className="text-purple-400" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-100">Decentralized</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Powered by peer-to-peer infrastructure. No single point of failure, no centralized control.
                </p>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-6 border border-white/10 hover:border-pink-400/30 transition-all hover:shadow-lg hover:shadow-pink-600/10">
                <div className="w-14 h-14 bg-pink-600/20 rounded-xl flex items-center justify-center mb-4 border border-pink-500/30">
                  <Coins className="text-pink-400" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-100">Earn & Contribute</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Run a node to earn rewards while powering the network. Your compute helps others while generating value.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="px-6">
            <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-2xl p-10 border border-white/10 max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center text-gray-100">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto border-2 border-blue-500/50 shadow-lg shadow-blue-600/20">
                    <span className="text-3xl font-bold text-blue-400">1</span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-100">Connect</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Access the platform instantly or optionally run your own node for enhanced privacy and to earn rewards
                  </p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto border-2 border-purple-500/50 shadow-lg shadow-purple-600/20">
                    <span className="text-3xl font-bold text-purple-400">2</span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-100">Build & Chat</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Use AI tools for chat, coding, analysis, and more—all powered by distributed infrastructure
                  </p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="bg-gradient-to-br from-pink-600/20 to-pink-700/20 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto border-2 border-pink-500/50 shadow-lg shadow-pink-600/20">
                    <span className="text-3xl font-bold text-pink-400">3</span>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-100">Own Your Experience</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Full control over your data, conversations, and privacy settings. Export and manage everything locally
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <div className="bg-zinc-800/30 rounded-xl p-6 border border-white/5 text-center hover:border-blue-400/20 transition-all">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">100%</div>
                <div className="text-sm text-gray-400">Privacy Focused</div>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-6 border border-white/5 text-center hover:border-purple-400/20 transition-all">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">P2P</div>
                <div className="text-sm text-gray-400">Decentralized</div>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-6 border border-white/5 text-center hover:border-pink-400/20 transition-all">
                <div className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent mb-2">∞</div>
                <div className="text-sm text-gray-400">Unlimited Chats</div>
              </div>
              <div className="bg-zinc-800/30 rounded-xl p-6 border border-white/5 text-center hover:border-green-400/20 transition-all">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-2">Earn</div>
                <div className="text-sm text-gray-400">Run & Reward</div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="px-6">
            <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl p-10 border border-white/10 text-center max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4 text-gray-100">Ready to Get Started?</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join the decentralized AI revolution. Start using powerful AI tools today or contribute compute to earn rewards.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-600/30"
                >
                  Start Chatting Now
                </button>
                <a href="/tensorlink/docs/nodes" target="_blank" rel="noopener noreferrer">
                  <button className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl border-2 border-zinc-700 hover:border-zinc-600 transition-all duration-300 transform hover:scale-105">
                    Learn About Running Nodes
                  </button>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
