import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRoles } from "@/hooks/useUserRoles";
import AppHeader from "@/components/AppHeader";
import TabBar from "@/components/TabBar";
import NeedHelpScreen from "@/components/screens/NeedHelpScreen";
import ServiceListScreen from "@/components/screens/ServiceListScreen";
import MechanicScreen from "@/components/screens/MechanicScreen";
import BookingHistoryScreen, { type UseAgainData } from "@/components/screens/BookingHistoryScreen";
import PartsBrowseScreen from "@/components/screens/PartsBrowseScreen";

import WorkflowModal from "@/components/WorkflowModal";
import type { PrefillData } from "@/components/WorkflowModal";
import NotificationsPanel from "@/components/NotificationsPanel";
import ContactSupportPanel from "@/components/ContactSupportPanel";
import SplashScreen from "@/components/SplashScreen";
import AuthScreen from "@/components/AuthScreen";
import type { Provider } from "@/components/ProviderCard";
import { allProviders } from "@/data/providers";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: roles } = useUserRoles();
  const { totalCount } = useCart();

  // Auto-redirect providers/technicians to their portal on login
  useEffect(() => {
    if (!user || !roles) return;
    const providerRoles = ["vendor", "tow_operator", "vulcanizer", "mechanic"];
    const isProvider = roles.some((r) => providerRoles.includes(r));
    const alreadyRedirected = sessionStorage.getItem("portal-redirected");
    if (isProvider && !alreadyRedirected) {
      sessionStorage.setItem("portal-redirected", "1");
      navigate("/vendor");
    }
  }, [user, roles, navigate]);
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState("help");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [prefillData, setPrefillData] = useState<PrefillData | undefined>(undefined);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!user) return <AuthScreen onComplete={() => { /* auth state listener takes over */ }} />;

  const handleSelectProvider = (p: Provider) => {
    setPrefillData(undefined);
    setSelectedProvider(p);
  };

  const handleUseAgain = (data: UseAgainData) => {
    let matchedProvider: Provider | undefined;
    if (data.preferSameProvider) {
      matchedProvider = allProviders.find((p) => p.name === data.previousProvider);
    }
    if (!matchedProvider) {
      matchedProvider = allProviders.find(
        (p) => p.type === data.serviceType && p.name !== data.previousProvider
      ) ?? allProviders[0];
    }
    setPrefillData({
      serviceType: data.serviceType,
      vehicle: data.reuseVehicle ? data.vehicle : undefined,
      description: data.description,
      previousAmount: parseInt(data.previousAmount.replace(/[₦,]/g, "") || "0"),
      preferSameProvider: data.preferSameProvider,
      previousProvider: data.previousProvider,
    });
    setSelectedProvider(matchedProvider);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onOpenNotifications={() => setNotificationsOpen(true)} />
      <TabBar
        active={activeTab}
        onChange={(id) => {
          if (id === "support") setSupportOpen(true);
          else setActiveTab(id);
        }}
      />
      <div className="container max-w-[960px] px-0 sm:px-4 py-4">
      {selectedProvider && (
        <WorkflowModal
          provider={selectedProvider}
          onClose={() => { setSelectedProvider(null); setPrefillData(undefined); }}
          prefill={prefillData}
        />
      )}

      {!selectedProvider && (
        <>
          {activeTab === "help" && <NeedHelpScreen onSelectProvider={handleSelectProvider} />}
          {activeTab === "tow" && <ServiceListScreen serviceType="tow" onSelectProvider={handleSelectProvider} />}
          {activeTab === "vulcanizer" && <ServiceListScreen serviceType="vulcanizer" onSelectProvider={handleSelectProvider} />}
          {activeTab === "mechanic" && <MechanicScreen onSelectProvider={handleSelectProvider} />}
          {activeTab === "parts" && <PartsBrowseScreen onOpenCart={() => navigate("/cart")} cartCount={totalCount} />}
          {activeTab === "history" && <BookingHistoryScreen onUseAgain={handleUseAgain} />}
        </>
      )}

      <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <ContactSupportPanel open={supportOpen} onClose={() => setSupportOpen(false)} />
    </div>
  );
};

export default Index;
