import React, { useState } from "react";
import { Clock } from "lucide-react";
import useAllContents from "../../utils/Hooks/useAllContents";
import ContentPageLayout from "../../components/ContentPageLayout";

const PendingReview = () => {
  const [page, setPage] = useState(1);
  const { data: result = {}, isLoading, isError } = useAllContents({ status: "pending", page });
  const pending = result.data ?? [];
  return (
    <ContentPageLayout
      title="Pending Review"
      subtitle="Review and moderate draft assets awaiting approval"
      icon={<Clock size={22} />}
      accentColor="#F59E0B"
      contents={pending}
      isLoading={isLoading}
      isError={isError}
      showActions={true}
      serverPage={page}
      setServerPage={setPage}
      serverTotalPages={result.totalPages ?? 1}
    />
  );
};

export default PendingReview;