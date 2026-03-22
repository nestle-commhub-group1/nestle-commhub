import React from 'react';
import UnderDevelopment from "../../components/UnderDevelopment";
import RetailerLayout from "../../components/layout/RetailerLayout";

const DeliveryTracking = () => {
  return (
    <RetailerLayout>
      <UnderDevelopment 
        pageName="Delivery Tracking"
        message="Real-time order and delivery tracking is coming in Sprint 2"
      />
    </RetailerLayout>
  );
};

export default DeliveryTracking;
