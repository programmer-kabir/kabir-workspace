import React, { useState } from "react";
import { useForm } from "react-hook-form";

import {
  Package,
  DollarSign,
  FileText,
  StickyNote,
  Boxes,
  CloudUpload,
} from "lucide-react";
import { toast } from "react-toastify";

const CreateSalesItem = () => {
  const { register, handleSubmit, reset } = useForm();
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [qty, setQty] = useState(1);
  const handleImageChange = (e) => {
    const file = e.target.files[0];

    console.log(file);

    if (file) {
      setSelectedFile(file);

      setPreviewImage(URL.createObjectURL(file));
    }
  };
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      formData.append("product_name", data.product_name || "");

      formData.append("mrp", data.mrp || 0);

      formData.append("purchase_price", data.purchase_price || 0);

      formData.append("sale_price", data.sale_price || 0);

      formData.append("description", data.description || "");

      formData.append("remarks", data.remarks || "");
      formData.append("additional_cost", data.additional_cost || 1);
      formData.append("qty", qty);
      console.log(selectedFile);
      if (selectedFile) {
        formData.append("memo", selectedFile);
      }
      // DEBUG


      const response = await fetch(
        "https://auditing.supplylinkbd.com/api_v1/sales_items/create_sales_items.php",
        {
          method: "POST",
          body: formData,
        },
      );

      const text = await response.text();
      const result = JSON.parse(text);
if (result.success) {
  toast.success(result.message);
  reset()
} else {
  toast.error(result.message);
}

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#071827] p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-[#141C30]
                     border border-[#1b3354]
                     rounded-3xl
                     p-6 md:p-8"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Create Sales Item</h1>

            <p className="text-slate-400 mt-2">
              Add new sales item information
            </p>
          </div>

          {/* Product Information */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Package size={20} className="text-cyan-400" />

              <h2 className="text-xl font-semibold">Product Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Product Name */}
              {/* Product Name */}
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm text-slate-300">
                  Product Name
                </label>

                <div className="relative">
                  <Boxes
                    size={18}
                    className="absolute left-4 top-1/2
                               -translate-y-1/2
                               text-slate-400"
                  />

                  <input
                    type="text"
                    placeholder="Product Name"
                    {...register("product_name")}
                    className="
                    w-full
                    bg-[#0F1B2D]
                    border border-[#213554]
                    rounded-2xl
                    pl-12 pr-4 py-4
                    text-white
                    placeholder:text-slate-500
                    outline-none
                    
                    transition-all
                    "
                  />
                </div>
              </div>
              <div className="md:col-span-1">
                <label className="block mb-2 text-sm text-slate-300">
    Qty
  </label>

  <div className="flex items-center bg-[#0F1B2D] border border-[#213554] rounded-2xl overflow-hidden">
    <button
      type="button"
      onClick={() => setQty(Math.max(1, qty - 1))}
      className="px-4 py-4 text-xl font-bold hover:bg-[#16263d]"
    >
      −
    </button>

    <input
      type="text"
      value={qty}
      readOnly
      className="flex-1 text-center bg-transparent outline-none"
    />

    <button
      type="button"
      onClick={() => setQty(qty + 1)}
      className="px-4 py-4 text-xl font-bold hover:bg-[#16263d]"
    >
      +
    </button>
  </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* MRP */}
              <div>
                <label className="block mb-2 text-sm text-slate-300">MRP</label>

                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-4 top-1/2
                               -translate-y-1/2
                               text-slate-400"
                  />

                  <input
                    type="number"
                    placeholder="MRP"
                    {...register("mrp")}
                    className="
                    w-full
                    bg-[#0F1B2D]
                    border border-[#213554]
                    rounded-2xl
                    pl-12 pr-4 py-4
                    text-white
                    placeholder:text-slate-500
                    outline-none
                    
                    transition-all
                    "
                  />
                </div>
              </div>
              {/* Purchase Price */}
              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  Purchase Price
                </label>

                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-4 top-1/2
                               -translate-y-1/2
                               text-slate-400"
                  />

                  <input
                    type="number"
                    placeholder="Purchase Price"
                    {...register("purchase_price")}
                    className="
                    w-full
                    bg-[#0F1B2D]
                    border border-[#213554]
                    rounded-2xl
                    pl-12 pr-4 py-4
                    text-white
                    placeholder:text-slate-500
                    outline-none
                    
                    transition-all
                    "
                  />
                </div>
              </div>
              {/* Sale Price */}
              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  Sale Price
                </label>

                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-4 top-1/2
                               -translate-y-1/2
                               text-slate-400"
                  />

                  <input
                    type="number"
                    placeholder="Sale Price"
                    {...register("sale_price")}
                    className="
                    w-full
                    bg-[#0F1B2D]
                    border border-[#213554]
                    rounded-2xl
                    pl-12 pr-4 py-4
                    text-white
                    placeholder:text-slate-500
                    outline-none
                    
                    transition-all
                    "
                  />
                </div>
              </div>
              {/* Additoanl cost */}
              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  Additional Cost
                </label>

                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-4 top-1/2
                               -translate-y-1/2
                               text-slate-400"
                  />

                  <input
                    type="number"
                    placeholder=" Extra Cost "
                    {...register("additional_cost")}
                    className="
                    w-full
                    bg-[#0F1B2D]
                    border border-[#213554]
                    rounded-2xl
                    pl-12 pr-4 py-4
                    text-white
                    placeholder:text-slate-500
                    outline-none
                    
                    transition-all
                    "
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-6">
              <StickyNote size={20} className="text-yellow-400" />

              <h2 className="text-xl font-semibold">Additional Notes</h2>
            </div>

            <div className="space-y-5">
              {/* Memo */}
              <div>
                <label className="block mb-3 text-sm text-slate-300">
                  Product Image
                </label>

                <label
                  htmlFor="product_image"
                  className="
    w-full
    min-h-[260px]
    border
    border-dashed
    border-[#334155]
    rounded-2xl
    bg-[#1e293b]
    hover:border-blue-500
    transition-all
    cursor-pointer
    flex
    flex-col
    items-center
    justify-center
    text-center
    px-6
    py-10
    overflow-hidden
    relative
    group
    "
                >
                  {previewImage ? (
                    <>
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="
          absolute
          inset-0
          w-full
          h-full
          object-cover
          "
                      />

                      <div
                        className="
          absolute
          inset-0
          bg-black/50
          opacity-0
          group-hover:opacity-100
          transition-all
          flex
          flex-col
          items-center
          justify-center
          "
                      >
                        <CloudUpload size={40} className="text-white mb-3" />

                        <p className="text-white font-medium">Change Image</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CloudUpload size={42} className="text-slate-400 mb-4" />

                      <p className="text-slate-300 font-medium text-lg">
                        Click to upload or drag and drop
                      </p>

                      <p className="text-slate-500 text-sm mt-2">
                        SVG, PNG, JPG or GIF (MAX. 800x400px)
                      </p>
                    </>
                  )}

                  <input
                    id="product_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Description */}
              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  Description
                </label>

                <textarea
                  rows={5}
                  placeholder="Write description..."
                  {...register("description")}
                  className="
                  w-full
                  bg-[#0F1B2D]
                  border border-[#213554]
                  rounded-2xl
                  px-4 py-4
                  text-white
                  placeholder:text-slate-500
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  transition-all
                  "
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block mb-2 text-sm text-slate-300">
                  Remarks
                </label>

                <textarea
                  rows={4}
                  placeholder="Write remarks..."
                  {...register("remarks")}
                  className="
                  w-full
                  bg-[#0F1B2D]
                  border border-[#213554]
                  rounded-2xl
                  px-4 py-4
                  text-white
                  placeholder:text-slate-500
                  outline-none
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-500/20
                  transition-all
                  "
                />
              </div>
            </div>
          </div>

          {/* Button */}
          <div className="mt-10">
            <button
              type="submit"
              className="
              w-full
              bg-gradient-to-r
              from-blue-600
              via-indigo-600
              to-violet-600
              hover:brightness-110
              transition-all
              py-4
              rounded-2xl
              font-semibold
              text-lg
              "
            >
              Create Sales Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSalesItem;
