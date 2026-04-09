import { Outlet, createRootRoute, createRoute } from "@tanstack/react-router";
import AppShell from "./components/AppShell";
import ProfileSetupModal from "./components/ProfileSetupModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AnalysisPage from "./pages/AnalysisPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import SessionPage from "./pages/SessionPage";
import SettingsPage from "./pages/SettingsPage";

function RootComponent() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <>
      <ProfileSetupModal />
      <Outlet />
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/",
  component: DashboardPage,
});

const sessionRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/session",
  component: SessionPage,
});

const analysisRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/analysis",
  component: AnalysisPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/settings",
  component: SettingsPage,
});

shellRoute.addChildren([
  dashboardRoute,
  sessionRoute,
  analysisRoute,
  settingsRoute,
]);
rootRoute.addChildren([shellRoute]);

export const routeTree = rootRoute;
