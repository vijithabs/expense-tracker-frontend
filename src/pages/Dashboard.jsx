import React, { useEffect, useState, useMemo } from 'react';
import { dashboardStyles, trendStyles, chartStyles } from '../assets/dummyStyles';
import axios from 'axios';

import {
  ArrowDown,
  ChevronDown,
  ChevronUp,
  TrendingUp as ProfitIcon,
  PieChart as PieChartIcon,
  ShoppingCart,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
  DollarSign,
  BarChart2
} from 'lucide-react';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

import {
  GAUGE_COLORS,
  COLORS,
  INCOME_CATEGORY_ICONS,
  EXPENSE_CATEGORY_ICONS
} from '../assets/color';

import { useOutletContext } from 'react-router-dom';
import {
  getTimeFrameRange,
  getPreviousTimeFrameRange,
  calculateData
} from '../components/Helpers';

import FinancialCard from '../components/FinancialCard';
import GaugeCard from '../components/GaugeCard';
import AddTransactionModal from '../components/Add';

const API_BASE = "http://localhost:5000";

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  return token ? { Authorization: `Bearer ${token}` } : {};
};

function toIsoWithClientTime(dateValue) {
  if (!dateValue) return new Date().toISOString();

  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    return new Date(`${dateValue}T${time}`).toISOString();
  }

  return new Date(dateValue).toISOString();
}

const Dashboard = () => {

  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => { },
    refreshTransactions
  } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
  const [gaugeData, setGaugeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overviewMeta, setOverviewMeta] = useState({});
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [showAllExpense, setShowAllExpense] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
  });

  const timeFrameRange = useMemo(() => getTimeFrameRange(timeFrame), [timeFrame]);
  const prevTimeFrameRange = useMemo(() => getPreviousTimeFrameRange(timeFrame), [timeFrame]);

  const isDateInRange = (date, start, end) => {
    const d = new Date(date);
    const s = new Date(start);
    const e = new Date(end);
    d.setHours(0, 0, 0, 0);
    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    return d >= s && d <= e;
  };

  const filteredTransactions = useMemo(
    () => outletTransactions.filter(t => isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end)),
    [outletTransactions, timeFrameRange]
  );

  const prevFilteredTransactions = useMemo(
    () => outletTransactions.filter(t => isDateInRange(t.date, prevTimeFrameRange.start, prevTimeFrameRange.end)),
    [outletTransactions, prevTimeFrameRange]
  );

  const currentTimeFrameData = useMemo(() => {
    const data = calculateData(filteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [filteredTransactions]);

  const prevTimeFrameData = useMemo(() => {
    const data = calculateData(prevFilteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [prevFilteredTransactions]);

  useEffect(() => {
    const maxValues = {
      income: Math.max(currentTimeFrameData.income, 5000),
      expenses: Math.max(currentTimeFrameData.expenses, 3000),
      savings: Math.max(Math.abs(currentTimeFrameData.savings), 2000),
    };

    setGaugeData([
      { name: "Income", value: currentTimeFrameData.income, max: maxValues.income },
      { name: "Spent", value: currentTimeFrameData.expenses, max: maxValues.expenses },
      { name: "Savings", value: currentTimeFrameData.savings, max: maxValues.savings },
    ]);
  }, [currentTimeFrameData, timeFrame]);

  const displayIncome = overviewMeta.monthlyIncome ?? currentTimeFrameData.income;
  const displayExpenses = overviewMeta.monthlyExpense ?? currentTimeFrameData.expenses;
  const displaySavings = overviewMeta.savings ?? currentTimeFrameData.savings;

  const expenseChange = useMemo(() => {
    const prev = prevTimeFrameData.expenses;
    const curr = displayExpenses;
    if (prev === 0) return curr === 0 ? 0 : 100;
    return Math.round(((curr - prev) / prev) * 100);
  }, [prevTimeFrameData, displayExpenses]);

  const financialOverviewData = useMemo(() => {
    const categories = {};
    filteredTransactions.forEach(t => {
      if (t.type === "expense") {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });
    return Object.keys(categories).map(k => ({
      name: k,
      value: Math.round(categories[k])
    }));
  }, [filteredTransactions]);

  const incomeTransactions = filteredTransactions.filter(t => t.type === "income").sort((a, b) => new Date(b.date) - new Date(a.date));
  const expenseTransactions = filteredTransactions.filter(t => t.type === "expense").sort((a, b) => new Date(b.date) - new Date(a.date));

  const displayedIncome = showAllIncome ? incomeTransactions : incomeTransactions.slice(0, 3);
  const displayedExpense = showAllExpense ? expenseTransactions : expenseTransactions.slice(0, 3);

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/dashboard`, { headers: getAuthHeader() });
      if (res?.data?.success) {
        setOverviewMeta(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();
  }, [timeFrame]);

  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    const payload = {
      date: toIsoWithClientTime(newTransaction.date),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category
    };

    try {
      setLoading(true);
      if (newTransaction.type === "income") {
        await axios.post(`${API_BASE}/income/add`, payload, { headers: getAuthHeader() });
      } else {
        await axios.post(`${API_BASE}/expense/add`, payload, { headers: getAuthHeader() });
      }

      await refreshTransactions();
      await fetchDashboardOverview();

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
      });

      setShowModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={dashboardStyles.container}>
      {/* Header */}
      <div className={dashboardStyles.headerContainer}>
        <div className={dashboardStyles.headerContent}>
          <div>
            <h1 className={dashboardStyles.headerTitle}>
              Finance Dashboard
            </h1>
            <p className={dashboardStyles.headerSubtitle}>
              Track your Income and Expense
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className={dashboardStyles.addButton}
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>

        {/* Timeframe */}
        <div className={dashboardStyles.timeFrameContainer}>
          <div className={dashboardStyles.timeFrameWrapper}>
            {["daily", "weekly", "monthly"].map((frame) => (
              <button
                key={frame}
                onClick={() => setTimeFrame(frame)}
                className={dashboardStyles.timeFrameButton(timeFrame === frame)}
              >
                {frame.charAt(0).toUpperCase() + frame.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className={dashboardStyles.summaryGrid}>
        <FinancialCard
          icon={
            <div className={dashboardStyles.walletIconContainer}>
              <Wallet className='w-5 h-5 text-teal-600' />
            </div>
          }
          label="Total Balance"
          value={`${Math.round(displayIncome - displayExpenses).toLocaleString()}`}
          additionalContent={
            <div className='flex items-center gap-2 mt-2 text-sm'>
              <span className={dashboardStyles.balanceBadge}>
                +${Math.round(displayIncome).toLocaleString()}
              </span>
              <span className={dashboardStyles.expenseBadge}>
                -${Math.round(displayExpenses).toLocaleString()}
              </span>
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={dashboardStyles.arrowDownIconContainer}>
              <ArrowDown className='w-5 h-5 text-orange-600' />
            </div>
          }
          label={`${timeFrameRange.label} Expenses`}
          value={`${Math.round(displayExpenses).toLocaleString()}`}
          additionalContent={
            <div
              className={`mt-2 text-xs flex items-center gap-1 ${expenseChange >= 0
                  ? trendStyles.positive
                  : trendStyles.negative
                }`}
            >
              {expenseChange >= 0 ? (
                <TrendingUp className='w-4 h-4' />
              ) : (
                <TrendingDown className='w-4 h-4' />
              )}
              <span>
                {Math.abs(expenseChange)}%{" "}
                {expenseChange >= 0 ? "increase" : "decrease"} from{" "}
                {prevTimeFrameRange.label}
              </span>
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={dashboardStyles.piggyBankIconContainer}>
              <PiggyBank className='w-5 h-5 text-cyan-600' />
            </div>
          }
          label={`${timeFrameRange.label} Savings`}
          value={`${Math.round(displaySavings).toLocaleString()}`}
          additionalContent={
            <div className='mt-2 text-xs text-cyan-600 flex items-center gap-2'>
              <div className='flex items-center gap-1'>
                <BarChart2 className='w-4 h-4' />
                <span>
                  {displayIncome > 0 ? Math.round((displaySavings / displayIncome) * 100) : 0}
                  % of income
                </span>
              </div>
              {typeof overviewMeta.savingsRate === "number" && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${overviewMeta.savingsRate < 0 ?
                  trendStyles.negativeRate : trendStyles.positiveRate}`}>
                  {overviewMeta.savingsRate}%
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Gauges */}
      <div className={dashboardStyles.gaugeGrid}>
        {gaugeData.map((gauge) => (
          <GaugeCard
            key={gauge.name}
            gauge={gauge}
            colorInfo={GAUGE_COLORS[gauge.name]}
            timeFrameLabel={timeFrameRange.label}
          />
        ))}
      </div>

      {/* Pie Chart */}
      <div className={dashboardStyles.pieChartContainer}>
        <div className={dashboardStyles.pieChartHeader}>
          <h3 className={dashboardStyles.pieChartTitle}>
            <PieChartIcon className="w-6 h-6 text-teal-500" />
            Expense Distribution
            <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
          </h3>
        </div>

        <div className={dashboardStyles.pieChartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart className={chartStyles.pieChart}>
              <Pie
                data={financialOverviewData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${Math.round(percent * 100)}%`
                }
                labelLine={false}
              >
                {financialOverviewData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`$${Math.round(value).toLocaleString()}`, "Amount"]}
                contentStyle={dashboardStyles.tooltipContent}
                itemStyle={dashboardStyles.tooltipItem}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(v) => (
                  <span className={dashboardStyles.legendText}>{v}</span>
                )}
                iconSize={10}
                iconType="circle"
                wrapperStyle={dashboardStyles.legendWrapper}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lists */}
      <div className={dashboardStyles.listsGrid}>
        {/* Income */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className={dashboardStyles.listTitle}>
              <ProfitIcon className="w-6 h-6 text-green-500" />
              Recent Income
              <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
            </h3>
            <span className={dashboardStyles.incomeCountBadge}>
              {incomeTransactions.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {displayedIncome.map((t) => {
              const Icon = INCOME_CATEGORY_ICONS[t.category] || INCOME_CATEGORY_ICONS.Other;
              return (
                <div key={t.id} className={dashboardStyles.incomeTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.incomeIconContainer}>{Icon}</div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{t.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{t.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.incomeAmount}>+${Math.abs(t.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3">
              <ArrowDown className="w-6 h-6 text-orange-500" />
              Recent Expenses
              <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
            </h3>
            <span className={dashboardStyles.expenseCountBadge}>
              {expenseTransactions.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {displayedExpense.map((t) => {
              const Icon = EXPENSE_CATEGORY_ICONS[t.category] || EXPENSE_CATEGORY_ICONS.Other;
              return (
                <div key={t.id} className={dashboardStyles.expenseTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.expenseIconContainer}>{Icon}</div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{t.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{t.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.expenseAmount}>-${Math.abs(t.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <AddTransactionModal showModal={showModal} setShowModal={setShowModal}
        newTransaction={newTransaction} setNewTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction} loading={loading}
      />

    </div>
  );
};

export default Dashboard;





