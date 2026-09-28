import { Globe, Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const SeoManagement = () => {
  const [copiedLink, setCopiedLink] = useState(null);
  
  const sitemapBaseUrl = `${import.meta.env.VITE_LOCALHOST_KEY}/seo`;

  const sitemaps = [
    { name: "Sitemap Index", url: `${sitemapBaseUrl}/sitemap_index.php`, description: "The main sitemap index containing all other sitemaps. Submit this to Google Search Console." },
    { name: "Pages Sitemap", url: `${sitemapBaseUrl}/sitemap_pages.php`, description: "Sitemap containing all dynamic pages and static routes." },
    { name: "Contents Sitemap", url: `${sitemapBaseUrl}/sitemap_contents.php`, description: "Sitemap containing all published contents. Paginated if large." }
  ];

  const handleCopy = (url, name) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(name);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Globe className="text-[#6C4FE0]" />
          SEO Management
        </h1>
        <p className="text-sm text-gray-400">Manage search engine optimization and sitemaps.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Sitemaps</h2>
        <p className="text-sm text-gray-400 mb-6">
          Your sitemaps are generated dynamically to ensure search engines always have the most up-to-date links to your contents and pages.
        </p>

        <div className="space-y-4">
          {sitemaps.map((sitemap) => (
            <div key={sitemap.name} className="bg-[#12121E] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex-1">
                <h3 className="text-white font-medium mb-1">{sitemap.name}</h3>
                <p className="text-sm text-gray-400 mb-2">{sitemap.description}</p>
                <code className="text-xs text-[#6C4FE0] bg-[#6C4FE0]/10 px-2 py-1 rounded break-all">
                  {sitemap.url}
                </code>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => handleCopy(sitemap.url, sitemap.name)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  {copiedLink === sitemap.name ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                  {copiedLink === sitemap.name ? "Copied!" : "Copy URL"}
                </button>
                <a 
                  href={sitemap.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#6C4FE0] hover:bg-[#5b3fd4] text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  <ExternalLink size={16} /> Open
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeoManagement;
