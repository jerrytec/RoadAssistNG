import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import PartDetail from "./pages/PartDetail.tsx";
import Cart from "./pages/Cart.tsx";
import Checkout from "./pages/Checkout.tsx";
import MyOrders from "./pages/MyOrders.tsx";
import VendorPortal from "./pages/VendorPortal.tsx";
import RequestTracking from "./pages/RequestTracking.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Profile from "./pages/Profile.tsx";
import Notifications from "./pages/Notifications.tsx";
import Support from "./pages/Support.tsx";
import ServicePayment from "./pages/ServicePayment.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminOperators from "./pages/admin/AdminOperators.tsx";
import AdminRequests from "./pages/admin/AdminRequests.tsx";
import AdminPayments from "./pages/admin/AdminPayments.tsx";
import AdminDisputes from "./pages/admin/AdminDisputes.tsx";
import AdminVerification from "./pages/admin/AdminVerification.tsx";
import AdminRolesPage from "./pages/admin/AdminRolesPage.tsx";
import AdminCompliance from "./pages/admin/AdminCompliance.tsx";
import AdminSOS from "./pages/admin/AdminSOS.tsx";
import SOSTracking from "./pages/SOSTracking.tsx";
import SOSPublicTrack from "./pages/SOSPublicTrack.tsx";
import TrustedContacts from "./pages/TrustedContacts.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/parts/:id" element={<PartDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/vendor" element={<VendorPortal />} />
            <Route path="/requests/:id" element={<RequestTracking />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/support" element={<Support />} />
            <Route path="/pay/service/:id" element={<ServicePayment />} />
            <Route path="/sos/:id" element={<SOSTracking />} />
            <Route path="/sos/track/:token" element={<SOSPublicTrack />} />
            <Route path="/profile/trusted-contacts" element={<TrustedContacts />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="operators" element={<AdminOperators />} />
              <Route path="requests" element={<AdminRequests />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="disputes" element={<AdminDisputes />} />
              <Route path="verification" element={<AdminVerification />} />
              <Route path="roles" element={<AdminRolesPage />} />
              <Route path="compliance" element={<AdminCompliance />} />
              <Route path="sos" element={<AdminSOS />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
