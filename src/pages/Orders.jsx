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
  const { axios, navigate } = useAppContext();

  const fetchOrders = async (page = 1, searchQuery = "") => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/orders", {
        params: { page, search: searchQuery },
      });

      setOrders(data.orders || []); // API se jo array aa raha hai
      setPagination(data.pagination || {});
      
      // Show success toast when orders are loaded
      // if (data.orders && data.orders.length > 0) {
        // toast.success(`Loaded ${data.orders.length} orders successfully!`);
      // }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const viewInvoice = (orderId) => {
    window.open(`/orders/${orderId}/invoice`, "_blank");
  };

  useEffect(() => {
    fetchOrders(1, search); // initial load
  }, []);

  // jab search kare to page 1 se reload ho
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    try {
      const { data } = await axios.get("/api/orders", {
        params: { page: 1, search: value },
      });
      setOrders(data.orders || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error('Failed to load orders');
    }
  };

  // pagination click
  const paginate = (pageNumber) => {
    fetchOrders(pageNumber, search);
  };

 

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h3 className="text-3xl font-bold mb-8 text-center text-indigo-700">Orders List</h3>
      
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={handleSearch}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="flex justify-between mb-6">
        <div></div>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => navigate("/orders/create")}
        >
          Create Order
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bill</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((o) => (
              <tr key={o._id} className="hover:bg-gray-50">
                <td className="p-3 font-semibold">{o.orderNumber}</td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3">{o.customerPhone}</td>
                <td className="p-3 font-bold text-green-600">
                  ₹{Number(o.totalAmount).toFixed(2)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => viewInvoice(o._id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination from API */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() =>
            pagination.hasPrevPage && paginate(pagination.currentPage - 1)
          }
          disabled={!pagination.hasPrevPage}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>

        {[...Array(pagination.totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => paginate(idx + 1)}
            className={`px-3 py-1 rounded ${
              pagination.currentPage === idx + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {idx + 1}
          </button>
        ))}

        <button
          onClick={() =>
            pagination.hasNextPage && paginate(pagination.currentPage + 1)
          }
          disabled={!pagination.hasNextPage}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}