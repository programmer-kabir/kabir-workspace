import React, { useState } from "react";
import { BadgeCheck } from "lucide-react";
import useAllContents from "../../utils/Hooks/useAllContents";
import ContentPageLayout from "../../components/ContentPageLayout";

const Published = () => {
  const [page, setPage] = useState(1);
  const { data: result = {}, isLoading, isError } = useAllContents({ status: "published", page });
  const published = result.data ?? [];

  return (
    <ContentPageLayout
      title="Published Contents"
      subtitle="All approved and live content on the platform"
      icon={<BadgeCheck size={22} />}
      accentColor="#10B981"
      contents={published}
      isLoading={isLoading}
      isError={isError}
      showActions={false}
      serverPage={page}
      setServerPage={setPage}
      serverTotalPages={result.totalPages ?? 1}
    />
  );
};

export default Published;