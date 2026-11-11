import React from "react";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";

const SalesProducts = () => {
  const {
    customerInstallmentCards,
    isCustomerInstallmentsCardsError,
    isCustomerInstallmentsCardsLoading,
  } = useCustomerInstallmentCards();
  if (isCustomerInstallmentsCardsError) return <NoDataFound />;
  if (isCustomerInstallmentsCardsLoading)
    return (
      <span className="w-full flex items-center justify-center h-screen">
        <Loader />
      </span>
    );
  const productList = customerInstallmentCards.filter((d) => d.product_name);
  return <div>SalesProducts</div>;
};

export default SalesProducts;
