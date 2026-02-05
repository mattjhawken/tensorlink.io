import { useChatSettings } from '../hooks/useChatSettings'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MdNetworkCheck, 
  MdVerifiedUser, 
  MdOutlineSettings, 
  MdAccountBalanceWallet, 
  MdAssessment 
} from 'react-icons/md'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ApiService } from '../services'
import ModelDemand from './ModelDemand'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Utility functions
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function toSignificantDigits(num: number, digits: number) {
  if (num === 0) return 0
  const d = Math.ceil(Math.log10(num < 0 ? -num : num))
  const power = digits - d
  const magnitude = Math.pow(10, power)
  return Math.round(num * magnitude) / magnitude
}

// Home view component
export const HomeView = () => {
  const {
    availableModels,
    tensorlinkStats,
    getTensorlinkStats,
  } = useChatSettings()
  const [networkHistory, setNetworkHistory] = useState<any>(null)
  const [modelDemand, setModelDemand] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  )

  // Detect dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  // Fetch network data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [history, demand] = await Promise.all([
          ApiService.getNetworkHistory(90),
          ApiService.getModelDemand(),
        ])
        await getTensorlinkStats()
        setNetworkHistory(history)
        setModelDemand(demand)
      } catch (error) {
        console.error('Error fetching network data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Chart data generators
  const getCapacityChartData = () => {
    if (!networkHistory) return null
    const { labels, datasets } = networkHistory.daily

    const freeCapacity = datasets.total_capacity.map(
      (total: number, index: number) => total - datasets.used_capacity[index]
    )

    return {
      labels: labels.map((date: string) => {
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      datasets: [
        {
          label: 'Used Capacity',
          data: datasets.used_capacity,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Free Capacity',
          data: freeCapacity,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }

  const getParticipantsChartData = () => {
    if (!networkHistory) return null
    const { labels, datasets } = networkHistory.daily

    return {
      labels: labels.map((date: string) => {
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      datasets: [
        {
          label: 'Workers',
          data: datasets.workers,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Validators',
          data: datasets.validators,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }

  const getJobsChartData = () => {
    if (!networkHistory) return null
    const { labels, datasets } = networkHistory.daily

    return {
      labels: labels.map((date: string) => {
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }),
      datasets: [
        {
          label: 'Jobs',
          data: datasets.jobs,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          boxWidth: 6,
          boxHeight: 6,
          font: { size: 12 },
          color: 'white',
        },
      },
      title: {
        display: true,
        align: 'start' as const,
        padding: { top: 5, bottom: 15 },
        font: {
          size: 17,
          weight: 'bold' as const,
        },
        color: 'white',
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          display: true,
          color: 'rgba(255, 255, 255, 0.6)',
          font: { size: 11 },
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          display: true,
          color: 'rgba(255, 255, 255, 0.6)',
          font: { size: 11 },
        },
      },
    },
    elements: {
      point: {
        radius: 2,
        hoverRadius: 5,
      },
    },
    animation: {
      duration: 1200,
      easing: 'easeInOutQuart' as const,
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  const summaryCards = tensorlinkStats && [
    {
      title: 'Workers',
      amount: tensorlinkStats.workers,
      icon: <MdOutlineSettings />,
      iconColor: '#ffffff',
      iconBg: 'linear-gradient(135deg, #2a6aa0 0%, #1e4d75 100%)',
      accentColor: 'from-blue-500/10 to-blue-600/10',
    },
    {
      title: 'Validators',
      amount: tensorlinkStats.validators,
      icon: <MdVerifiedUser />,
      iconColor: '#ffffff',
      iconBg: 'linear-gradient(135deg, #aaaaaa 0%, #888888 100%)',
      accentColor: 'from-gray-500/10 to-gray-600/10',
    },
    {
      title: 'Jobs',
      amount: networkHistory?.summary?.current?.jobs || 0,
      icon: <MdAccountBalanceWallet />,
      iconColor: '#ffffff',
      iconBg: 'linear-gradient(135deg, #1f1f1f 0%, #000000 100%)',
      accentColor: 'from-slate-500/10 to-slate-600/10',
    },
    {
      title: 'Capacity',
      amount: formatBytes(
        toSignificantDigits(
          tensorlinkStats.available_capacity + tensorlinkStats.used_capacity,
          3
        )
      ),
      icon: <MdAssessment />,
      iconColor: '#ffffff',
      iconBg: 'linear-gradient(135deg, #5BC34A 0%, #45a036 100%)',
      accentColor: 'from-green-500/10 to-green-600/10',
    },
  ]

  const capacityChartData = getCapacityChartData()
  const participantsChartData = getParticipantsChartData()
  const jobsChartData = getJobsChartData()

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">tensorlink.io</h2>
        <p className="text-white/60">Decentralized AI Network</p>
      </div>

      {/* Network Summary Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full mb-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group relative"
            >
              <div className="relative flex flex-col bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Gradient overlay on hover */}
                {summaryCards && (
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${summaryCards[index].accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                  />
                )}

                <div className="relative flex items-center justify-between p-2">
                  <AnimatePresence mode="wait">
                    {!summaryCards ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 animate-pulse" />
                        <div className="flex flex-col items-end space-y-2">
                          <div className="w-12 h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                          <div className="w-16 h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="loaded"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center justify-between w-full"
                      >
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          style={{
                            background: summaryCards[index].iconBg,
                          }}
                          className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-md border border-white/20 dark:border-white/10"
                        >
                          <span
                            className="text-base sm:text-lg"
                            style={{ color: summaryCards[index].iconColor }}
                          >
                            {summaryCards[index].icon}
                          </span>
                        </motion.div>

                        <div className="flex flex-col items-end">
                          <motion.span
                            className="text-md sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-none"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: index * 0.08 + 0.2,
                              type: 'spring',
                              stiffness: 200,
                            }}
                          >
                            {summaryCards[index].amount}
                          </motion.span>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-none mt-0">
                            {summaryCards[index].title}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="border border-gray-400 dark:border-gray-700 rounded-xl p-4 bg-neutral-50 dark:bg-zinc-900 shadow-sm">
        {/* Available Models List */}
        <ModelDemand 
          modelDemandData={modelDemand} 
          loading={loading}
          error={null}
        />

        {/* Charts Grid */}
        <h3 className="text-lg pt-3 font-semibold mb-3 text-neutral-800 dark:text-white">
            Network Statistics
        </h3>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <motion.div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {/* Network Participants Chart */}
            {participantsChartData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-3 shadow-lg border-2 border-neutral-400 dark:border-neutral-700 h-[370px]"
              >
                <Line
                  data={participantsChartData}
                  options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Network Participants' } } }}
                />
              </motion.div>
            )}

            {/* Jobs Chart */}
            {jobsChartData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-3 shadow-lg border-2 border-neutral-400 dark:border-neutral-700 h-[370px]"
              >
                <Line
                  data={jobsChartData}
                  options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Jobs' } } }}
                />
              </motion.div>
            )}

            {/* Capacity Chart */}
            {capacityChartData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-3 shadow-lg border-2 border-neutral-400 dark:border-neutral-700 h-[370px]"
              >
                <Line
                  data={capacityChartData}
                  options={{ ...chartOptions, plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'GPU Capacity' } } }}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6"
        >
          <h3 className="text-lg font-semibold mb-3 text-neutral-800 dark:text-white">
            Quick Actions
          </h3>
          <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
            <button
              onClick={() =>
                (window.location.href = 'https://www.smartnodes.ca/tensorlink')
              }
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-md text-sm transition-colors text-left"
            >
              📚 Visit Tensorlink Documentation
            </button>
            <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-md text-sm transition-colors text-left">
              💬 Join Community Discord
            </button>
            <button className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-md text-sm transition-colors text-left">
              🔧 Troubleshooting Guide
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
