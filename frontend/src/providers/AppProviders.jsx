// src/providers/AppProviders.jsx
import { AuthProvider }  from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { LanguageProvider }  from "@/context/LanguageContext";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}