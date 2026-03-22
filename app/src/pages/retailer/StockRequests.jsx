import React from 'react';
import UnderDevelopment from "../../components/UnderDevelopment";
import RetailerLayout from "../../components/layout/RetailerLayout";

const StockRequests = () => {
  return (
    <RetailerLayout>
      <UnderDevelopment 
        pageName="Stock Requests"
        message="Stock replenishment requests are coming in Sprint 2"
      />
    </RetailerLayout>
  );
};

export default StockRequests;
