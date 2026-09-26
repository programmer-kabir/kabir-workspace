import SkeletonCard from "./SkeletonCard";

const SkeletonGrid = ({
  count = 10,
  imageHeight = "h-36",
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard
          key={index}
          imageHeight={imageHeight}
        />
      ))}
    </>
  );
};

export default SkeletonGrid;