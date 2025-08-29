import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext';

// Category mapping function
const getCategoryText = (category) => {
  const categoryNum = Number(category);
  if (categoryNum === 1) return 'Surya Medical';
  if (categoryNum === 2) return 'Surya Optical';
  return category;
};

function ItemsList() {
  const [items, setItems] = useState([]);
  
  // Debug items state
  console.log('Current items state:', items);
  console.log('items length:', items.length);
  const [filteredItems, setFilteredItems] = useState([]);
  const [sortBy, setSortBy] = useState('Both');
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'in_stock', 'out_of_stock'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const {axios} = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();
  const itemsPerPage = 25;

  useEffect(() => {
    console.log('ItemsList mounted, fetching items...');
    fetchItems(searchTerm);
    
    // Refresh when window gains focus (when returning from edit)
    const handleFocus = () => {
      console.log('Window focused, fetching items...');
      fetchItems();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Refresh items when returning from edit
  useEffect(() => {
    console.log('Location state changed:', location.state);
    if (location.state?.refresh) {
      console.log('Refresh triggered from EditItemPage');
      // Force complete refresh by clearing items first
      setItems([]);
      setFilteredItems([]);
      setTimeout(() => {
        fetchItems(searchTerm, currentPage);
      }, 100);
      // Clear the refresh state to prevent multiple refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location.state, searchTerm, currentPage]);

  // No backend search - using frontend search only

  async function fetchItems(search = '', page = 1) {
      try {
        const params = { page, limit: itemsPerPage };
        // Removed backend search parameter
        const fullUrl = axios.defaults.baseURL + '/api/items';
        console.log('Fetching items from:', '/api/items');
        console.log('Params:', params);
        console.log('Full URL:', fullUrl);
        console.log('Axios base URL:', axios.defaults.baseURL);
        const res = await axios.get('/api/items', { params });
        console.log('Raw response:', res);
        console.log('Response data:', res.data);
        console.log('Data type:', typeof res.data);
        console.log('Is array:', Array.isArray(res.data));
        console.log('Complete response data:', JSON.stringify(res.data, null, 2));
        
        // Extract items from API response structure
        const data = res.data.data || [];
        const pagination = {
          totalPages: Math.ceil((res.data.meta?.total || 0) / (res.data.meta?.limit || 25))
        };
        console.log('Extracted items:', data);
        console.log('Items count:', data.length);
        console.log('Pagination:', pagination);
        setItems(data);
        
        // Update pagination state from backend
        if (pagination.totalPages) {
          setTotalPages(pagination.totalPages);
        }
        // Always update filteredItems with fresh data from backend
        setFilteredItems(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setItems([]);
      }
    }

  // Frontend filtering only - no need to refetch on sortBy change

  const safeFilteredItems = Array.isArray(filteredItems) ? filteredItems : [];
  // Filter items by search, category and stock status in frontend
  const currentItems = safeFilteredItems.filter(item => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = item.name?.toLowerCase().includes(searchLower) || false;
      const descMatch = item.description?.toLowerCase().includes(searchLower) || false;
      if (!nameMatch && !descMatch) {
        return false;
      }
    }
    // Category filter
    if (sortBy === '1' && Number(item.category) !== 1) return false;
    if (sortBy === '2' && Number(item.category) !== 2) return false;
    // Stock filter
    if (stockFilter === 'in_stock') return item.stock > 0;
    if (stockFilter === 'out_of_stock') return item.stock === 0;
    return true;
  });
  // Get totalPages from backend response (will be set in fetchItems)
  const [totalPages, setTotalPages] = useState(1);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchItems(searchTerm, page);
  };



  const handleEditClick = (item) => {
    navigate(`/items/edit/${item._id}`, { state: { item } });
  };


   
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    setDeletingId(id);
    try {
      console.log('Deleting item with id:', id);
      await axios.delete(`/api/items/${id}`);
      setItems(items.filter(item => item._id !== id));
      fetchItems();
      toast.success('Item deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      const errorMsg = err?.response?.data?.message || 'Failed to delete item';
      toast.error(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h3 className="text-3xl font-bold mb-8 text-center text-indigo-700">Items List</h3>
      
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Both">Both</option>
              <option value="2">Surya Opticals</option>
              <option value="1">Surya Medicals</option>
            </select>
          </div>
        </div>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          onClick={() => navigate('/items/add')}
        >
          Add Item
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span>Stock</span>
                  <select
                    value={stockFilter}
                    onChange={e => setStockFilter(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="all">All</option>
                    <option value="in_stock">In Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {safeFilteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No items found.
                </td>
              </tr>
            ) : (
              currentItems.map((item, idx) => (
                <tr key={item._id || idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryText(item.category)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{item.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.stock === 0 ? (
                      <span className="text-red-500 font-medium">Out of Stock</span>
                    ) : (
                      item.stock
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium print:hidden">
                    <div className="flex gap-2">
                      <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onClick={() => handleEditClick(item)}>Edit</button>
                      <button 
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50" 
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                      >
                        {deletingId === item._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {safeFilteredItems.length > 0 && (
        <div className="flex justify-center items-center mt-6 gap-2 print:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ItemsList;