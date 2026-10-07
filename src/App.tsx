import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { queryClient, persister, getCacheBuster, CACHE_MAX_AGE, shouldPersistQuery } from "@/lib/queryClient";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

import { GOOGLE_WEB_CLIENT_ID as GOOGLE_CLIENT_ID } from "@/config/google";

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister, maxAge: CACHE_MAX_AGE, buster: getCacheBuster(), dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery as any } }}
  >
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </PersistQueryClientProvider>
);

export default App;
