import React from 'react';
import UnderDevelopment from "../../components/UnderDevelopment";
import RetailerLayout from "../../components/layout/RetailerLayout";

const Promotions = () => {
  return (
    <RetailerLayout>
      <UnderDevelopment 
        pageName="Promotions"
        message="Exclusive retailer promotions and discounts are coming in Sprint 2"
      />
    </RetailerLayout>
  );
};

export default Promotions;
