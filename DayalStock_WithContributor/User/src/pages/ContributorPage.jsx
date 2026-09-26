import { CheckCircle2, DollarSign, Globe, TrendingUp, ArrowRight, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "../utlis/Hooks/useAuth";
import { toast } from "react-toastify";
import { applyContributor } from "../api/api";

const ContributorPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);



  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/users/get_user_details_by_email.php`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();

        if (data.success) {
          setUserData(data.data);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [user]);

  const handleApplyClick = () => {
    if (!user) {
      toast.info("Please login to your account first to apply as a contributor.");
      navigate("/login", { state: { from: "/become-contributor" } });
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] font-sans transition-colors duration-300">
      {/* Hero Section */}
      <section className="bg-orange-50 dark:bg-[#03243D] text-gray-900 dark:text-white py-24 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Share Your Creativity. <span className="text-orange-500">Build Your Portfolio.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed transition-colors">
            Join the Dayal Stock contributor community. Upload your photos, vectors, and videos to showcase your work globally. Exciting earning opportunities are coming soon!
          </p>
          <button
            onClick={handleApplyClick}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all"
          >
            Become a Contributor <ArrowRight size={20} />
          </button>
        </div>

        {/* Background Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none z-0">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-orange-500 blur-3xl"></div>
          <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-blue-500 blur-3xl"></div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">Why Contribute to Dayal Stock?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
            We provide the best tools and audience for creators to monetize their passion and build a sustainable income.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <BenefitCard
            icon={<Globe size={40} className="text-blue-500" />}
            title="Global Audience"
            description="Showcase your portfolio to millions of active users, agencies, and top brands searching for high-quality assets daily."
          />
          <BenefitCard
            icon={<DollarSign size={40} className="text-green-500" />}
            title="Future Earning Potential"
            description="We are currently building our platform. Soon, we will introduce a transparent royalty system where you can track your earnings directly from your dashboard."
          />
          <BenefitCard
            icon={<TrendingUp size={40} className="text-orange-500" />}
            title="Real-Time Analytics"
            description="Track your performance, see what’s trending, and optimize your portfolio using our advanced contributor dashboard."
          />
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-gray-50 dark:bg-[#111] py-24 border-y border-gray-200 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">How It Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 transition-colors">Three simple steps to start your creative journey.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -translate-y-1/2 z-0 transition-colors"></div>

            <StepCard
              number="1"
              title="Create Account"
              description="Sign up for free as a contributor. Setup your profile and portfolio in minutes."
            />
            <StepCard
              number="2"
              title="Upload Content"
              description="Upload your high-quality photos, vectors, PSDs, or videos through our easy-to-use platform."
            />
            <StepCard
              number="3"
              title="Prepare for Launch"
              description="Your approved content goes live for the world to see. Stay tuned for our upcoming monetization announcement."
            />
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">What We Look For</h2>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">Ensure your content meets our quality standards to get approved faster.</p>
        </div>

        <div className="bg-gray-50 dark:bg-[#111] rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-8 transition-colors duration-300">
          <ul className="space-y-4">
            <RequirementItem text="High-resolution images (Minimum 4MP)" />
            <RequirementItem text="Original artwork and designs (No copyrighted material)" />
            <RequirementItem text="Clean, well-organized vector files (EPS/AI)" />
            <RequirementItem text="Properly tagged and titled content for better search visibility" />
            <RequirementItem text="Model/Property releases for identifiable people or private properties" />
          </ul>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 pb-24 max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 transition-colors">FAQ</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 dark:bg-[#111] py-24 text-center px-6 border-t border-gray-200 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
        {/* Subtle glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00D4FF]/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 relative z-10 transition-colors">Ready to showcase your creativity?</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto relative z-10 transition-colors">
          Join our growing community of contributors and be the first in line when our earning program launches.
        </p>
        <button
          onClick={handleApplyClick}
          className="inline-flex items-center gap-2 bg-[#00D4FF] hover:bg-[#33DEFF] text-[#050505] font-bold text-lg px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all relative z-10 hover:-translate-y-1"
        >
          Join Now for Free <ArrowRight size={20} />
        </button>
      </section>

      {/* Application Modal */}
      {isModalOpen && (
        <ApplicationModal
          user={userData}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

const ApplicationModal = ({ user, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);


  // State for editable fields
  const [portfolio, setPortfolio] = useState("");
  const [contentType, setContentType] = useState("");
  const [motivation, setMotivation] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const applicationData = {
        fullName: user?.name || user?.displayName, // user here is userData passed as prop
        email: user?.email,
        username: user?.username,
        portfolio,
        contentType,
        motivation
      };

      await applyContributor(applicationData);
      toast.success("Application submitted successfully! Our team will review it soon.");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#111] rounded-2xl shadow-2xl w-full max-w-2xl my-8 relative animate-in fade-in zoom-in-95 duration-200 transition-colors">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 px-6 py-4 transition-colors">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Contributor Application</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors">Tell us a bit about yourself and your work.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">Portfolio / Website URL</label>
            <input
              type="url"
              required
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              placeholder="https://your-portfolio.com"
              className="w-full bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg px-4 py-3 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">Provide a link to your previous works, Behance, Dribbble, or Instagram.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">What kind of content do you plan to upload?</label>
            <select
              required
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg px-4 py-3 outline-none transition-all"
            >
              <option value="">Select content type</option>
              <option value="photos">Stock Photos</option>
              <option value="vectors">Vector Graphics (AI/EPS)</option>
              <option value="psd">PSD Templates</option>
              <option value="videos">Stock Videos</option>
              <option value="mixed">Mixed (Multiple Types)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">Why do you want to become a contributor?</label>
            <textarea
              required
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              rows="4"
              placeholder="Tell us briefly about your motivation..."
              className="w-full bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-lg px-4 py-3 outline-none transition-all resize-none"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 transition-colors">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center min-w-[160px]"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Submit Application"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const faqs = [
  {
    question: "What is the process to become a contributor?",
    answer: "Getting started is simple! Just create a free account, complete your profile, and upload your best creative assets for our team to review. Once approved, they will be live on our platform."
  },
  {
    question: "Can anyone join the contributor program?",
    answer: "Absolutely! Whether you are a seasoned professional or a passionate hobbyist, as long as you create high-quality, original content, you are welcome to apply and share your work."
  },
  {
    question: "What type of content is accepted?",
    answer: "We are constantly looking for high-resolution photos, vector graphics (AI/EPS), PSD templates, and high-quality stock videos that meet our creative and technical standards."
  },
  {
    question: "When and how will I be able to earn money?",
    answer: "Since we are a brand new platform, our monetization features are currently in development. We will make an official announcement soon! Once launched, you will be able to track all your earnings and downloads directly from your contributor dashboard."
  },
  {
    question: "Am I allowed to upload my assets to other platforms?",
    answer: "Yes, you retain full ownership of your work. You are completely free to share and sell your creative resources on other marketplaces or personal portfolios."
  },
  {
    question: "Where can I get additional help?",
    answer: "If you have any specific inquiries or need support regarding your uploads, feel free to reach out to our contributor support team through the Contact Us page."
  }
];

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 dark:border-white/10 bg-transparent transition-colors duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left focus:outline-none"
      >
        <span className="font-semibold text-gray-900 dark:text-white transition-colors">{question}</span>
        <span className="ml-6 flex h-6 w-6 shrink-0 items-center justify-center text-gray-900 dark:text-white transition-colors text-2xl font-light">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="pb-5 text-gray-600 dark:text-gray-400 text-sm leading-relaxed pr-8 transition-colors">
          {answer}
        </div>
      )}
    </div>
  );
};

const BenefitCard = ({ icon, title, description }) => (
  <div className="bg-gray-50 dark:bg-[#111] p-8 rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-200 dark:border-white/10 hover:-translate-y-2 transition-all duration-300">
    <div className="w-16 h-16 bg-white dark:bg-[#050505] rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-sm">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }) => (
  <div className="relative z-10 flex flex-col items-center text-center bg-white dark:bg-[#111] p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg shadow-gray-100/50 transition-colors duration-300">
    <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-orange-500/30 border-4 border-white dark:border-[#050505]">
      {number}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed transition-colors">{description}</p>
  </div>
);

const RequirementItem = ({ text }) => (
  <li className="flex items-start gap-3">
    <CheckCircle2 size={24} className="text-green-500 shrink-0" />
    <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors">{text}</span>
  </li>
);

export default ContributorPage;
