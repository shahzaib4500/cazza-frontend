import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { SetNewPassword } from "./pages/auth/SetNewPassword";
import { SignIn } from "./pages/auth/SignIn";
import { SignUp } from "./pages/auth/SignUp";
import NotFound from "./pages/NotFound";
import { LandingPage } from "./pages/landingPage/LandingPage";
import { ThemeProvider } from "./components/theme-provider";
import { ClientLayout } from "./layouts/ClientLayout";
import { ClientDashboard } from "./pages/ClientDashboard/ClientDashboard";
import { ClientPlatforms } from "./pages/ClientDashboard/ClientPlatforms";
import { AIChat } from "./pages/ClientDashboard/AIChat";
import { Channels } from "./pages/ClientDashboard/Channels";
import { BillingSettings } from "./pages/Settings/BillingSettings";
import { SupportSettings } from "./pages/Settings/SupportSettings";
import { AccountSettings } from "./pages/Settings/AccountSettings";
import { TeamSettings } from "./pages/Settings/TeamSettings";
import { Onboarding } from "./pages/auth/OnBoarding";
import { SuperAdminLayout } from "./layouts/SuperAdminLayout";
import { AdminDashboard } from "./pages/SuperAdmin/AdminDashboard";
import { AdminUsers } from "./pages/SuperAdmin/AdminUsers";
import { AdminSupport } from "./pages/SuperAdmin/AdminSupport";

const App = () => {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<NotFound />} />
            <Route index element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/set-new-password" element={<SetNewPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/client" element={<ClientLayout />}>
              <Route index path="dashboard" element={<ClientDashboard />} />
              <Route path="platforms" element={<ClientPlatforms />} />
              <Route path="channels" element={<Channels />} />
              <Route path="ask-cazza" element={<AIChat />} />
              <Route path="billing" element={<BillingSettings />} />
              <Route path="support" element={<SupportSettings />} />
              <Route path="settings" element={<AccountSettings />} />
              <Route path="teams" element={<TeamSettings />} />
            </Route>
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="customer-support" element={<AdminSupport />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
};

export default App;
