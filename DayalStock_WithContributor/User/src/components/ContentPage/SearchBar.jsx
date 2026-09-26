export default function SearchBar() {
  return (
    <div className="h-16 border-b px-6 flex items-center">
      <input
        type="text"
        placeholder="Search..."
        className="w-full"
      />
    </div>
  );
}