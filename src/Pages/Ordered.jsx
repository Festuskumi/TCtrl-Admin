// Cache the products to localStorage to avoid repeated 404 errors
const cacheProducts = (productsData) => {
  try {
    const existingCache = JSON.parse(localStorage.getItem('cachedProducts') || '{}');
    const updatedCache = { ...existingCache, ...productsData };
    localStorage.setItem('cachedProducts', JSON.stringify(updatedCache));
  } catch (error) {
    console.error("Error caching products:", error);
  }
};

// Fetch individual product details on-demand
const fetchSingleProduct = async (productId) => {
  if (!token || !productId) return;
  
  try {
    const response = await axios.post(
      `${backendUrl}/api/products/single`,
      { productsId: productId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success && response.data.product) {
      setProducts(prev => {
        const updated = { ...prev, [productId]: response.data.product };
        // Also cache it
        cacheProducts({ [productId]: response.data.product });
        return updated;
      });
      return response.data.product;
    }
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error);
  }
  return null;
};import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { BadgeCheck, Package, RefreshCw, TruckIcon, Home, XCircle, Filter, Printer } from 'lucide-react';

const ORDER_STATUS = {
'Order Placed': { icon: <Package size={18} />, color: 'bg-blue-100 text-blue-800' },
'Packing': { icon: <RefreshCw size={18} />, color: 'bg-yellow-100 text-yellow-800' },
'Shipped': { icon: <TruckIcon size={18} />, color: 'bg-indigo-100 text-indigo-800' },
'Out for Delivery': { icon: <TruckIcon size={18} />, color: 'bg-purple-100 text-purple-800' },
'Delivered': { icon: <BadgeCheck size={18} />, color: 'bg-green-100 text-green-800' },
'Cancelled': { icon: <XCircle size={18} />, color: 'bg-red-100 text-red-800' }
};

const Ordered = ({ token }) => {
const [orders, setOrders] = useState([]);
const [filterStatus, setFilterStatus] = useState('all');
const [errorMsg, setErrorMsg] = useState('');
const [isLoading, setIsLoading] = useState(true);
const [searchQuery, setSearchQuery] = useState('');
const [sortBy, setSortBy] = useState('date');
const [sortOrder, setSortOrder] = useState('desc');
const [printingOrder, setPrintingOrder] = useState(null);
const [products, setProducts] = useState({});  // Store product details by ID
const printFrameRef = useRef(null);

const fetchAllOrders = async () => {
  if (!token) return;
  setIsLoading(true);

  try {
    const response = await axios.post(
      `${backendUrl}/api/order/list`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success && response.data.orders.length > 0) {
      const ordersData = response.data.orders;
      setOrders(ordersData);
      
      // Extract all unique product IDs from orders
      const productIds = new Set();
      ordersData.forEach(order => {
        order.products.forEach(product => {
          if (product.productId) {
            productIds.add(product.productId);
          }
        });
      });
      
      // Fetch product details for all IDs
      fetchProductDetails(Array.from(productIds));
      
      setErrorMsg('');
      console.log("✅ Orders fetched:", ordersData);
    } else {
      setOrders([]);
      toast.error(response.data.message || 'No orders found.');
      setErrorMsg('No orders found.');
    }
  } catch (error) {
    toast.error(error.message);
    console.error("❌ Fetch error:", error.response?.data || error.message);
    setErrorMsg(
      error.response?.data?.message || 'Error fetching orders. Check admin token.'
    );
  } finally {
    setIsLoading(false);
  }
};

const fetchProductDetails = async (productIds) => {
  try {
    // Use the endpoint from your productsRoute.js - should be POST /single with productId
    const productPromises = productIds.map(id => 
      axios.post(`${backendUrl}/api/products/single`, 
        { productsId: id },
        { headers: { Authorization: `Bearer ${token}` }}
      )
      .then(response => {
        if (response.data.success && response.data.product) {
          return response.data.product;
        }
        return null;
      })
      .catch(error => {
        console.log(`Product not found for ID: ${id}`);
        return null;
      })
    );
    
    const productResults = await Promise.allSettled(productPromises);
    
    // Create a lookup object with productId as key
    const productsLookup = {};
    productResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        productsLookup[productIds[index]] = result.value;
        // Cache the product
        cacheProducts({ [productIds[index]]: result.value });
      }
    });
    
    setProducts(prev => ({...prev, ...productsLookup}));
  } catch (error) {
    console.error("Error fetching product details:", error);
  }
};

// Get product name from productId
const getProductName = (productId) => {
  // If we have the product in our lookup
  if (products[productId]?.name) {
    return products[productId].name;
  }
  
  // If we don't have the product yet, check if we have a cached version in localStorage
  try {
    const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '{}');
    if (cachedProducts[productId]) {
      return cachedProducts[productId].name;
    }
  } catch (error) {
    console.error("Error retrieving from cache:", error);
  }
  
  // Return a fallback based on ID if we have nothing else
  return productId ? `Product ${productId.slice(-6)}` : 'Unknown Product';
};

const handleStatusChange = async (orderId, newStatus) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/order/status`,
      { orderId, status: newStatus },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.data.success) {
      toast.success("✅ Order status updated!");
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } else {
      toast.error(response.data.message || "❌ Failed to update status.");
    }
  } catch (error) {
    toast.error(error.message);
    console.error("❌ Status update error:", error.response?.data || error.message);
  }
};

const printOrder = (order) => {
  setPrintingOrder(order);
  setTimeout(() => {
    if (printFrameRef.current) {
      try {
        const printContent = printFrameRef.current;
        const windowPrint = window.open('', '', 'height=600,width=800');
        windowPrint.document.write('<html><head><title>Order #' + order._id + '</title>');
        windowPrint.document.write('<style>');
        windowPrint.document.write(`
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .print-wrapper { max-width: 800px; margin: 0 auto; }
          .order-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-weight: bold; font-size: 24px; }
          .order-id { font-family: monospace; color: #666; }
          .order-date { color: #666; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 15px; font-weight: bold; }
          .customer-info { margin-bottom: 20px; }
          .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #333; }
          .address { margin-bottom: 15px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th { text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
          .items-table td { padding: 8px; border-bottom: 1px solid #eee; }
          .total-section { display: flex; justify-content: space-between; font-weight: bold; margin-top: 20px; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          @media print {
            body { padding: 0; }
            .print-wrapper { max-width: 100%; }
          }
        `);
        windowPrint.document.write('</style></head><body>');
        windowPrint.document.write(printContent.innerHTML);
        windowPrint.document.write('</body></html>');
        windowPrint.document.close();
        windowPrint.focus();
        windowPrint.onload = function() {
          windowPrint.print();
          windowPrint.close();
        };
      } catch (error) {
        console.error("Error printing:", error);
        toast.error("Failed to print order. Try again.");
      } finally {
        setPrintingOrder(null);
      }
    }
  }, 100);
};

useEffect(() => {
  fetchAllOrders();
  
  // Load cached products from localStorage
  try {
    const cachedProducts = JSON.parse(localStorage.getItem('cachedProducts') || '{}');
    if (Object.keys(cachedProducts).length > 0) {
      setProducts(cachedProducts);
    }
  } catch (error) {
    console.error("Error loading cached products:", error);
  }
}, [token]);

// Filter and sort orders
const processedOrders = orders
  .filter((order) => {
    const statusMatch = filterStatus === 'all' ? true : order.status === filterStatus;
    const searchMatch = searchQuery === '' ? true : (
      (order.address?.firstName?.toLowerCase() + ' ' + order.address?.lastName?.toLowerCase()).includes(searchQuery.toLowerCase()) ||
      order.address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.products.some(product => 
        getProductName(product.productId).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
    return statusMatch && searchMatch;
  })
  .sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'amount') {
      return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    return 0;
  });

return (
  <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
    {/* Hidden print frame */}
    <div className="hidden">
      <div ref={printFrameRef}>
        {printingOrder && (
          <div className="print-wrapper">
            <div className="order-header">
              <div>
                <div className="logo">TCTRL Fashion</div>
                <div className="order-id">Order #: {printingOrder._id}</div>
                <div className="order-date">Date: {new Date(printingOrder.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</div>
              </div>
              <div>
                <div className={`status ${
                  printingOrder.status === 'Delivered' ? 'bg-green-100' : 
                  printingOrder.status === 'Cancelled' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {printingOrder.status}
                </div>
              </div>
            </div>

            <div className="customer-info">
              <div className="section-title">Customer Information</div>
              <div className="address">
                <strong>Name:</strong> {printingOrder.address?.firstName} {printingOrder.address?.lastName}<br />
                <strong>Phone:</strong> {printingOrder.address?.phone}<br />
                <strong>Address:</strong> {printingOrder.address?.street}, {printingOrder.address?.city}, {printingOrder.address?.county}, {printingOrder.address?.postcode}, {printingOrder.address?.country}
              </div>
            </div>

            <div className="section-title">Order Items</div>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {printingOrder.products.map((item, i) => (
                  <tr key={i}>
                    <td>{getProductName(item.productId)}</td>
                    <td>{item.size}</td>
                    <td>{item.quantity}</td>
                    <td>{currency}{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="payment-info">
              <div className="section-title">Payment Information</div>
              <div><strong>Method:</strong> {printingOrder.paymentMethod}</div>
              <div><strong>Status:</strong> {printingOrder.payment ? 'Paid' : 'Pending'}</div>
            </div>

            <div className="total-section">
              <div>Total Amount</div>
              <div>{currency}{printingOrder.amount.toFixed(2)}</div>
            </div>

            <div className="footer">
              Thank you for shopping with TCTRL Fashion!
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Management</h2>
        
        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter size={16} className="text-gray-400" />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 h-10"
            >
              <option value="all">All Orders</option>
              {Object.keys(ORDER_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, product, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 h-10"
            />
          </div>
          
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 h-10"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            
            <button
              onClick={fetchAllOrders}
              className="px-3 py-2 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition"
              aria-label="Refresh orders"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Order Count */}
        <p className="text-gray-600 mb-4">
          {processedOrders.length} {processedOrders.length === 1 ? 'order' : 'orders'} found
        </p>
        
        {errorMsg && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {processedOrders.map((order) => (
              <div key={order._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                {/* Order Header */}
                <div className="border-b p-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono text-xs text-gray-500">#{order._id?.slice(-6)}</span>
                      <p className="font-medium">{new Date(order.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full flex items-center space-x-1 ${ORDER_STATUS[order.status]?.color}`}>
                      {ORDER_STATUS[order.status]?.icon}
                      <span className="text-sm font-medium">{order.status}</span>
                    </div>
                  </div>
                  
                  {/* Product Summary - Quick View */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {order.products.map((product, idx) => (
                      <div key={idx} className="bg-white border rounded px-2 py-1 text-xs font-medium flex items-center">
                        <span className="truncate max-w-40">{getProductName(product.productId)}</span>
                        <span className="ml-1 text-gray-500">({product.size}) x{product.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Order Content */}
                <div className="p-4">
                  {/* Customer Info */}
                  <div className="mb-4 flex items-start">
                    <img src={assets.parcel} alt="order" className="w-16 h-16 object-cover rounded mr-3" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {order.address?.firstName} {order.address?.lastName}
                      </h3>
                      <p className="text-gray-600 text-sm">{order.address?.phone}</p>
                      <p className="text-gray-600 text-sm">
                        {order.address?.city}, {order.address?.county}
                      </p>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="mb-4 border-t border-b py-3">
                    <h4 className="font-medium mb-2">Order Items ({order.products.length})</h4>
                    <div className="space-y-3 max-h-44 overflow-y-auto pr-1">
                      {order.products.map((item, i) => (
                        <div key={i} className="flex items-start border-b border-gray-100 pb-2">
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <span className="font-bold text-gray-800">
                                {getProductName(item.productId)}
                              </span>
                              <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700 ml-2">
                                x{item.quantity}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium rounded">
                                Size: {item.size}
                              </span>
                              {item.color && (
                                <span className="inline-block bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-medium rounded">
                                  Color: {item.color}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ID: {item.productId?.slice(-6)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Payment Info */}
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm border rounded-md p-3 bg-gray-50">
                      <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="font-medium">{order.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Status</p>
                        <p className={`font-medium ${order.payment ? 'text-green-600' : 'text-yellow-600'}`}>
                          {order.payment ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Total Amount</p>
                        <p className="text-xl font-bold">{currency}{order.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* Single Shipping Address */}
                    {order.address && (
                      <div className="rounded-md border border-blue-100 bg-blue-50 p-3 mt-3">
                        <h4 className="font-medium text-blue-800 mb-1 text-sm">Shipping Details</h4>
                        <p className="text-sm">
                          {order.address.street}, {order.address.city}, {order.address.postcode}
                        </p>
                        {order.shippingMethod && (
                          <p className="text-xs text-blue-700 mt-1">
                            Via: {order.shippingMethod}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="pt-2 border-t">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Update Status
                        </label>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        >
                          {Object.keys(ORDER_STATUS).map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      
                      <button 
                        onClick={() => printOrder(order)} 
                        className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm flex items-center"
                        aria-label="Print order"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && processedOrders.length === 0 && !errorMsg && (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-700">No orders found</h3>
            <p className="text-gray-500">Try changing your filters or check back later</p>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default Ordered;