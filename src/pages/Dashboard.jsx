import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
// import Loader from '../component/Loader';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} 
from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { axios } = useAppContext();
  const [dashboardData, setDashboardData] = useState({
    monthlySales: [],
    yearlyRevenue: [],
    stockLevels: [],
    totalOrders: 0,
    totalRevenue: 0,
    noStockItems: 0,
    totalItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCategory, setShowCategory] = useState('both'); // 'medical', 'optical', 'both'

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear, showCategory]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch items and orders data with proper pagination
      const [itemsResponse, ordersResponse] = await Promise.all([
        axios.get('/api/items', { params: { limit: 1000 } }),
        axios.get('/api/orders', { params: { limit: 1000 } })
      ]);
      
      // Get items data - handle different response structures
      const itemsData = itemsResponse.data;
      let allItems = [];
      
      if (Array.isArray(itemsData)) {
        allItems = itemsData;
      } else if (itemsData.data && Array.isArray(itemsData.data)) {
        allItems = itemsData.data;
      } else if (itemsData.items && Array.isArray(itemsData.items)) {
        allItems = itemsData.items;
      }
      
      console.log('Items API Response:', itemsData);
      console.log('All Items:', allItems);
      
      // Filter items based on selected category
      let filteredItems = allItems;
      if (showCategory === 'medical') {
        filteredItems = allItems.filter(item => Number(item.category) === 1);
      } else if (showCategory === 'optical') {
        filteredItems = allItems.filter(item => Number(item.category) === 2);
      }
      
      const totalItems = filteredItems.length;
      const noStockItems = filteredItems.filter(item => (item.stock || 0) === 0).length;
      
      // Get orders data - API returns data in 'data' array
      const ordersData = ordersResponse.data;
      const allOrders = ordersData.data || [];
      
      console.log('Orders API Response:', ordersData);
      console.log('All Orders:', allOrders);
      console.log('Orders count:', allOrders.length);
      
      // Filter orders based on selected category
      let filteredOrders = allOrders;
      if (showCategory === 'medical') {
        filteredOrders = allOrders.filter(order => 
          order.items && order.items.some(item => String(item.category) === '1')
        );
      } else if (showCategory === 'optical') {
        filteredOrders = allOrders.filter(order => 
          order.items && order.items.some(item => String(item.category) === '2')
        );
      }
      
      const totalRevenue = filteredOrders.reduce((sum, order) => {
        const amount = Number(order.totalAmount) || 0;
        return sum + amount;
      }, 0);
      const totalOrders = filteredOrders.length;
      
      console.log('Category filter:', showCategory);
      console.log('Filtered orders:', filteredOrders.length);
      console.log('Sample order items:', filteredOrders[0]?.items);
      
      // Calculate monthly sales for current year
      const currentYear = selectedYear;
      const monthlySales = new Array(12).fill(0);
      const yearlyRevenue = new Array(5).fill(0);
      
      filteredOrders.forEach(order => {
        if (!order.createdAt) return;
        
        const orderDate = new Date(order.createdAt);
        if (isNaN(orderDate.getTime())) return; // Invalid date
        
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth();
        
        // Monthly sales for selected year (count orders, not units)
        if (orderYear === currentYear) {
          monthlySales[orderMonth] += 1; // Count orders instead of units
        }
        
        // Yearly revenue for last 5 years
        const currentYearNow = new Date().getFullYear();
        const yearIndex = orderYear - (currentYearNow - 4);
        if (yearIndex >= 0 && yearIndex < 5) {
          const revenue = Number(order.totalAmount) || 0;
          yearlyRevenue[yearIndex] += revenue;
        }
      });
      
      console.log('Dashboard data calculated:');
      console.log('Total items:', totalItems);
      console.log('No stock items:', noStockItems);
      console.log('Total orders:', totalOrders);
      console.log('Total revenue:', totalRevenue);
      console.log('Monthly sales:', monthlySales);
      console.log('Yearly revenue:', yearlyRevenue);
      console.log('Filtered items:', filteredItems.length);
      console.log('Filtered orders:', filteredOrders.length);
      
      setDashboardData({
        monthlySales: monthlySales,
        yearlyRevenue: yearlyRevenue,
        stockLevels: [],
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        noStockItems: noStockItems,
        totalItems: totalItems
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to empty data on error
      setDashboardData({
        monthlySales: new Array(12).fill(0),
        yearlyRevenue: new Array(5).fill(0),
        stockLevels: [],
        totalOrders: 0,
        totalRevenue: 0,
        noStockItems: 0,
        totalItems: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const BarChart = ({ data, title, color = 'rgba(59, 130, 246, 0.8)', labels }) => {
    const chartData = {
      labels: labels || data.map((_, index) => index + 1),
      datasets: [
        {
          label: title,
          data: data,
          backgroundColor: color,
          borderColor: color.replace('0.8', '1'),
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    return (
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  const StatCard = ({ title, value, icon, color = 'text-blue-600' }) => (
    <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs md:text-sm">{title}</p>
          <p className={`text-lg md:text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`text-2xl md:text-3xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  // if (loading) {
    // return <Loader message="Loading dashboard data..." />;
  // }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h2>
      
      {/* Category Toggle */}
      <div className="flex justify-center mb-4 md:mb-6">
        <div className="bg-white rounded-lg p-1 shadow-lg w-full max-w-md">
          <div className="flex flex-col sm:flex-row">
            <button
              onClick={() => setShowCategory('both')}
              className={`px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base ${
                showCategory === 'both'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setShowCategory('medical')}
              className={`px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base ${
                showCategory === 'medical'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              🏥 Medical
            </button>
            <button
              onClick={() => setShowCategory('optical')}
              className={`px-3 md:px-4 py-2 rounded-md transition-colors text-sm md:text-base ${
                showCategory === 'optical'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              👓 Optical
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title="Total Orders" 
          value={dashboardData.totalOrders.toLocaleString()} 
          icon="📦" 
          color="text-blue-600"
        />
        <StatCard 
          title="Total Revenue" 
          value={`₹${dashboardData.totalRevenue.toFixed(2)}`}
          icon="💰" 
          color="text-green-600"
        />
        <StatCard 
          title="Total Items" 
          value={dashboardData.totalItems.toLocaleString()} 
          icon="📋" 
          color="text-purple-600"
        />
        <StatCard 
          title="No Stock Items" 
          value={dashboardData.noStockItems} 
          icon="⚠️" 
          color="text-red-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
            <h3 className="text-base md:text-lg font-semibold">Monthly Orders</h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 md:px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm md:text-base"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <Bar data={{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
              label: `Monthly Orders (${selectedYear})`,
              data: dashboardData.monthlySales,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            }],
          }} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: { beginAtZero: true },
            },
          }} />
        </div>
        <BarChart 
          data={dashboardData.yearlyRevenue} 
          title="Yearly Revenue (₹)" 
          color="rgba(34, 197, 94, 0.8)"
          labels={[new Date().getFullYear() - 4, new Date().getFullYear() - 3, new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear()]}
        />
      </div>


    </div>
  );
};

export default Dashboard