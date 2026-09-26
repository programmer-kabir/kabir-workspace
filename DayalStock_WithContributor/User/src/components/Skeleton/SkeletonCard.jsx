const SkeletonCard = ({
  imageHeight = "h-36",
  titleWidth = "w-24",
}) => {
  return (
    <div className="animate-pulse">
      <div className="overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50">
        <div className={`${imageHeight} w-full bg-gray-200 dark:bg-gray-700`} />
      </div>

      <div
        className={`mx-auto mt-4 h-4 ${titleWidth} rounded bg-gray-200 dark:bg-gray-700`}
      />
    </div>
  );
};

export default SkeletonCard;