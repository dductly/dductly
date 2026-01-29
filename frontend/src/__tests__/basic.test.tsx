import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Dashboard from '../pages/Dashboard'

// Mock hooks used inside Dashboard so the test doesn't depend on Supabase or context providers
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      user_metadata: { first_name: 'Test', last_name: 'User' },
    },
  }),
}))

vi.mock('../contexts/ExpensesContext', () => ({
  useExpenses: () => ({
    expenses: [
      { id: '1', amount: 100 },
      { id: '2', amount: 50 },
    ],
  }),
}))

vi.mock('../contexts/IncomeContext', () => ({
  useIncome: () => ({
    incomes: [
      { id: '1', amount: 500 },
      { id: '2', amount: 250 },
    ],
  }),
}))

describe('Dashboard page', () => {
  it('shows a personalized welcome message and basic stats', () => {
    const handleNavigate = vi.fn()

    render(
      <Dashboard
        onNavigate={handleNavigate}
        onFaqClick={vi.fn()}
        onUserGuideClick={vi.fn()}
      />,
    )

    // Welcome copy should include the mocked first name
    expect(
      screen.getByText(/Welcome back, Test!/i),
    ).toBeInTheDocument()

    // Stats preview should show computed totals from our mocked data
    expect(screen.getByText('$750')).toBeInTheDocument() // total income
    expect(screen.getByText('$150')).toBeInTheDocument() // total expenses
    expect(screen.getByText('$600')).toBeInTheDocument() // net profit

    // Quick action button should navigate to expenses page when clicked
    const expensesButton = screen.getByRole('button', { name: /Expenses/i })
    fireEvent.click(expensesButton)
    expect(handleNavigate).toHaveBeenCalledWith('expenses')
  })
})


