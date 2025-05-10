import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../App";
import { assets } from "../assets/assets";

const AddProducts = ({ token }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "Men",
    subcategory: "Topwear",
    trending: false,
    sizes: [],
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input field updates
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle size selection
  const handleSizeToggle = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  // Handle image uploads and previews
  const handleImageUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Only image files are allowed.");
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image must be under 5MB.");
    }

    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];

    newImages[index] = file;
    newPreviews[index] = URL.createObjectURL(file);

    setFormData((prev) => ({ ...prev, images: newImages }));
    setImagePreviews(newPreviews);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!token) {
      return toast.error("Unauthorized. Admin token is missing.");
    }

    if (!formData.name || !formData.description || !formData.price) {
      return toast.error("Please fill in all required fields.");
    }

    if (formData.sizes.length === 0) {
      return toast.error("Select at least one size.");
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Uploading product...");

    try {
      const body = new FormData();
      body.append("name", formData.name.trim());
      body.append("description", formData.description.trim());
      body.append("price", formData.price);
      body.append("category", formData.category);
      body.append("subcategory", formData.subcategory);
      body.append("trending", formData.trending);
      body.append("sizes", JSON.stringify(formData.sizes));

      formData.images.forEach((file, idx) => {
        if (file) body.append(`image${idx + 1}`, file);
      });

      const res = await axios.post(`${backendUrl}/api/products/add`, body, {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Correct Authorization header
        },
      });

      if (res.data.success) {
        toast.update(toastId, {
          render: res.data.message,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
        resetForm();
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      toast.update(toastId, {
        render: err.message || "Product upload failed.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "Men",
      subcategory: "Topwear",
      trending: false,
      sizes: [],
      images: [],
    });
    setImagePreviews([]);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 p-6 bg-white rounded-lg border shadow"
    >
      <div>
        <p className="font-semibold text-lg mb-2">Upload Images</p>
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <label key={i} className="cursor-pointer">
              <div className="w-24 h-24 border-2 border-dashed rounded-md flex items-center justify-center overflow-hidden">
                {imagePreviews[i] ? (
                  <img
                    src={imagePreviews[i]}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <img
                    src={assets.upload_pic}
                    alt="Upload"
                    className="w-10 opacity-50"
                  />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => handleImageUpload(e, i)}
              />
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="font-medium text-gray-700">Product Name</label>
        <input
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter name"
          className="w-full mt-1 p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description"
          className="w-full mt-1 p-2 border rounded"
          required
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="font-medium text-gray-700">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
          >
            <option value="Unisex">Unisex</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="font-medium text-gray-700">Subcategory</label>
          <select
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
          >
            <option value="Topwear">Topwear</option>
            <option value="Dress">Dress</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Summerwear">Summerwear</option>
            <option value="Winterwear">Winterwear</option>
            <option value="Full-Set">Full-Set</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="font-medium text-gray-700">Price (£)</label>
          <input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded"
            placeholder="Enter price"
            required
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["S", "M", "L", "XL", "XXL"].map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => handleSizeToggle(size)}
            className={`px-4 py-2 rounded-md border ${
              formData.sizes.includes(size)
                ? "bg-black text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="trending"
          checked={formData.trending}
          onChange={handleChange}
        />
        <span className="text-gray-700">Add to trending</span>
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-44 py-3 rounded text-white transition ${
          isSubmitting
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-black hover:bg-gray-800"
        }`}
      >
        {isSubmitting ? "Uploading..." : "LIST PRODUCT"}
      </button>
    </form>
  );
};

export default AddProducts;
