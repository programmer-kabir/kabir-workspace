import ScrollReveal from "../FramerMotion/ScrollReveal";
import { Link } from "react-router-dom";
import useAuthor from "../../utlis/Hooks/useAuthor";

const BestCreatorCommunity = () => {
  const { data: authors = [], isLoading } = useAuthor();
  console.log(authors)
  // Get top 4 authors by published resources
  const topCreators = [...authors]
    .sort((a, b) => (b.published_files || 0) - (a.published_files || 0))
    .slice(0, 4);

  if (isLoading || topCreators.length === 0) return null;
  return (
    <ScrollReveal>
    <section className="bg-white dark:bg-[#050505] py-24 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Glow */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-[1600px] px-4 lg:px-8 relative z-10">
        {/* Heading */}
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-4 py-1.5 text-xs font-outfit font-bold text-[#00D4FF] mb-6 uppercase tracking-widest">
            Top Creators
          </span>
          <h2 className="text-4xl font-outfit font-bold text-gray-900 dark:text-white md:text-5xl lg:text-6xl tracking-tight">
            Best Creator Community
          </h2>

          <p className="mt-6 text-lg font-inter text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get inspired by the latest work from our most talented and creative artists worldwide.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {topCreators.map((creator) => (
            <Link
              to={`/author/${creator.username}`}
              key={creator.id}
              className="group relative overflow-hidden rounded-3xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_8px_30px_rgba(0,212,255,0.15)] hover:border-[#00D4FF]/30 block magnetic-hover"
            >
              {/* Cover */}
              <div className="relative h-44 overflow-hidden bg-gray-200 dark:bg-[#1a1a1a]">
                <div className="absolute inset-0 bg-black/20 dark:bg-[#050505]/40 z-10 transition-opacity duration-500 group-hover:opacity-0" />
                <img
                  src={
                    creator.cover_photo || creator.cover
                      ? (creator.cover_photo || creator.cover).startsWith('http')
                        ? (creator.cover_photo || creator.cover)
                        : `${import.meta.env.VITE_IMG_KEY}/${creator.cover_photo || creator.cover}`
                      : "https://images.unsplash.com/photo-1557683316-973673baf926?w=800"
                  }
                  alt={creator.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-[#111] to-transparent z-10" />
              </div>

              {/* Avatar */}
              <div className="relative flex justify-center z-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#00D4FF]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img
                  src={creator.avatar ? (creator.avatar.startsWith('http') ? creator.avatar : `${import.meta.env.VITE_IMG_KEY}/${creator.avatar}`) : "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300"}
                  alt={creator.name}
                  className="-mt-16 h-28 w-28 rounded-full border-[6px] border-gray-50 dark:border-[#111] object-cover shadow-2xl transition-transform duration-500 ease-out group-hover:scale-105 relative z-10"
                />
              </div>

              {/* Info */}
              <div className="px-6 pb-8 text-center relative z-20">
                <h3 className="mt-4 text-2xl font-outfit font-semibold text-gray-900 dark:text-white truncate group-hover:text-[#00D4FF] transition-colors">
                  {creator.name}
                </h3>

                <p className="mt-2 font-inter text-sm text-gray-600 dark:text-gray-500 uppercase tracking-widest">
                  {creator.published_files || 0} Resources
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
    </ScrollReveal>
  );
};

export default BestCreatorCommunity;