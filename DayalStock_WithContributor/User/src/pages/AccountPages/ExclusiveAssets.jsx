import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, Star, ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
import useAuth from "../../utlis/Hooks/useAuth";

const ExclusiveAssets = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchExclusiveAssets = async () => {
            if (!user) return;
            try {
                setLoading(true);
                setError(null);
                const token = await user.getIdToken();
                const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/users/get_exclusive_assets.php`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                const data = await res.json();

                if (data.success) {
                    setAssets(data.data);
                } else {
                    setError("Failed to fetch assets.");
                }
            } catch (error) {
                console.error("Failed to fetch exclusive assets", error);
                setError("Network error. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchExclusiveAssets();
    }, [user]);

    const handleDownload = async (contentId) => {
        if (!user || downloadingId) return;
        try {
            setDownloadingId(contentId);
            const token = await user.getIdToken();
            const downloadUrl = `${import.meta.env.VITE_LOCALHOST_KEY}/contents_download/downloadExclusiveAsset.php?content_id=${contentId}&token=${token}&api_key=${import.meta.env.VITE_APP_SECRET}`;
            window.open(downloadUrl, "_blank");
        } catch (error) {
            console.error("Failed to initiate download", error);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white font-outfit flex items-center gap-2">
                <Star className="text-yellow-400" /> Exclusive Assets
            </h1>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#00D4FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-[#111] rounded-3xl p-12 text-center border border-red-200 dark:border-red-500/20 transition-colors">
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 font-outfit">Oops!</h3>
                    <p className="text-red-500 dark:text-gray-400 max-w-sm mx-auto">{error}</p>
                </div>
            ) : assets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {assets.map((asset) => (
                        <div key={asset.id} className="bg-white dark:bg-[#111] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] group hover:border-[#0088b3]/40 dark:hover:border-[#00D4FF]/40 hover:shadow-[0_8px_30px_rgba(0,136,179,0.15)] dark:hover:shadow-[0_8px_30px_rgba(0,212,255,0.15)] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col cursor-pointer">
                            <div className="relative aspect-video bg-gray-100 dark:bg-[#1a1a1a] overflow-hidden flex items-center justify-center transition-colors">
                                {asset.thumbnail_path ? (
                                    <img
                                        src={`${import.meta.env.VITE_IMG_KEY}/${asset.thumbnail_path}`}
                                        alt={asset.title}
                                        className="w-full h-auto object-contain transition-transform duration-500 ease-out group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                    />
                                ) : (
                                    <ImageIcon className="text-gray-400 dark:text-gray-500 transition-transform duration-500 group-hover:scale-110 group-hover:text-[#0088b3] dark:group-hover:text-[#00D4FF]" size={48} />
                                )}
                                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-yellow-400/30 flex items-center gap-1 group-hover:border-yellow-400/60 transition-colors duration-300">
                                    <Star size={12} className="text-yellow-400 fill-yellow-400 group-hover:animate-pulse" />
                                    <span className="text-xs font-bold text-yellow-400">Exclusive</span>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-1 line-clamp-1" title={asset.title}>{asset.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">By {asset.author_name || asset.author_username}</p>

                                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between transition-colors">
                                    <div className="text-xs text-gray-500 font-medium">
                                        {new Date(asset.purchase_date || asset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/${asset.content_type || 'images'}/${asset.slug}`}
                                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                                            title="View Asset"
                                        >
                                            <ExternalLink size={14} />
                                        </Link>
                                        <button
                                            onClick={() => handleDownload(asset.id)}
                                            disabled={downloadingId === asset.id}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${downloadingId === asset.id ? 'bg-gray-200 dark:bg-gray-600/20 text-gray-400 cursor-not-allowed' : 'bg-[#0088b3]/10 dark:bg-[#00D4FF]/10 text-[#0088b3] dark:text-[#00D4FF] hover:bg-[#0088b3] dark:hover:bg-[#00D4FF] hover:text-white dark:hover:text-black'}`}
                                            title="Download Full Asset ZIP"
                                        >
                                            {downloadingId === asset.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Download size={14} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-[#111] rounded-3xl p-12 text-center border border-gray-200 dark:border-white/5 transition-colors">
                    <Star size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-outfit">No Exclusive Assets</h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">You haven't purchased any exclusive assets yet.</p>
                    <Link to="/" className="mt-6 inline-block bg-[#0088b3] dark:bg-[#00D4FF] text-white dark:text-[#050505] px-6 py-3 rounded-xl font-bold hover:bg-[#00a3cc] dark:hover:bg-[#33DEFF] transition-all shadow-sm dark:shadow-[0_0_15px_rgba(0,212,255,0.2)]">
                        Browse Assets
                    </Link>
                </div>
            )}
        </div>
    );
};

export default ExclusiveAssets;
