// src/pages/CreateOrder.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import Select, { components } from "react-select";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from "react-toastify";

export default function CreateOrder() {
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("both");
  const { axios, loading, setLoading, navigate, user } = useAppContext();

  const DropdownIndicator = (props) => (
    <components.DropdownIndicator {...props}>
      <Search size={16} className="text-gray-500" />
    </components.DropdownIndicator>
  );

  const categoryMap = {
    1: "Surya Medical",
    2: "Surya Optical",
  };

  const fetchItems = async () => {
    try {
      const params = { limit: 10000000000 };
      
      // Admin sees all data, staff sees only their category data
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = user?.role || storedUser.role || 'staff';
      const userCategory = user?.category || storedUser.category;
      
      if (userRole === 'staff' && userCategory) {
        params.category = userCategory;
      }
      
      const itemsRes = await axios.get("/api/items", { params });
      const itemsData = itemsRes.data.items || itemsRes.data.data || [];
      setItems(itemsData);
    } catch (err) {
      console.error("Failed to fetch items:", err);
      setItems([]);
    }
  };

  // Fetch items and unit types
  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = { limit: 10000000000 };
        
        // Admin sees all data, staff sees only their category data
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = user?.role || storedUser.role || 'staff';
        const userCategory = user?.category || storedUser.category;
        
        if (userRole === 'staff' && userCategory) {
          params.category = userCategory;
        }
        
        const [itemsRes, unitTypesRes] = await Promise.all([
          axios.get("/api/items", { params }),
          axios.get("/api/items/unit-types"),
        ]);

        const itemsData = itemsRes.data.items || itemsRes.data.data || [];
        setItems(itemsData);

        const apiData = unitTypesRes.data?.data;
        
        // Use backend values but filter to only valid enum values
        const validEnums = ['tablet', 'bottle', 'strip', 'piece', 'frame', 'lens'];
        const allUnitTypes = [
          ...(apiData?.medical || []),
          ...(apiData?.optical || [])
        ].filter(unit => validEnums.includes(unit.toLowerCase())).map(unit => unit.toLowerCase());
        
        console.log('Final unitTypes array:', allUnitTypes);
        console.log('First unitType:', allUnitTypes[0]);
        setUnitTypes(allUnitTypes);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setItems([]);
        setUnitTypes([]);
      }
    };
    fetchData();
  }, [axios]);

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    discount: 0,
    tax: 0,
    items: [
      {
        itemId: "",
        itemName: "",
        category: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        unitType: "",
      },
    ],
  });

  const recalcItem = (item) => ({
    ...item,
    totalPrice: Number(item.quantity || 0) * Number(item.unitPrice || 0),
  });

  const orderSubtotal = useMemo(
    () => form.items.reduce((sum, it) => sum + Number(it.totalPrice || 0), 0),
    [form.items]
  );

  const orderTotal = useMemo(() => {
    const sub = orderSubtotal;
    const afterDiscount = sub - (sub * Number(form.discount || 0)) / 100;
    const afterTax =
      afterDiscount + (afterDiscount * Number(form.tax || 0)) / 100;
    return Math.max(0, Math.round(afterTax));
  }, [orderSubtotal, form.discount, form.tax]);

  const updateItem = (idx, field, value) => {
    const formItems = [...form.items];
    let updated = { ...formItems[idx], [field]: value };

    if (field === "itemId") {
      const item = items.find((i) => i._id === value);
      if (item) {
        updated.itemName = item.name;
        updated.unitPrice = item.price || 0;
        updated.category = Number(item.category);
        // Use the item's actual unitType instead of defaulting to first unitType
        updated.unitType = item.unitType || "";
        console.log('Setting unitType from item:', item.unitType);
      }
    }

    formItems[idx] = recalcItem(updated);
    setForm((f) => ({ ...f, items: formItems }));
  };

  const addItemRow = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          itemId: "",
          itemName: "",
          category: "",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          unitType: "",
        },
      ],
    }));
  };

  const removeItemRow = (idx) => {
    setForm((f) => {
      if (f.items.length === 1) return f;
      return { ...f, items: f.items.filter((_, i) => i !== idx) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.customerName || form.customerName.trim().length < 3) {
      return toast.error("Customer name must be at least 3 characters.");
    }
    if (!/^[a-zA-Z\s]+$/.test(form.customerName.trim())) {
      return toast.error(
        "Customer name can only contain letters and spaces."
      );
    }

    if (!/^\d{10}$/.test(form.customerPhone)) {
      return toast.error("Customer phone must be exactly 10 digits.");
    }

    const invalid = form.items.some(
      (it) =>
        !it.itemId ||
        Number(it.quantity) <= 0 ||
        Number(it.unitPrice) < 0 ||
        !it.unitType
    );
    if (invalid) {
      return toast.error("Please fill all required fields.");
    }

    // Check stock availability
    const outOfStockItems = form.items.filter((it) => {
      const item = items.find(i => i._id === it.itemId);
      return item && (item.stock || 0) < Number(it.quantity);
    });
    
    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map(it => it.itemName).join(", ");
      return toast.error(`Insufficient stock for: ${itemNames}`);
    }

    console.log('Form items before payload:', form.items);
    
    const payload = {
      orderNumber: `ORD-${Date.now()}`,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      subtotal: orderSubtotal,
      totalAmount: orderTotal,
      discount: form.discount,
      tax: form.tax,
      items: form.items.map((it) => ({
        itemId: it.itemId,
        itemName: it.itemName,
        category: it.category,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
        unitType: it.unitType,
      })),
    };

    console.log('Payload to send:', JSON.stringify(payload, null, 2));

    try {
      setLoading(true);
      const response = await axios.post("/api/orders", payload);
      console.log('Order creation response:', response.data);
      
      // Update stock for each item in the order
      for (const item of form.items) {
        try {
          const currentItem = items.find(i => i._id === item.itemId);
          const newStock = Math.max(0, (currentItem?.stock || 0) - Number(item.quantity));
          
          console.log(`Updating stock for ${item.itemName}: ${currentItem?.stock} - ${item.quantity} = ${newStock}`);
          
          await axios.put(`/api/items/${item.itemId}`, {
            ...currentItem,
            stock: newStock,
            unitQuantity: newStock
          });
        } catch (stockError) {
          console.error('Failed to update stock for item:', item.itemId, stockError);
        }
      }
      
      // Refetch items to get updated stock levels
      await fetchItems();
      
      toast.success("Order created successfully!");
      navigate("/orders");
    } catch (e) {
      console.error('Order creation error:', e);
      console.error('Error response:', e.response?.data);
      const msg = e?.response?.data?.message || e?.response?.data?.error || "Failed to create order";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (categoryFilter === "medical") return Number(item.category) === 1;
    if (categoryFilter === "optical") return Number(item.category) === 2;
    return true;
  });

  const itemOptions = filteredItems.map((item) => ({
    value: item._id,
    label: `${item.name} (Stock: ${item.stock || 0})`,
    isDisabled: (item.stock || 0) <= 0
  }));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">📝 Create Order</h1>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-2xl p-6 space-y-6"
      >
        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1">
              Customer Name
            </label>
            <input
              className="border rounded-lg p-3 w-full"
              placeholder="Customer Name *"
              value={form.customerName}
              onChange={(e) =>
                setForm((f) => ({ ...f, customerName: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1">
              Customer Phone
            </label>
            <input
              type="text"
              inputMode="numeric"
              className="border rounded-lg p-3 w-full"
              placeholder="Customer Phone *"
              value={form.customerPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setForm((f) => ({ ...f, customerPhone: val }));
              }}
              required
              maxLength={10}
            />
          </div>
        </div>

        {/* Discount & Tax */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Discount %</label>
            <input
              type="number"
              min="0"
              className="border rounded-lg p-3 w-full"
              value={form.discount}
              onChange={(e) =>
                setForm((f) => ({ ...f, discount: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Tax %</label>
            <input
              type="number"
              min="0"
              className="border rounded-lg p-3 w-full"
              value={form.tax}
              onChange={(e) =>
                setForm((f) => ({ ...f, tax: Number(e.target.value) }))
              }
            />
          </div>
        </div>

        {/* Items */}
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">📦 Items</h3>
              <div className="bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setCategoryFilter("medical")}
                  className={`px-3 py-1 rounded text-sm ${
                    categoryFilter === "medical"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  🏥 Medical
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("optical")}
                  className={`px-3 py-1 rounded text-sm ${
                    categoryFilter === "optical"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  👓 Optical
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm({
                    customerName: "",
                    customerPhone: "",
                    discount: 0,
                    tax: 0,
                    items: [
                      {
                        itemId: "",
                        itemName: "",
                        category: "",
                        quantity: 1,
                        unitPrice: 0,
                        totalPrice: 0,
                        unitType: "",
                      },
                    ],
                  });
                  setError("");
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={addItemRow}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                + Add Item
              </button>
            </div>
          </div>

          {form.items.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 bg-gray-50 p-3 rounded-lg"
            >
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Item</label>
                <Select
                  options={itemOptions}
                  value={
                    itemOptions.find((opt) => opt.value === it.itemId) || null
                  }
                  onChange={(selected) => updateItem(idx, "itemId", selected?.value)}
                  placeholder="Search Item..."
                  components={{ DropdownIndicator }}
                  className="w-full"
                  isSearchable
                  isClearable
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                <input
                  className="border rounded-lg p-2 bg-gray-100 w-full"
                  placeholder="Unit"
                  value={it.unitType || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={items.find(i => i._id === it.itemId)?.stock || 999}
                  className={`border rounded-lg p-2 w-full ${
                    it.itemId && items.find(i => i._id === it.itemId)?.stock < it.quantity
                      ? "border-red-500 bg-red-50"
                      : ""
                  }`}
                  value={it.quantity}
                  onChange={(e) => {
                    const newQty = Number(e.target.value);
                    const item = items.find(i => i._id === it.itemId);
                    if (item && newQty > (item.stock || 0)) {
                      toast.error(`Only ${item.stock || 0} units available for ${item.name}`);
                    }
                    updateItem(idx, "quantity", newQty);
                  }}
                />
                {it.itemId && (
                  <div className="text-xs text-gray-500 mt-1">
                    Available: {items.find(i => i._id === it.itemId)?.stock || 0}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Price</label>
                <input
                  type="number"
                  className="border rounded-lg p-2 w-full"
                  placeholder="Enter unit price"
                  value={it.unitPrice}
                  onChange={(e) =>
                    updateItem(idx, "unitPrice", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Total</label>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-600">
                    ₹{it.totalPrice}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                    disabled={form.items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="flex flex-col md:flex-row justify-end gap-6 pt-4 border-t">
          <div>
            Subtotal: <b>₹{orderSubtotal}</b>
          </div>
          <div>
            Discount ({form.discount}%):{" "}
            <b>-₹{Math.round((orderSubtotal * form.discount) / 100)}</b>
          </div>
          <div>
            Tax ({form.tax}%):{" "}
            <b>
              +₹
              {Math.round(
                ((orderSubtotal - (orderSubtotal * form.discount) / 100) *
                  form.tax) /
                  100
              )}
            </b>
          </div>
          <div>
            Total:{" "}
            <b className="text-lg text-emerald-600">₹{orderTotal}</b>
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg shadow-md"
          >
            {loading ? "Saving..." : "Save Order"}
          </button>
        </div>
      </form>
    </div>
  );
}