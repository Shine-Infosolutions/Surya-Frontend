// Orders.jsx
import React, { useEffect, useState, useMemo } from "react";
import { toast } from 'react-toastify';
import { useAppContext } from "../context/AppContext";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("Both");
  const { axios, navigate } = useAppContext();

  // Get user role
  const userRole = parseInt(localStorage.getItem("userRole")) || 2;

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const pageSize = 25; // per page records

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/paginate/Order"); // fetch all orders only
      const ordersData = response.data.orders || response.data.data || [];
      setOrders(ordersData);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const viewInvoice = (orderId) => {
    window.open(`/orders/${orderId}/invoice`, "_blank");
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await axios.delete(`/api/orders/${orderId}`);
      fetchOrders();
      toast.success("Order deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete order");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔥 Apply search + filter frontend me
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by category
    if (categoryFilter !== "Both") {
      filtered = filtered.filter((order) => {
        const categories = [...new Set(order.items?.map((item) => Number(item.category)) || [])];
        if (categories.length === 0) return false;
        if (categoryFilter === "Surya Medical") return categories.includes(1);
        if (categoryFilter === "Surya Optical") return categories.includes(2);
        return true;
      });
    }

    // Search by name / phone / orderNumber
    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customerName?.toLowerCase().includes(lower) ||
          order.customerPhone?.toLowerCase().includes(lower) ||
          order.orderNumber?.toLowerCase().includes(lower) ||
          order.invoiceNumber?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }, [orders, search, categoryFilter]);

  // 🔥 Pagination frontend me
  const paginatedOrders = useMemo(() => {
    const total = filteredOrders.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const start = (pagination.currentPage - 1) * pageSize;
    const end = start + pageSize;
    const data = filteredOrders.slice(start, end);

    setPagination((prev) => ({
      ...prev,
      totalOrders: total,
      totalPages,
      hasPrevPage: pagination.currentPage > 1,
      hasNextPage: pagination.currentPage < totalPages,
    }));

    return data;
  }, [filteredOrders, pagination.currentPage]);

  const paginate = (pageNumber) => {
    setPagination((prev) => ({ ...prev, currentPage: pageNumber }));
  };

  const getCategoryDisplay = (order) => {
    if (!order.items || order.items.length === 0) return "N/A";

    const categories = [...new Set(order.items.map((item) => Number(item.category)))];

    if (categories.length === 1) {
      return categories[0] === 1
        ? "Surya Medical"
        : categories[0] === 2
        ? "Surya Optical"
        : "N/A";
    } else if (categories.length > 1) {
      return "Mixed";
    }

    return "N/A";
  };

  return (
    <div className="h-full overflow-auto p-3 md:p-6">
      <h3 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center text-indigo-700">
        Orders List
      </h3>

      {/* Search Bar */}
      <div className="mb-4 md:mb-6">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPagination((p) => ({ ...p, currentPage: 1 }));
          }}
          className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <label className="text-xs md:text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPagination((p) => ({ ...p, currentPage: 1 }));
            }}
            className="px-2 md:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-sm"
          >
            <option value="Both">Both</option>
            <option value="Surya Medical">Medical</option>
            <option value="Surya Optical">Optical</option>
          </select>
        </div>
        <button
          className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 text-sm md:text-base"
          onClick={() => navigate("/orders/create")}
        >
          + Create
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Bill
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedOrders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.invoiceNumber
                    ? order.invoiceNumber.replace("INV-", "")
                    : order.orderNumber || order._id}
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
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "N/A"}
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
                    {userRole === 1 && (
                      <button
                        onClick={() => handleDelete(order._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedOrders.length === 0 && !loading && (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {paginatedOrders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  #{order.invoiceNumber
                    ? order.invoiceNumber.replace("INV-", "")
                    : order.orderNumber || order._id}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600 text-sm">
                  ₹{Number(order.totalAmount || 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getCategoryDisplay(order)}
                </div>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
              <div className="text-xs text-gray-500">{order.customerPhone}</div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => viewInvoice(order._id)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-xs"
              >
                View
              </button>
              <button
                onClick={() => navigate(`/orders/edit/${order._id}`)}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-xs"
              >
                Edit
              </button>
              {userRole === 1 && (
                <button
                  onClick={() => handleDelete(order._id)}
                  className="flex-1 bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-xs"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {paginatedOrders.length === 0 && !loading && (
        <div className="md:hidden text-center py-8 text-gray-500">
          No orders found.
        </div>
      )}

      {/* Pagination */}
      {filteredOrders.length > 0 && (
        <div className="flex justify-center items-center mt-4 md:mt-6 gap-1 md:gap-2">
          <button
            onClick={() => pagination.hasPrevPage && paginate(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="px-2 md:px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
          >
            Prev
          </button>

          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            const page = i + Math.max(1, pagination.currentPage - 2);
            if (page > pagination.totalPages) return null;
            return (
              <button
                key={page}
                onClick={() => paginate(page)}
                className={`px-2 md:px-3 py-2 rounded text-xs md:text-sm ${
                  pagination.currentPage === page
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => pagination.hasNextPage && paginate(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="px-2 md:px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Orders count */}
      {filteredOrders.length > 0 && (
        <div className="text-center mt-3 md:mt-4 text-xs md:text-sm text-gray-600">
          Showing {paginatedOrders.length} of {filteredOrders.length} orders
        </div>
      )}
    </div>
  );
}
