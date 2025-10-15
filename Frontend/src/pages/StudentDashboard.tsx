import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Sun,
  Moon,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  CalendarDays,
  MessageSquare,
  Megaphone,
  BookOpen,
  Bell,
} from "lucide-react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Student {
  name: string;
  email: string;
  department: string;
  semester: string;
  rollNo: string;
  profileImage?: string;
}

const StudentDashboard: React.FC = () => {
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("");

  useEffect(() => {
    setStudentData({
      name: "Sadia Naz",
      email: "sadianaz123@gmail.com",
      department: "Information Technology",
      semester: "7th Semester",
      rollNo: "BSIT-2021-45",
      profileImage:
        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
    });

    setAiFeedback(
      "Your performance is on a positive trend! Keep up with your coding projects and teamwork activities."
    );
  }, []);

  const handleLogout = () => {
    alert("You have been logged out successfully!");
  };

  const modules = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Results", icon: <GraduationCap size={18} /> },
    { name: "Attendance", icon: <CalendarDays size={18} /> },
    { name: "Messaging", icon: <MessageSquare size={18} /> },
    { name: "Events", icon: <Megaphone size={18} /> },
    { name: "Announcements", icon: <Bell size={18} /> },
    { name: "Library", icon: <BookOpen size={18} /> },
  ];

  return (
    <div
      className={`min-h-screen flex transition-all ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`w-64 p-6 shadow-lg flex flex-col justify-between ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div>
          <h2 className="text-2xl font-bold text-center text-blue-500 mb-6">
            🎓 Student Panel
          </h2>

          {/* Profile Avatar */}
          <div
            className="flex flex-col items-center cursor-pointer mb-8"
            onClick={() => {
              setShowProfile(!showProfile);
              setActiveTab("Profile");
            }}
          >
            <img
              src={studentData?.profileImage}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-blue-500 object-cover shadow-md"
            />
            <p className="mt-3 font-semibold">{studentData?.name}</p>
          </div>

          {/* Sidebar Modules */}
          <nav className="space-y-2">
            {modules.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg font-medium relative transition-all duration-300
                  ${
                    activeTab === item.name
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : darkMode
                      ? "hover:bg-gray-700 text-gray-300"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
              >
                {/* Blue Highlight Bar (active indicator) */}
                {activeTab === item.name && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-blue-600 rounded-r-md"></span>
                )}
                <span className="text-blue-500">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 py-2 mt-6 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all"
        >
          <LogOut size={18} /> Logout
        </button>
      </motion.aside>

      {/* Main Dashboard */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-500 p-5 flex justify-between items-center shadow-md">
          <h1 className="text-xl md:text-2xl font-bold text-white">
            {activeTab === "Dashboard"
              ? `Welcome, ${studentData?.name} 👋`
              : activeTab}
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Dashboard */}
          {activeTab === "Dashboard" && (
            <motion.div
              className="grid md:grid-cols-2 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Attendance Chart */}
              <div
                className={`rounded-2xl shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4 text-blue-600">
                  Weekly Attendance Overview
                </h3>
                <Bar
                  data={{
                    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                    datasets: [
                      {
                        label: "Attendance %",
                        data: [85, 90, 88, 94],
                        backgroundColor: "rgba(59,130,246,0.7)",
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 100 } },
                  }}
                />
              </div>

              {/* Results Chart */}
              <div
                className={`rounded-2xl shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3 className="text-lg font-semibold mb-4 text-blue-600">
                  Semester GPA Trend
                </h3>
                <Bar
                  data={{
                    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
                    datasets: [
                      {
                        label: "GPA",
                        data: [2.8, 3.2, 3.5, 3.7],
                        backgroundColor: "rgba(99,102,241,0.7)",
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 4,
                        ticks: { stepSize: 0.5 },
                      },
                    },
                  }}
                />
              </div>

              {/* AI Feedback */}
              <div
                className={`md:col-span-2 rounded-2xl shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3 className="text-lg font-semibold mb-3 text-blue-600">
                  AI Performance Insight 🤖
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed">
                  {aiFeedback}
                </p>
              </div>
            </motion.div>
          )}

          {/* Profile */}
          {activeTab === "Profile" && (
            <motion.div
              className={`rounded-2xl shadow-md p-6 max-w-xl ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-blue-600">
                Profile Details
              </h2>
              <div className="flex items-center gap-6 mb-4">
                <img
                  src={studentData?.profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
                />
                <div>
                  <p className="font-semibold text-lg">{studentData?.name}</p>
                  <p className="text-sm text-gray-400">{studentData?.email}</p>
                </div>
              </div>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li><strong>Department:</strong> {studentData?.department}</li>
                <li><strong>Semester:</strong> {studentData?.semester}</li>
                <li><strong>Roll No:</strong> {studentData?.rollNo}</li>
              </ul>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;