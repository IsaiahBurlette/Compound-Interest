import { BarChart3, CalendarRange, LayoutDashboard, PiggyBank, Receipt, Settings as SettingsIcon, Wallet } from "lucide-react";
import { useState, type ComponentType } from "react";
import { DataProvider, useData } from "./db/DataContext";
import { BudgetsTab } from "./tabs/BudgetsTab";
import { DashboardTab } from "./tabs/DashboardTab";
import { ExpensesTab } from "./tabs/ExpensesTab";
import { IncomeTab } from "./tabs/IncomeTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { SavingsTab } from "./tabs/SavingsTab";
import { SettingsTab } from "./tabs/SettingsTab";

type TabKey = "dashboard" | "income" | "expenses" | "budgets" | "savings" | "reports" | "settings";

interface TabDef {
  key: TabKey;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const TABS: TabDef[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "income", label: "Income", icon: Wallet },
  { key: "expenses", label: "Expenses", icon: Receipt },
  { key: "budgets", label: "Budgets", icon: CalendarRange },
  { key: "savings", label: "Savings & Investing", icon: PiggyBank },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

function AppShell() {
  const [active, setActive] = useState<TabKey>("dashboard");
  const { loading } = useData();
  const activeTab = TABS.find((t) => t.key === active)!;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="muted">Loading your budget…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" />
          <span className="brand-name">Compound Interest</span>
        </div>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`nav-item ${active === tab.key ? "active" : ""}`}
            onClick={() => setActive(tab.key)}
          >
            <tab.icon size={18} className="nav-icon" />
            {tab.label}
          </button>
        ))}
        <div className="nav-spacer" />
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="brand-mark" style={{ width: 22, height: 22 }} />
          <span className="brand-name">{activeTab.label}</span>
        </header>

        <main className="content">
          {active === "dashboard" && <DashboardTab />}
          {active === "income" && <IncomeTab />}
          {active === "expenses" && <ExpensesTab />}
          {active === "budgets" && <BudgetsTab />}
          {active === "savings" && <SavingsTab />}
          {active === "reports" && <ReportsTab />}
          {active === "settings" && <SettingsTab />}
        </main>
      </div>

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-bar-item ${active === tab.key ? "active" : ""}`}
            onClick={() => setActive(tab.key)}
          >
            <tab.icon size={20} />
            {tab.label === "Savings & Investing" ? "Savings" : tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
