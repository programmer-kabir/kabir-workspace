import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, Orbit } from "lucide-react";
import { useEffect, useState } from "react";

const NotFound = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] font-inter text-white selection:bg-[#6C4FE0]/30 selection:text-white">
      
      {/* Dynamic Background Orbs */}
      <div 
        className="absolute top-1/4 left-1/4 h-[300px] md:h-[500px] w-[300px] md:w-[500px] rounded-full bg-[#6C4FE0] mix-blend-screen blur-[100px] md:blur-[120px] opacity-20 animate-pulse"
        style={{ transform: `translate(${mousePosition.x * 2}px, ${mousePosition.y * 2}px)` }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 h-[250px] md:h-[400px] w-[250px] md:w-[400px] rounded-full bg-[#FF6B6B] mix-blend-screen blur-[100px] md:blur-[120px] opacity-10 animate-pulse"
        style={{ transform: `translate(${mousePosition.x * -2}px, ${mousePosition.y * -2}px)`, animationDelay: "1s" }}
      />

      {/* Grid Pattern with CSS mask (Inline SVG to avoid missing assets) */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm1 1h38v38H1V1z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }}
      ></div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center">
        
        {/* Floating Icon */}
        <div className="relative mx-auto mb-10 flex h-28 w-28 md:h-32 md:w-32 items-center justify-center animate-bounce" style={{ animationDuration: '3s' }}>
          <div className="absolute inset-0 rounded-full bg-[#6C4FE0]/30 blur-xl"></div>
          <div className="relative flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <Orbit size={56} strokeWidth={1.5} className="text-[#8E7AF2] animate-spin" style={{ animationDuration: '10s', animationTimingFunction: 'linear' }} />
          </div>
        </div>

        {/* 404 Text */}
        <div className="relative mb-4">
          <h1 className="text-[120px] leading-[1] md:text-[200px] md:leading-none font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-transparent opacity-90 drop-shadow-[0_0_40px_rgba(108,79,224,0.4)] select-none">
            404
          </h1>
        </div>
        
        <h2 className="mb-6 text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
          Lost in Space
        </h2>
        
        <p className="mx-auto mb-12 max-w-xl text-base md:text-lg text-gray-400 font-medium leading-relaxed">
          The page you're looking for has drifted into the void. It might have been removed, renamed, or never existed in the first place.
        </p>

        {/* Glass Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <button 
            onClick={() => navigate(-1)}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-sm font-bold text-white transition-all hover:border-white/20 hover:bg-white/10 sm:w-auto shadow-lg backdrop-blur-md"
          >
            <ArrowLeft size={20} strokeWidth={2.5} className="transition-transform group-hover:-translate-x-1.5" />
            <span>Go Back</span>
          </button>
          
          <button 
            onClick={() => navigate("/dashboard")}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-[#6C4FE0] px-8 py-4 text-sm font-bold text-white transition-all hover:bg-[#5a40c2] sm:w-auto shadow-[0_0_30px_rgba(108,79,224,0.3)] hover:shadow-[0_0_50px_rgba(108,79,224,0.6)] hover:-translate-y-1"
          >
            {/* Hover Shine Effect */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
            
            <Home size={20} strokeWidth={2.5} className="transition-transform group-hover:scale-110" />
            <span>Return Home</span>
          </button>
        </div>

        {/* Footer Link */}
        <div className="mt-16 text-sm text-gray-500 font-medium">
          <p>
            Think this is a mistake?{' '}
            <button onClick={() => navigate("/dashboard/support")} className="text-[#8E7AF2] hover:text-white hover:underline underline-offset-4 transition-all">
              Let us know
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;