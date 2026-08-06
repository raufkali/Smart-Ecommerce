"use client";

import React, { Suspense } from "react";
import ChatPage from "@/app/components/ChatPage";

// Loading component
const ChatLoading = () => (
  <div className="loading-state" style={{ height: "calc(100vh - 60px)" }}>
    <div className="spinner" />
    <p>Loading chat...</p>
  </div>
);

const SellerChatPage = () => {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatPage userRole="seller" />
    </Suspense>
  );
};

export default SellerChatPage;
