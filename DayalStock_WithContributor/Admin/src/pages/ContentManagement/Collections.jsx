import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPublicCollections, deleteCollection } from "../../api/collectionApi";
import { Layers, Trash2, ExternalLink } from "lucide-react";
import Swal from 'sweetalert2';

const Collections = () => {
  const queryClient = useQueryClient();

  const { data: collections, isLoading, isError } = useQuery({
    queryKey: ["public_collections"],
    queryFn: () => getPublicCollections(1, 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCollection(id),
    onSuccess: () => {
      Swal.fire({ title: "Deleted", text: "Collection deleted successfully", icon: "success", background: '#12121E', color: '#fff' });
      queryClient.invalidateQueries(["public_collections"]);
    }
  });

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Collection?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3f3f46",
      confirmButtonText: "Yes, delete it!",
      background: '#12121E',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <Layers className="text-[#6C4FE0]" />
          Collections Management
        </h1>
        <p className="text-sm text-gray-400">View and manage public collections created by users.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-[#6C4FE0] border-t-transparent rounded-full"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl border border-red-500/20 text-center">
          Failed to load collections.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections?.collections?.map((col) => (
            <div key={col.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-[#6C4FE0]/30 transition-all">
              <div>
                <h3 className="text-lg font-bold text-white">{col.name}</h3>
                <p className="text-sm text-gray-400">By {col.user_name || 'Unknown'}</p>
              </div>
              <div className="bg-black/20 rounded-xl p-3 border border-white/5 flex justify-between items-center text-sm text-gray-300">
                <span>Items: {col.item_count || 0}</span>
                <span className="capitalize">{col.is_private ? 'Private' : 'Public'}</span>
              </div>
              <div className="mt-auto pt-2 flex justify-end">
                <button 
                  onClick={() => handleDelete(col.id)} 
                  className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
          {(!collections?.collections || collections.collections.length === 0) && (
            <div className="col-span-full text-center py-10 text-gray-400 bg-white/5 rounded-2xl border border-white/10">
              No public collections found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Collections;
