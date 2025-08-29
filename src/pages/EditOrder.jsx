// src/pages/EditOrder.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Select, { components } from "react-select";
import { ArrowLeft, Search } from "lucide-react";
import { toast } from 'react-toastify';

const DropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <Search size={16} className="text-gray-500" />
  </components.DropdownIndicator>
);

const categoryMap = {
  1: "Surya Medical",
  2: "Surya Optical",
};

function EditOrder() {
  const { orderId } = useParams();
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [unitTypes, setUnitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { axios, setLoading: setGlobalLoading, navigate } = useAppContext();

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

  // Fetch order data, items and unit types
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching order, items and unit types...');
        const [orderRes, itemsRes, unitTypesRes] = await Promise.all([
          axios.get(`/api/orders/${orderId}`),
          axios.get("/api/items", { params: { limit: 10000000000 } }),
          axios.get("/api/items/unit-types")
        ]);

        console.log('Order response:', orderRes.data);
        console.log('Items response:', itemsRes.data);
        console.log('Unit types response:', unitTypesRes.data);

        // Handle different response structures
        const orderData = orderRes.data.order || orderRes.data.data || orderRes.data;
        const itemsData = itemsRes.data.items || itemsRes.data.data || [];
        const unitTypesData = Array.isArray(unitTypesRes.data) ? unitTypesRes.data : [];

        setItems(itemsData);
        setUnitTypes(unitTypesData);
        setForm({
          customerName: orderData.customerName || "",
          customerPhone: orderData.customerPhone || "",
          discount: orderData.discount || 0,
          tax: orderData.tax || 0,
          items: orderData.items?.map(item => ({
            itemId: item.itemId || "",
            itemName: item.itemName || "",
            category: Number(item.category) || "",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            unitType: item.unitType || "",
          })) || [
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
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Failed to load order data");
        toast.error("Failed to load order data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, axios]);

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
    const afterTax = afterDiscount + (afterDiscount * Number(form.tax || 0)) / 100;
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
        updated.unitType = unitTypes.length > 0 ? unitTypes[0] : "piece";
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
          unitType: unitTypes.length > 0 ? unitTypes[0] : "piece",
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

    if (!/^\d{10}$/.test(form.customerPhone)) {
      return toast.error("Customer phone must be exactly 10 digits.");
    }

    const invalid = form.items.some(
      (it) => !it.itemId || Number(it.quantity) <= 0 || Number(it.unitPrice) < 0
    );
    if (invalid) {
      return toast.error("Please fill all required fields.");
    }

    const payload = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      discount: form.discount,
      tax: form.tax,
      subtotal: orderSubtotal,
      totalAmount: orderTotal,
      items: form.items.map((it) => ({
        itemId: it.itemId,
        itemName: it.itemName,
        category: Number(it.category),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
        unitType: it.unitType,
      })),
    };

    try {
      setGlobalLoading(true);
      console.log('Updating order with payload:', payload);
      await axios.put(`/api/orders/${orderId}`, payload);
      toast.success("Order updated successfully!");
      navigate("/orders", { state: { refresh: true } });
    } catch (e) {
      console.error('Update error:', e);
      const msg = e?.response?.data?.message || "Failed to update order";
      setError(msg);
      toast.error(msg);
    } finally {
      setGlobalLoading(false);
    }
  };

  const itemOptions = items?.map((item) => ({
    value: item._id,
    label: item.name,
  })) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading order data...</p>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-800">✏️ Edit Order</h1>
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
              className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none w-full"
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
              className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none w-full"
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
              className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
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
              className="border rounded-lg p-3 w-full focus:ring-2 focus:ring-green-500 outline-none"
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
            <h3 className="font-semibold text-lg">📦 Items</h3>
            <button
              type="button"
              onClick={addItemRow}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              + Add Item
            </button>
          </div>

          {form.items.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3 bg-gray-50 p-3 rounded-lg"
            >
              <Select
                options={itemOptions}
                value={itemOptions.find((opt) => opt.value === it.itemId) || null}
                onChange={(selected) => updateItem(idx, "itemId", selected?.value)}
                placeholder="Search Item..."
                components={{ DropdownIndicator }}
                className="w-full"
                isSearchable
                isClearable
              />

              <input
                className="border rounded-lg p-2 bg-gray-100"
                placeholder="Category"
                value={categoryMap[it.category] || ""}
                readOnly
              />

              <select
                value={it.unitType}
                onChange={(e) => updateItem(idx, "unitType", e.target.value)}
                className="border rounded-lg p-2"
              >
                <option value="">Select Unit</option>
                {Array.isArray(unitTypes) && unitTypes.map((unitType) => (
                  <option key={unitType} value={unitType}>{unitType}</option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                className="border rounded-lg p-2"
                value={it.quantity}
                onChange={(e) =>
                  updateItem(idx, "quantity", Number(e.target.value))
                }
              />

              <input
                type="number"
                className="border rounded-lg p-2"
                placeholder="Enter unit price"
                value={it.unitPrice}
                onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
              />

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
          ))}
        </div>

        {/* Totals */}
        <div className="flex flex-col md:flex-row justify-end gap-6 pt-4 border-t">
          <div className="text-gray-700">
            Subtotal: <b>₹{orderSubtotal}</b>
          </div>
          <div className="text-gray-700">
            Discount ({form.discount}%): {" "}
            <b>-₹{Math.round((orderSubtotal * form.discount) / 100)}</b>
          </div>
          <div className="text-gray-700">
            Tax ({form.tax}%): {" "}
            <b>
              +₹
              {Math.round(
                ((orderSubtotal - (orderSubtotal * form.discount) / 100) *
                  form.tax) /
                  100
              )}
            </b>
          </div>
          <div className="text-gray-900">
            Total: {" "}
            <b className="text-lg text-emerald-600">₹{orderTotal}</b>
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg shadow-md"
          >
            Update Order
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditOrder;
