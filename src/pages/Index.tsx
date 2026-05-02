import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import TabBar from "@/components/TabBar";
import NeedHelpScreen from "@/components/screens/NeedHelpScreen";
import ProviderDashboard from "@/components/screens/ProviderDashboard";
import MechanicScreen from "@/components/screens/MechanicScreen";
import RegisterScreen from "@/components/screens/RegisterScreen";
import BookingHistoryScreen from "@/components/screens/BookingHistoryScreen";

import WorkflowModal from "@/components/WorkflowModal";
import NotificationsPanel from "@/components/NotificationsPanel";
import type { Provider } from "@/components/ProviderCard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("help");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSelectProvider = (p: Provider) => setSelectedProvider(p);

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-background">
      <AppHeader onOpenNotifications={() => setNotificationsOpen(true)} unreadCount={3} />
      <TabBar active={activeTab} onChange={setActiveTab} />

      {selectedProvider && (
        <WorkflowModal provider={selectedProvider} onClose={() => setSelectedProvider(null)} />
      )}

      {!selectedProvider && (
        <>
          {activeTab === "help" && <NeedHelpScreen onSelectProvider={handleSelectProvider} />}
          {activeTab === "history" && <BookingHistoryScreen />}
          {activeTab === "payment" && <PaymentGatewayScreen />}
          {activeTab === "provider" && <ProviderDashboard />}
          {activeTab === "mechanic" && <MechanicScreen onSelectProvider={handleSelectProvider} />}
          {activeTab === "register" && <RegisterScreen />}
        </>
      )}

      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
  );
};

export default Index;
