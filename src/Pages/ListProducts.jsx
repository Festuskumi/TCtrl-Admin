import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { Search, Filter, Edit, Trash2, Save, X, ChevronUp, ChevronDown, Plus, RefreshCw } from "lucide-react";

const ListProducts = ({ token }) => {
  const [listProducts, setListProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [updatedProduct, setUpdatedProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "ascending" });
  const [filterCategory, setFilterCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all products from the backend
  const fetchListProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${backendUrl}/api/products/list`);
      if (response.data.success) {
        setListProducts(response.data.products);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(response.data.products.map(product => product.category))];
        setCategories(uniqueCategories);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Refresh products with animation
  const refreshProducts = async () => {
    setIsRefreshing(true);
    await fetchListProducts();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Delete product with confirmation
  const confirmDelete = (id) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const deleteProduct = async () => {
    try {
      const response = await axios.delete(`${backendUrl}/api/products/delete/${productToDelete}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setListProducts((prev) => prev.filter((product) => product._id !== productToDelete));
        setSelectedProducts((prev) => prev.filter((id) => id !== productToDelete));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete product");
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  // Bulk delete selected products
  const bulkDeleteProducts = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      const deletedCount = { success: 0, failed: 0 };
      
      // Create an array of promises for all delete operations
      const deletePromises = selectedProducts.map(async (id) => {
        try {
          const response = await axios.delete(`${backendUrl}/api/products/delete/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (response.data.success) {
            deletedCount.success++;
            return id;
          } else {
            deletedCount.failed++;
            return null;
          }
        } catch (error) {
          deletedCount.failed++;
          return null;
        }
      });
      
      // Wait for all delete operations to complete
      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter(id => id !== null);
      
      // Update the product list by removing successfully deleted products
      setListProducts(prev => prev.filter(product => !successfulDeletes.includes(product._id)));
      setSelectedProducts([]);
      
      toast.success(`Successfully deleted ${deletedCount.success} products ${deletedCount.failed > 0 ? `(${deletedCount.failed} failed)` : ''}`);
    } catch (error) {
      console.error(error);
      toast.error("Bulk delete operation failed");
    }
  };

  // Start editing product
  const startEditing = (product) => {
    setEditingProduct(product._id);
    setUpdatedProduct({ ...product });
  };

  // Handle input field updates
  const handleUpdateChange = (e) => {
    const { name, value, type } = e.target;
    setUpdatedProduct({
      ...updatedProduct,
      [name]: type === "number" ? parseFloat(value) : value,
    });
  };

  // Save updated product details
  const saveUpdatedProduct = async () => {
    try {
      // Form validation
      if (!updatedProduct.name || !updatedProduct.category || !updatedProduct.price) {
        toast.error("Please fill in all required fields");
        return;
      }

      const response = await axios.put(
        `${backendUrl}/api/products/update/${editingProduct}`,
        updatedProduct,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        // Update the product directly in the state
        setListProducts(prev => 
          prev.map(product => 
            product._id === editingProduct ? { ...product, ...updatedProduct } : product
          )
        );
        setEditingProduct(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product");
    }
  };

  // Handle select all products
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allProductIds = filteredProducts.map(product => product._id);
      setSelectedProducts(allProductIds);
    } else {
      setSelectedProducts([]);
    }
  };

  // Handle individual product selection
  const handleSelectProduct = (e, productId) => {
    if (e.target.checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    }
  };

  // Sort products
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Create derived state for filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filteredItems = [...listProducts];
    
    // Apply search filter
    if (searchTerm) {
      filteredItems = filteredItems.filter(
        product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filterCategory) {
      filteredItems = filteredItems.filter(
        product => product.category === filterCategory
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filteredItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filteredItems;
  }, [listProducts, searchTerm, filterCategory, sortConfig]);

  // Get current products for pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Load products on component mount
  useEffect(() => {
    fetchListProducts();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Product Management</h2>
        <button 
          onClick={refreshProducts}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          {selectedProducts.length > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 transition"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Selected ({selectedProducts.length})</span>
            </button>
          )}
          <button
            onClick={() => {
              const element = document.createElement('a');
              const csvContent = [
                ['Product ID', 'Name', 'Category', 'Price'],
                ...filteredProducts.map(p => [p._id, p.name, p.category, p.price])
              ].map(e => e.join(',')).join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              element.href = URL.createObjectURL(blob);
              element.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
              toast.success("Products exported to CSV");
            }}
            className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-md hover:bg-green-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Product Table */}
      <div className="w-full overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left">Image</th>
              <th 
                className="px-4 py-3 text-left cursor-pointer"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center">
                  <span>Name</span>
                  {sortConfig.key === 'name' && (
                    sortConfig.direction === 'ascending' ? 
                    <ChevronUp className="h-4 w-4 ml-1" /> : 
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left cursor-pointer"
                onClick={() => requestSort('category')}
              >
                <div className="flex items-center">
                  <span>Category</span>
                  {sortConfig.key === 'category' && (
                    sortConfig.direction === 'ascending' ? 
                    <ChevronUp className="h-4 w-4 ml-1" /> : 
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left cursor-pointer"
                onClick={() => requestSort('price')}
              >
                <div className="flex items-center">
                  <span>Price</span>
                  {sortConfig.key === 'price' && (
                    sortConfig.direction === 'ascending' ? 
                    <ChevronUp className="h-4 w-4 ml-1" /> : 
                    <ChevronDown className="h-4 w-4 ml-1" />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-6">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500">Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : currentProducts.length > 0 ? (
              currentProducts.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(item._id)}
                      onChange={(e) => handleSelectProduct(e, item._id)}
                      className="w-4 h-4 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <img
                      src={item.image?.[0] || "/default-image.png"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md border"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/default-image.png";
                      }}
                    />
                  </td>

                  {editingProduct === item._id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          name="name"
                          value={updatedProduct.name}
                          onChange={handleUpdateChange}
                          className="border px-2 py-1 rounded-md w-full"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          name="category"
                          value={updatedProduct.category}
                          onChange={handleUpdateChange}
                          className="border px-2 py-1 rounded-md w-full"
                        >
                          {categories.map((category, index) => (
                            <option key={index} value={category}>
                              {category}
                            </option>
                          ))}
                          <option value="new">+ Add New Category</option>
                        </select>
                        {updatedProduct.category === "new" && (
                          <input
                            type="text"
                            name="category"
                            placeholder="Enter new category"
                            onChange={handleUpdateChange}
                            className="mt-2 border px-2 py-1 rounded-md w-full"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            {currency}
                          </span>
                          <input
                            type="number"
                            name="price"
                            value={updatedProduct.price}
                            onChange={handleUpdateChange}
                            className="pl-8 border px-2 py-1 rounded-md w-full"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={saveUpdatedProduct}
                            className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 transition"
                          >
                            <Save className="h-4 w-4" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingProduct(null)}
                            className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600 transition"
                          >
                            <X className="h-4 w-4" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">{currency}{item.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => startEditing(item)}
                            className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => confirmDelete(item._id)}
                            className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No products found. {searchTerm || filterCategory ? "Try adjusting your filters." : ""}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredProducts.length > productsPerPage && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-600">
            Showing {indexOfFirstProduct + 1} to {Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Prev
            </button>
            {[...Array(totalPages).keys()].map((number) => (
              <button
                key={number + 1}
                onClick={() => paginate(number + 1)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === number + 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {number + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-700 mb-6">
              {selectedProducts.length > 0 
                ? `Are you sure you want to delete ${selectedProducts.length} selected products? This action cannot be undone.`
                : "Are you sure you want to delete this product? This action cannot be undone."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={selectedProducts.length > 0 ? bulkDeleteProducts : deleteProduct}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProducts;