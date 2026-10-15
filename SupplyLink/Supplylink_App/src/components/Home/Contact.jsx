import { useState } from "react";
import toast from "react-hot-toast";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiMessageSquare,
  FiSend,
} from "react-icons/fi";

export default function Contact() {
const [form, setForm] = useState({
  name: "",
  phone: "",
  email: "",
  message: "",
});
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = (e) => {
  e.preventDefault();

  const message = `
নাম: ${form.name}
মোবাইল: ${form.phone}
ইমেইল: ${form.email}
বার্তা: ${form.message}
  `;

  const whatsappNumber = "8801339631586";

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");

  // ✅ Toast message
  toast.success("আপনার বার্তা পাঠানো হয়েছে! খুব শীঘ্রই আমাদের টিম আপনার সাথে যোগাযোগ করবে।");
  // ✅ form reset
  setForm({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
};
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        {/* Title */}
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">
            আমাদের সাথে যোগাযোগ করুন
          </h2>
          <p className="text-gray-600 mt-3">
            যেকোনো তথ্য বা সহায়তার জন্য আমাদের সাথে যোগাযোগ করতে পারেন
          </p>
        </div>

        <div className="grid lg:grid-cols-5 rounded-2xl overflow-hidden shadow-xl bg-white">

          {/* LEFT INFO */}
          <div className="lg:col-span-2 bg-indigo-700 text-white px-4 py-10 md:p-10 relative">
            <h3 className="text-2xl font-semibold">যোগাযোগের তথ্য</h3>

            <p className="mt-4 text-indigo-200 text-sm">
              আমরা সর্বদা আপনাকে সহায়তা করতে প্রস্তুত
            </p>

            <div className="mt-12 space-y-8">
              <div className="flex items-center gap-4">
                <FiMail />
                <span>supplylinkbdltd@gmail.com</span>
              </div>

              <div className="flex items-center gap-4">
                <FiPhone />
                <span>+8801941145876</span>
              </div>

              <div className="flex items-center gap-4">
                <FiMapPin />
                <span>
                  রফিক মঞ্জিল, মঙ্গলকাটা, সুনামগঞ্জ সদর, সুনামগঞ্জ
                </span>
              </div>
            </div>

            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500 rounded-full opacity-40"></div>
          </div>

          {/* FORM */}
          <div className="lg:col-span-3 px-4 py-10 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="grid md:grid-cols-2 gap-6">
            <div>
                  <div className="relative">
                  <FiUser className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    placeholder="নাম"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border-b border-gray-300 py-3 pr-10 focus:border-indigo-600 outline-none"
                  />
                </div>

            </div>
              

                <div className="relative">
                  <FiPhone className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="মোবাইল নাম্বার"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border-b border-gray-300 py-3 pr-10 focus:border-indigo-600 outline-none"
                  />
                </div>

                <div className="relative md:col-span-2">
                  <FiMail className="absolute right-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    placeholder="ইমেইল ঠিকানা"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border-b border-gray-300 py-3 pr-10 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>


              <div className="relative">
                <FiMessageSquare className="absolute right-3 top-3 text-gray-400" />
                <textarea
                  name="message"
                  rows="4"
                  placeholder="আপনার বার্তা লিখুন"
                  required
                  value={form.message}
                  onChange={handleChange}
                  className="w-full border-b border-gray-300 py-3 pr-10 focus:border-indigo-600 outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300"
              >
                <FiSend />
                বার্তা পাঠান
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}