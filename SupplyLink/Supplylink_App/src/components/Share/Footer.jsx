const footerSections = [
  {
    title: "সেবা সমূহ",
    links: [
      { label: "সাপোর্ট", href: "/support" },
      { label: "ক্লায়েন্ট পোর্টাল", href: "/client-portal" },
      { label: "রিসোর্স", href: "/resources" },
    ],
  },
  {
    title: "কোম্পানি",
    links: [
      { label: "আমাদের সম্পর্কে", href: "/about" },
      { label: "ক্যারিয়ার", href: "/careers" },
      { label: "ব্লগ", href: "/blogs" },
      { label: "পোর্টফোলিও", href: "/portfolio" },
      { label: "ইভেন্ট", href: "/events" },
    ],
  },
  {
    title: "অতিরিক্ত",
    links: [
      { label: "প্রশ্নোত্তর", href: "/faq" },
      { label: "পার্টনার", href: "/partners" },
      { label: "যোগাযোগ", href: "/contact" },
      { label: "নিউজ", href: "/news" },
    ],
  },
  {
    title: "নীতিমালা",
    links: [
      { label: "শর্তাবলী", href: "/terms-and-conditions" },
      { label: "কপিরাইট নোটিশ", href: "/copyright-notice" },
      { label: "ব্যবহারকারী চুক্তি", href: "/user-agreement" },
      { label: "ডাটা প্রাইভেসি নীতি", href: "/data-privacy-policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="tracking-wide bg-slate-100 px-8 sm:px-12 pt-12 pb-6">
      {/* <div className="max-w-7xl mx-auto grid min-[1200px]:grid-cols-3 gap-12 xl:gap-16">
        <div className="min-[1200px]:max-w-sm max-w-lg w-full">
          <Link href="/">
            <Image
              src="https://app.supplylinkbd.com/uploads/sl_logo.png"
              alt="SupplyLink"
              width={140}
              height={40}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
            />
          </Link>

          <div className="mt-6">
            <p className="text-slate-600 leading-relaxed text-sm">
              SupplyLink একটি আধুনিক প্ল্যাটফর্ম যা ব্যবসা ও বিনিয়োগকারীদের
              সংযুক্ত করে। আমরা সহজ, নিরাপদ এবং দ্রুত সেবা প্রদান করি।
            </p>
          </div>
        </div>

        <div className="min-[1200px]:col-span-2 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="text-slate-900 font-semibold text-base">
                {section.title}
              </h4>
              <ul className="mt-6 space-y-4">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div> */}

      {/* <hr className="mt-10 mb-6 border-gray-300" /> */}

      {/* Bottom Section */}
      <div className="py-6 border-t border-slate-200 text-center">
  <p className="text-slate-600 text-sm">
    © {new Date().getFullYear()} SupplyLink. সর্বস্বত্ব সংরক্ষিত।
  </p>
</div>
    </footer>
  );
}
