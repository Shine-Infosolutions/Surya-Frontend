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

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders and items in parallel for better performance
      const [ordersRes, itemsRes] = await Promise.all([
        axios.get('/api/orders', { params: { page: 1, limit: 100 } }),
        axios.get('/api/item', { params: { page: 1, limit: 1000 } })
      ]);
      
      const orders = ordersRes.data.orders || [];
      const ordersPagination = ordersRes.data.pagination || {};
      const totalOrdersFromPagination = ordersPagination.totalOrders || orders.length;
      
      console.log('Orders fetched:', orders.length, 'Total orders:', totalOrdersFromPagination);
      
      const items = itemsRes.data.items || itemsRes.data || [];
      console.log('Dashboard items:', items.length);
      
      // Calculate metrics
      const totalOrders = totalOrdersFromPagination;
      // Use sample revenue calculation for performance
      const avgOrderValue = orders.length > 0 ? orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / orders.length : 0;
      const totalRevenue = avgOrderValue * totalOrdersFromPagination;
      console.log('Total revenue estimated:', totalRevenue);
      const noStockItems = items.filter(item => item.stock === 0).length;
      const totalItems = items.length;
      
      // Generate stock levels by category
      const medicalItems = items.filter(item => item.category === 1);
      const opticalItems = items.filter(item => item.category === 2);
      const stockLevels = [
        medicalItems.reduce((sum, item) => sum + item.stock, 0),
        opticalItems.reduce((sum, item) => sum + item.stock, 0)
      ];
      
      // Generate sample monthly sales for selected year
      const monthlySales = Array(12).fill(0);
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate.getFullYear() === selectedYear) {
          const monthIndex = orderDate.getMonth();
          monthlySales[monthIndex] += order.items?.length || 1;
        }
      });
      
      // Generate yearly revenue from actual order data
      const currentYear = new Date().getFullYear();
      const yearlyRevenue = Array(5).fill(0);
      const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
      
      orders.forEach(order => {
        const orderYear = new Date(order.createdAt).getFullYear();
        const yearIndex = years.indexOf(orderYear);
        if (yearIndex !== -1) {
          yearlyRevenue[yearIndex] += order.totalAmount || 0;
        }
      });
      
      console.log('Yearly revenue by year:', years.map((year, i) => `${year}: ₹${yearlyRevenue[i]}`));
      
      setDashboardData({
        monthlySales,
        yearlyRevenue,
        stockLevels,
        totalOrders,
        totalRevenue,
        noStockItems,
        totalItems
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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