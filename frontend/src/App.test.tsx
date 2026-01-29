// src/__tests__/App.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App"; // adjust path if needed
import { vi } from "vitest";

// Mock out AuthProvider to avoid real Supabase calls
vi.mock("../contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("../contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
  }),
}));

vi.mock("../hooks/useInactivity", () => ({
  useInactivity: () => ({
    showWarning: false,
    remainingSeconds: 0,
    resetActivity: vi.fn(),
  }),
}));

vi.mock("../contexts/ExpensesContext", () => ({
  ExpensesProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../contexts/IncomeContext", () => ({
  IncomeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("App", () => {
  it("renders main app and shows brand and Sign In button", () => {
    render(<App />);

    // Check that your logo and brand text exist
    const logo = screen.getByAltText("dductly logo");
    expect(logo).toBeInTheDocument();

    const brandText = screen.getByText("dductly");
    expect(brandText).toBeInTheDocument();

    // Check that the Sign In button is present when not logged in
    const signInButton = screen.getByRole("button", { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();

    // Optional: simulate click on Sign In
    fireEvent.click(signInButton);
    // now you could check if modal opens, etc.
    const modalTitle = screen.getByText(/welcome back/i);
    expect(modalTitle).toBeInTheDocument();
  });
});
