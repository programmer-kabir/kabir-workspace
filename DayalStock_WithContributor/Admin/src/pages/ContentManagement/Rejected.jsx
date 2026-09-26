import React, { useState } from "react";
import { FileX2 } from "lucide-react";
import useAllContents from "../../utils/Hooks/useAllContents";
import ContentPageLayout from "../../components/ContentPageLayout";

const Rejected = () => {
  const [page, setPage] = useState(1);
  const { data: result = {}, isLoading, isError } = useAllContents({ status: "rejected", page });
  const rejected = result.data ?? [];

  return (
    <ContentPageLayout
      title="Rejected Contents"
      subtitle="Submissions that did not meet quality standards"
      icon={<FileX2 size={22} />}
      accentColor="#EF4444"
      contents={rejected}
      isLoading={isLoading}
      isError={isError}
      showActions={false}
      serverPage={page}
      setServerPage={setPage}
      serverTotalPages={result.totalPages ?? 1}
    />
  );
};

export default Rejected;