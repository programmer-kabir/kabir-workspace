import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiUser,
  FiMessageSquare,
  FiSend,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { CONTACT_INFO, getWhatsAppUrl } from "../../constants/links";

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

    const formattedMessage = `
নাম: ${form.name}
মোবাইল: ${form.phone}
ইমেইল: ${form.email || "দেওয়া হয়নি"}
বার্তা: ${form.message}
    `.trim();

    const url = getWhatsAppUrl(formattedMessage);
    window.open(url, "_blank");

    toast.success(
      "আপনার বার্তা WhatsApp-এ প্রস্তুত করা হয়েছে! খুব শীঘ্রই আমাদের টিম আপনার সাথে কথা বলবে।"
    );

    setForm({
      name: "",
      phone: "",
      email: "",
      message: "",
    });
  };

  return (
    <section id="contact" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/60">
      <div className=" mx-auto">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
            সরাসরি যোগাযোগ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            আমাদের সাথে কথা বলুন
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            কিস্তি বা বিনিয়োগ সংক্রান্ত যেকোনো প্রশ্ন বা সহায়তার জন্য মেসেজ পাঠান।
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200">
          {/* LEFT INFO PANEL */}
          <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/90 via-indigo-100/30 to-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-8 sm:p-10 relative flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-2">
                অফিস তথ্য
              </span>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">
                সরাসরি দেখা করুন
              </h3>
              <p className="mt-3 text-slate-600 text-xs sm:text-sm leading-relaxed">
                আমাদের সুনামগঞ্জ সদর অফিসে এসে সরাসরি পণ্য দেখে কিস্তি ও বিনিয়োগ আলোচনা করতে পারেন।
              </p>

              <div className="mt-8 space-y-5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <FiMapPin className="text-indigo-600 h-5 w-5 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">
                    {CONTACT_INFO.address}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <FiPhone className="text-indigo-600 h-4 w-4 shrink-0" />
                  <a
                    href={`tel:${CONTACT_INFO.callNumber}`}
                    className="text-slate-800 hover:text-indigo-600 font-bold transition"
                  >
                    {CONTACT_INFO.callNumber}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <FaWhatsapp className="text-emerald-600 h-4 w-4 shrink-0" />
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 font-bold transition"
                  >
                    {CONTACT_INFO.whatsappNumber}
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <FiMail className="text-purple-600 h-4 w-4 shrink-0" />
                  <span className="text-slate-700">{CONTACT_INFO.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-500 font-medium">
              অফিস খোলা: শনি - বৃহস্পতি (সকাল ৯:০০ - রাত ৮:০০)
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="lg:col-span-3 p-8 sm:p-10">
            <h4 className="font-bold text-lg text-slate-900 mb-6">
              মেসেজ লিখে WhatsApp-এ পাঠান
            </h4>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    আপনার নাম *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3.5 top-3.5 text-slate-400 h-4 w-4" />
                    <input
                      type="text"
                      name="name"
                      placeholder="যেমন: মোঃ করিম"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    মোবাইল নম্বর *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-3.5 text-slate-400 h-4 w-4" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="০১XXXXXXXXX"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ইমেইল (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-3.5 text-slate-400 h-4 w-4" />
                  <input
                    type="email"
                    name="email"
                    placeholder="example@gmail.com"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  আপনার বার্তা বা চাহিদা *
                </label>
                <div className="relative">
                  <FiMessageSquare className="absolute left-3.5 top-3 text-slate-400 h-4 w-4" />
                  <textarea
                    name="message"
                    rows="3"
                    placeholder="কোন পণ্য কিস্তিতে নিতে চান অথবা কত টাকা বিনিয়োগ করতে আগ্রহী তা সংক্ষেপে লিখুন..."
                    required
                    value={form.message}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm shadow-lg shadow-green-500/25 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                <FaWhatsapp className="h-4 w-4" />
                <span>WhatsApp-এ সরাসরি মেসেজ পাঠান</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
