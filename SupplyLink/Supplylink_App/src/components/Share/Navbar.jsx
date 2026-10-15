import React, { useEffect, useState } from 'react'
import Content from "./Content";
import { FiSearch, FiMenu, FiX } from "react-icons/fi";
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { name: "হোম", href: "#hero" },
  { name: "পণ্যসমূহ", href: "#product" },
  { name: "ইনভেস্ট করুন", href: "#invest" },
  { name: "কিভাবে কাজ করে", href: "#how-it-works" },
  { name: "আমাদের সম্পর্কে", href: "#about" },
  { name: "যোগাযোগ", href: "#contact" },
];

const Navbar = () => {
   const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const handleScroll = (id) => {
    const element = document.getElementById(id);
    const navbarHeight = 80; // তোমার navbar height

    if (element) {
      const elementPosition =
        element.getBoundingClientRect().top + window.pageYOffset;

      window.scrollTo({
        top: elementPosition - navbarHeight,
        behavior: "smooth",
      });
    }
  };

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => (document.body.style.overflow = "");
  }, [open])
  return (
    <header
      className={`fixed top-0 left-0 w-full  z-[100] transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg py-3 border border-gray-300"
          : "bg-white py-4  "
      }`}
    >
      <Content>
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
             <img
    src="https://app.supplylinkbd.com/uploads/sl_logo.png"
    alt="SupplyLink"
    className="h-10 object-contain"
  />
          </Link>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <li key={l.name}>
                <Link
                  onClick={() => handleScroll(l.href)}
                  to={l.href}
                  className="relative text-[15px] font-medium text-gray-700 transition hover:text-black
                  after:content-[''] after:absolute after:left-1/2 after:-bottom-1 after:h-[2px]
                  after:w-0 after:bg-black after:transition-all after:duration-500
                  hover:after:w-full hover:after:left-0"
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Desktop Search */}
            <div className="relative hidden md:block">
              <input
                className="h-9 w-64 rounded-md bg-gray-100 px-4 pr-10 text-sm outline-none
                focus:bg-white focus:ring-2 focus:ring-black/10 transition"
                placeholder="কি খুঁজছেন?"
              />
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
            >
              <FiMenu className="text-xl" />
            </button>
          </div>
        </nav>
      </Content>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-[90] md:hidden transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
<div
  onClick={() => setOpen(false)}
  className="fixed inset-0 bg-black/30 z-[90]"
/>

        {/* Drawer */}
<aside
  onClick={(e) => e.stopPropagation()}
  className={`fixed right-0 top-0 z-[95] h-screen w-full bg-white shadow-2xl
  transition-transform duration-500 ${
    open ? "translate-x-0" : "translate-x-full"
  }`}
>
          <div className="flex items-center justify-between border-b p-4">
            <span className="font-semibold text-lg">মেনু</span>
            <button onClick={() => setOpen(false)}>
              <FiX className="text-xl" />
            </button>
          </div>

          <ul className="p-4 space-y-4">
            {NAV_LINKS.map((l) => (
              <li key={l.name}>
                <Link
                  to={l.href}
                  onClick={() => setOpen(false)}
                  className="block text-gray-700 font-medium hover:text-black transition"
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </header>
  )
}

export default Navbar