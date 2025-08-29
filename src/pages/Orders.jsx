// Orders.jsx
import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import { useAppContext } from "../context/AppContext";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('Both');
  const { axios, navigate } = useAppContext();

  const fetchOrders = async (page = 1, searchQuery = "", category = "Both") => {
    try {
      setLoading(true);
      const params = { page, limit: 25 };
      
      if (searchQuery.trim()) {
        params.customerName = searchQuery.trim();
      }
      
      if (category !== 'Both') {
        params.category = category === 'Surya Medical' ? 1 : 2;
      }
      
      console.log('Fetching orders with params:', params);
      const response = await axios.get("/api/paginate/Order", { params });
      console.log('Orders API response:', response.data);
      
      // Handle different response structures
      const ordersData = response.data.orders || response.data.data || [];
      const paginationData = response.data.pagination || response.data.meta || {};
      
      setOrders(ordersData);
      setPagination({
        currentPage: paginationData.currentPage || page,
        totalPages: paginationData.totalPages || 1,
        totalOrders: paginationData.total || ordersData.length,
        hasNextPage: paginationData.hasNextPage || false,
        hasPrevPage: paginationData.hasPrevPage || false,
      });
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const viewInvoice = (orderId) => {
    window.open(`/orders/${orderId}/invoice`, "_blank");
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await axios.delete(`/api/orders/${orderId}`);
      fetchOrders(pagination.currentPage, search, categoryFilter);
      toast.success('Order deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete order');
    }
  };

  useEffect(() => {
    fetchOrders(1, search, categoryFilter);
  }, []);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders(1, search, categoryFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const paginate = (pageNumber) => {
    fetchOrders(pageNumber, search, categoryFilter);
  };

  const handleCategoryChange = (category) => {
    setCategoryFilter(category);
    fetchOrders(1, search, category);
  };

  const getCategoryDisplay = (order) => {
    if (!order.items || order.items.length === 0) return 'N/A';
    
    const categories = [...new Set(order.items.map(item => Number(item.category)))];
    
    if (categories.length === 1) {
      return categories[0] === 1 ? 'Surya Medical' : categories[0] === 2 ? 'Surya Optical' : 'N/A';
    } else if (categories.length > 1) {
      return 'Mixed';
    }
    
    return 'N/A';
  };

  return (
    <div className="h-full overflow-auto p-6">
      <h3 className="text-3xl font-bold mb-8 text-center text-indigo-700">Orders List</h3>
      
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search orders by customer name, phone, or order number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter by:</label>
          <select 
            value={categoryFilter} 
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Both">Both</option>
            <option value="Surya Medical">Surya Medical</option>
            <option value="Surya Optical">Surya Optical</option>
          </select>
        </div>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => navigate("/orders/create")}
        >
          Create Order
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bill</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customerPhone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getCategoryDisplay(order)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  ₹{Number(order.totalAmount || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => viewInvoice(order._id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                  >
                    View
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/orders/edit/${order._id}`)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(order._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {orders.length > 0 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => pagination.hasPrevPage && paginate(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`px-3 py-2 rounded ${
                pagination.currentPage === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => pagination.hasNextPage && paginate(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Orders count */}
      {orders.length > 0 && (
        <div className="text-center mt-4 text-sm text-gray-600">
          Showing {orders.length} of {pagination.totalOrders} orders
        </div>
      )}
    </div>
  );
}
