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
      
      const params = {
        year: selectedYear,
        category: showCategory
      };
      
      // Fetch widgets data, all items, and orders in parallel
      const [widgetsResponse, itemsResponse, ordersResponse] = await Promise.all([
        axios.get('/api/widgets', { params }),
        axios.get('/api/items', { params: { limit: 1000 } }), // Get all items to count stock
        axios.get('/api/orders', { params: { limit: 1000 } }) // Get orders for revenue calculation
      ]);
      
      const dataArray = widgetsResponse.data;
      const data = Array.isArray(dataArray) ? dataArray[0] : dataArray;
      
      // Get items data and filter by category
      const itemsData = itemsResponse.data;
      const allItems = itemsData.data || [];
      
      // Filter items based on selected category
      let filteredItems = allItems;
      if (showCategory === 'medical') {
        filteredItems = allItems.filter(item => Number(item.category) === 1);
      } else if (showCategory === 'optical') {
        filteredItems = allItems.filter(item => Number(item.category) === 2);
      }
      
      const totalItems = filteredItems.length;
      const noStockItems = filteredItems.filter(item => item.stock === 0).length;
      
      // Calculate total revenue from orders and get total count
      const ordersData = ordersResponse.data;
      const allOrders = ordersData.data || ordersData.orders || [];
      
      // Filter orders based on selected category
      let filteredOrders = allOrders;
      if (showCategory === 'medical') {
        filteredOrders = allOrders.filter(order => 
          order.items && order.items.some(item => Number(item.category) === 1)
        );
      } else if (showCategory === 'optical') {
        filteredOrders = allOrders.filter(order => 
          order.items && order.items.some(item => Number(item.category) === 2)
        );
      }
      
      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const totalOrders = filteredOrders.length;
      
      console.log('Dashboard data fetched:', data);
      console.log('Total items:', totalItems);
      console.log('No stock items:', noStockItems);
      
      // Extract monthly sales units from the array of objects
      const monthlySalesData = data?.monthlySales ? 
        data.monthlySales.map(month => month.units || 0) : [];
      
      setDashboardData({
        monthlySales: monthlySalesData,
        yearlyRevenue: data.yearlyRevenue ? [0, 0, 0, 0, data.yearlyRevenue] : [0, 0, 0, 0, 0],
        stockLevels: data.stockLevels || [],
        totalOrders: totalOrders,
        totalRevenue: totalRevenue,
        noStockItems: noStockItems,
        totalItems: totalItems
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to empty data on error
      setDashboardData({
        monthlySales: [],
        yearlyRevenue: [],
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
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <Bar data={chartData} options={options} />
      </div>
    );
  };

  const StatCard = ({ title, value, icon, color = 'text-blue-600' }) => (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`text-3xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  // if (loading) {
    // return <Loader message="Loading dashboard data..." />;
  // }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
      
      {/* Category Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg p-1 shadow-lg">
          <div className="flex">
            <button
              onClick={() => setShowCategory('both')}
              className={`px-4 py-2 rounded-md transition-colors ${
                showCategory === 'both'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setShowCategory('medical')}
              className={`px-4 py-2 rounded-md transition-colors ${
                showCategory === 'medical'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              🏥 Surya Medical
            </button>
            <button
              onClick={() => setShowCategory('optical')}
              className={`px-4 py-2 rounded-md transition-colors ${
                showCategory === 'optical'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              👓 Surya Optical
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Monthly Sales (Units)</h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <Bar data={{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
              label: `Monthly Sales (${selectedYear})`,
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