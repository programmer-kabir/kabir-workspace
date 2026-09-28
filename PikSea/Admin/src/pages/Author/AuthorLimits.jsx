import React, { useState, useEffect } from 'react';
import { authFetch } from '../../api/authFetch';
import { ShieldCheck, Edit, Save, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthorLimits = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [editForm, setEditForm] = useState({
    permission_type: 'limited',
    weekly_upload_limit: 10,
    max_file_size_mb: 5
  });

  const fetchAuthors = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_LOCALHOST_KEY;
      const response = await authFetch(`${apiUrl}/upload_limits/get_author_limits.php`);
      const data = await response.json();
      if (data.success) {
        setAuthors(data.data);
      } else {
        toast.error(data.message || "Failed to fetch author limits");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleEditClick = (author) => {
    setEditingAuthor(author.author_id);
    setEditForm({
      permission_type: author.permission_type,
      weekly_upload_limit: author.weekly_upload_limit,
      max_file_size_mb: author.max_file_size_mb
    });
  };

  const handleSave = async (authorId) => {
    try {
      const apiUrl = import.meta.env.VITE_LOCALHOST_KEY;
      const payload = {
        author_id: authorId,
        ...editForm
      };
      
      const response = await authFetch(`${apiUrl}/upload_limits/update_author_limit.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Author limits updated successfully!");
        setEditingAuthor(null);
        fetchAuthors(); // Refresh list
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating author limit");
    }
  };

  const filteredAuthors = authors.filter(a => 
    a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-200 flex items-center gap-2">
          <ShieldCheck className="text-indigo-500" /> 
          Author Upload Limits
        </h1>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search author..." 
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        </div>
      </div>

      <div className="bg-[#1a1d27] rounded-xl shadow-lg border border-gray-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#24283b] border-b border-gray-800">
              <th className="p-4 font-semibold text-gray-300">Author</th>
              <th className="p-4 font-semibold text-gray-300">Permission Type</th>
              <th className="p-4 font-semibold text-gray-300">Weekly Limit (Files)</th>
              <th className="p-4 font-semibold text-gray-300">Max Size (MB)</th>
              <th className="p-4 font-semibold text-gray-300 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">Loading authors...</td>
              </tr>
            ) : filteredAuthors.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">No authors found.</td>
              </tr>
            ) : (
              filteredAuthors.map((author) => (
                <tr key={author.author_id} className="border-b border-gray-800 hover:bg-[#24283b] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                        {author.photo ? (
                          <img src={`${import.meta.env.VITE_IMG_KEY}/${author.photo}`} alt={author.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">
                            {author.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{author.name}</div>
                        <div className="text-sm text-gray-400">{author.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  {editingAuthor === author.author_id ? (
                    <>
                      <td className="p-4">
                        <select 
                          className="bg-gray-800 border border-gray-700 text-gray-200 rounded p-1.5 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={editForm.permission_type}
                          onChange={(e) => setEditForm({...editForm, permission_type: e.target.value})}
                        >
                          <option value="limited">Limited</option>
                          <option value="unlimited">Unlimited</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          className="bg-gray-800 border border-gray-700 text-gray-200 rounded p-1.5 w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          value={editForm.weekly_upload_limit}
                          disabled={editForm.permission_type === 'unlimited'}
                          onChange={(e) => setEditForm({...editForm, weekly_upload_limit: parseInt(e.target.value)})}
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          className="bg-gray-800 border border-gray-700 text-gray-200 rounded p-1.5 w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          value={editForm.max_file_size_mb}
                          disabled={editForm.permission_type === 'unlimited'}
                          onChange={(e) => setEditForm({...editForm, max_file_size_mb: parseInt(e.target.value)})}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleSave(author.author_id)}
                            className="text-green-400 hover:bg-green-400/10 p-2 rounded transition"
                            title="Save"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setEditingAuthor(null)}
                            className="text-gray-400 hover:bg-gray-700 p-2 rounded transition"
                            title="Cancel"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                          author.permission_type === 'unlimited' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        }`}>
                          {author.permission_type?.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">
                        {author.permission_type === 'unlimited' ? '∞' : author.weekly_upload_limit}
                      </td>
                      <td className="p-4 text-gray-300">
                        {author.permission_type === 'unlimited' ? '∞' : author.max_file_size_mb}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleEditClick(author)}
                          className="text-indigo-400 hover:bg-indigo-500/10 p-2 rounded transition"
                          title="Edit Limits"
                        >
                          <Edit className="w-5 h-5 mx-auto" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuthorLimits;
