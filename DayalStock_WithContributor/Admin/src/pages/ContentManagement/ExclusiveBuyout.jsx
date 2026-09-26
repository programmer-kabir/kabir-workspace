import React, { useState } from "react";
import { Star } from "lucide-react";
import useAllContents from "../../utils/Hooks/useAllContents";
import ContentPageLayout from "../../components/ContentPageLayout";

const ExclusiveBuyout = () => {
  const [page, setPage] = useState(1);
  const { data: result = {}, isLoading, isError } = useAllContents({ status: "exclusive_buyout", page });
  const contents = result.data ?? [];

  return (
    <ContentPageLayout
      title="Exclusive Buyout Contents"
      subtitle="Exclusive contents purchased and hidden from the public site"
      icon={<Star size={22} />}
      accentColor="#F59E0B"
      contents={contents}
      isLoading={isLoading}
      isError={isError}
      showActions={false}
      serverPage={page}
      setServerPage={setPage}
      serverTotalPages={result.totalPages ?? 1}
    />
  );
};

export default ExclusiveBuyout;
