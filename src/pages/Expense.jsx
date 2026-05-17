import React, {
    useState,
    useMemo,
    useEffect,
    useCallback,
} from "react";

import { useOutletContext } from "react-router-dom";

import {
    Plus,
    DollarSign,
    Eye,
    Calendar,
    TrendingDown,
    Filter,
    BarChart2,
} from "lucide-react";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";

import axios from "axios";

import AddTransactionModal from "../components/Add";
import TransactionItem from "../components/TransactionItem";
import TimeFrameSelector from "../components/TimeFrame";
import FinancialCard from "../components/FinancialCard";

import {
    getTimeFrameRange,
    generateChartPoints,
} from "../components/Helpers";

import {
    CATEGORY_ICONS,
} from "../assets/color";

import {
    expensePageStyles as styles,
} from "../assets/dummyStyles";

const API_BASE = "https://expense-tracker-backend-c1iz.onrender.com";

function toIsoWithClientTime(dateValue) {
    if (!dateValue) {
        return new Date().toISOString();
    }

    if (
        typeof dateValue === "string" &&
        dateValue.length === 10
    ) {
        const now = new Date();

        const hhmmss = now
            .toTimeString()
            .slice(0, 8);

        const combined = new Date(
            `${dateValue}T${hhmmss}`
        );

        return combined.toISOString();
    }

    try {
        return new Date(dateValue).toISOString();
    } catch (err) {
        return new Date().toISOString();
    }
}

const ExpenseChart = ({
    chartData,
    timeFrame,
    timeFrameRange,
}) => {
    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>
                    <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />

                    {timeFrame === "daily"
                        ? "Hourly"
                        : timeFrame === "yearly"
                            ? "Monthly"
                            : "Daily"}{" "}
                    Expense Trends

                    <span className="text-sm text-gray-500 font-normal">
                        ({timeFrameRange.label})
                    </span>
                </h3>
            </div>

            <div className="w-full h-[320px]">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <AreaChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 20,
                            left: 10,
                            bottom: 20,
                        }}
                    >
                        <defs>
                            <linearGradient
                                id="expenseGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#f97316"
                                    stopOpacity={0.8}
                                />

                                <stop
                                    offset="95%"
                                    stopColor="#f97316"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f3f4f6"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fill: "#6b7280",
                                fontSize: 12,
                            }}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fill: "#6b7280",
                                fontSize: 12,
                            }}
                            width={60}
                            tickFormatter={(value) =>
                                `$${Number(value).toLocaleString()}`
                            }
                        />

                        <Tooltip
                            formatter={(value) => [
                                `$${Math.round(
                                    value
                                ).toLocaleString()}`,
                                "Expense",
                            ]}
                        />

                        <Area
                            type="monotone"
                            dataKey="expense"
                            stroke="#f97316"
                            fill="url(#expenseGradient)"
                            strokeWidth={3}
                            activeDot={{
                                r: 6,
                                fill: "#f97316",
                            }}
                        />

                        {chartData.map(
                            (point, index) =>
                                point.isCurrent && (
                                    <ReferenceLine
                                        key={index}
                                        x={point.label}
                                        stroke="#ea580c"
                                        strokeWidth={2}
                                        strokeDasharray="3 3"
                                    />
                                )
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const FilterSection = ({
    filter,
    setFilter,
}) => {
    return (
        <div className={styles.filterContainer}>
            <div className="relative w-full sm:w-auto">
                <select
                    value={filter}
                    onChange={(e) =>
                        setFilter(e.target.value)
                    }
                    className={styles.filterSelect}
                >
                    <option value="all">
                        All Transactions
                    </option>

                    <option value="month">
                        This Month
                    </option>

                    <option value="year">
                        This Year
                    </option>

                    <option value="Food">
                        Food
                    </option>

                    <option value="Housing">
                        Housing
                    </option>

                    <option value="Transport">
                        Transport
                    </option>

                    <option value="Shopping">
                        Shopping
                    </option>

                    <option value="Entertainment">
                        Entertainment
                    </option>

                    <option value="Utilities">
                        Utilities
                    </option>

                    <option value="Healthcare">
                        Healthcare
                    </option>

                    <option value="Other">
                        Other
                    </option>
                </select>

                <Filter className={styles.filterIcon} />
            </div>
        </div>
    );
};

const ExpensePage = () => {
    const {
        transactions: outletTransactions = [],
        timeFrame = "monthly",
        setTimeFrame = () => { },
        refreshTransactions = async () => { },
    } = useOutletContext();

    const [showModal, setShowModal] =
        useState(false);

    const [editingId, setEditingId] =
        useState(null);

    const [showAll, setShowAll] =
        useState(false);

    const [filter, setFilter] =
        useState("all");

    const [loading, setLoading] =
        useState(false);

    const [overview, setOverview] =
        useState({
            totalExpense: 0,
            averageExpense: 0,
            numberOfTransactions: 0,
            recentTransactions: [],
            range: "monthly",
        });

    const [newTransaction, setNewTransaction] =
        useState({
            date: new Date()
                .toISOString()
                .split("T")[0],
            description: "",
            amount: "",
            type: "expense",
            category: "Food",
        });

    const [editForm, setEditForm] =
        useState({
            description: "",
            amount: "",
            category: "Food",
            date: new Date()
                .toISOString()
                .split("T")[0],
        });

    const getAuthHeaders = useCallback(() => {
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        return token
            ? {
                Authorization: `Bearer ${token}`,
            }
            : {};
    }, []);

    const timeFrameRange = useMemo(() => {
        return getTimeFrameRange(
            timeFrame,
            null
        );
    }, [timeFrame]);

    const chartPoints = useMemo(() => {
        return generateChartPoints(
            timeFrame,
            timeFrameRange
        );
    }, [timeFrame, timeFrameRange]);

    const isDateInRange = useCallback(
        (date, start, end) => {
            const transactionDate =
                new Date(date);

            const startDate =
                new Date(start);

            const endDate =
                new Date(end);

            transactionDate.setHours(
                0,
                0,
                0,
                0
            );

            startDate.setHours(
                0,
                0,
                0,
                0
            );

            endDate.setHours(
                23,
                59,
                59,
                999
            );

            return (
                transactionDate >= startDate &&
                transactionDate <= endDate
            );
        },
        []
    );

    const expenseTransactions = useMemo(() => {
        return (outletTransactions || [])
            .filter(
                (t) => t.type === "expense"
            )
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );
    }, [outletTransactions]);

    const timeFrameTransactions =
        useMemo(() => {
            return expenseTransactions.filter(
                (t) =>
                    isDateInRange(
                        t.date,
                        timeFrameRange.start,
                        timeFrameRange.end
                    )
            );
        }, [
            expenseTransactions,
            timeFrameRange,
            isDateInRange,
        ]);

    const filteredTransactions =
        useMemo(() => {
            if (filter === "all") {
                return timeFrameTransactions;
            }

            return timeFrameTransactions.filter(
                (t) => {
                    if (filter === "month") {
                        const transDate =
                            new Date(t.date);

                        return (
                            transDate.getMonth() ===
                            timeFrameRange.start.getMonth() &&
                            transDate.getFullYear() ===
                            timeFrameRange.start.getFullYear()
                        );
                    }

                    if (filter === "year") {
                        const transDate =
                            new Date(t.date);

                        return (
                            transDate.getFullYear() ===
                            timeFrameRange.start.getFullYear()
                        );
                    }

                    return (
                        t.category?.toLowerCase() ===
                        filter.toLowerCase()
                    );
                }
            );
        }, [
            timeFrameTransactions,
            filter,
            timeFrameRange,
        ]);

    const chartData = useMemo(() => {
        const data = chartPoints.map(
            (point) => ({
                ...point,
                expense: 0,
            })
        );

        filteredTransactions.forEach(
            (transaction) => {
                const transDate = new Date(
                    transaction.date
                );

                const point = data.find((d) => {
                    if (timeFrame === "daily") {
                        return (
                            d.hour ===
                            transDate.getHours()
                        );
                    }

                    if (timeFrame === "yearly") {
                        return (
                            d.date.getMonth() ===
                            transDate.getMonth()
                        );
                    }

                    return (
                        d.date.getDate() ===
                        transDate.getDate() &&
                        d.date.getMonth() ===
                        transDate.getMonth()
                    );
                });

                if (point) {
                    point.expense += Math.round(
                        Number(transaction.amount)
                    );
                }
            }
        );

        return data;
    }, [
        filteredTransactions,
        chartPoints,
        timeFrame,
    ]);

    const fetchOverview = useCallback(
        async (range = timeFrame) => {
            try {
                const res = await axios.get(
                    `${API_BASE}/expense/overview`,
                    {
                        headers: getAuthHeaders(),
                        params: { range },
                    }
                );

                const payload =
                    res.data?.data || {};

                setOverview({
                    totalExpense:
                        payload.totalExpense || 0,

                    averageExpense:
                        payload.averageExpense || 0,

                    numberOfTransactions:
                        payload.numberOfTransactions ||
                        0,

                    recentTransactions:
                        payload.recentTransactions ||
                        [],

                    range:
                        payload.range || range,
                });
            } catch (err) {
                console.error(
                    "Failed to fetch overview:",
                    err
                );
            }
        },
        [timeFrame, getAuthHeaders]
    );

    useEffect(() => {
        fetchOverview(timeFrame);
    }, [fetchOverview, timeFrame]);

    const totalExpense = useMemo(() => {
        return (
            overview.totalExpense ||
            filteredTransactions.reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            )
        );
    }, [
        overview.totalExpense,
        filteredTransactions,
    ]);

    const averageExpense = useMemo(() => {
        if (overview.averageExpense) {
            return Math.round(
                overview.averageExpense
            );
        }

        if (!filteredTransactions.length) {
            return 0;
        }

        return Math.round(
            filteredTransactions.reduce(
                (sum, t) =>
                    sum + Number(t.amount || 0),
                0
            ) / filteredTransactions.length
        );
    }, [
        overview.averageExpense,
        filteredTransactions,
    ]);

    const transactionsCount = useMemo(() => {
        return (
            overview.numberOfTransactions ||
            filteredTransactions.length
        );
    }, [
        overview.numberOfTransactions,
        filteredTransactions,
    ]);

    const handleAddTransaction =
        useCallback(async () => {
            if (
                !newTransaction.description ||
                !newTransaction.amount
            ) {
                return;
            }

            try {
                setLoading(true);

                const payload = {
                    description:
                        newTransaction.description.trim(),

                    amount: parseFloat(
                        newTransaction.amount
                    ),

                    category:
                        newTransaction.category,

                    date: toIsoWithClientTime(
                        newTransaction.date
                    ),
                };

                await axios.post(
                    `${API_BASE}/expense/add`,
                    payload,
                    {
                        headers: {
                            "Content-Type":
                                "application/json",

                            ...getAuthHeaders(),
                        },
                    }
                );

                await refreshTransactions();

                await fetchOverview(timeFrame);

                setNewTransaction({
                    date: new Date()
                        .toISOString()
                        .split("T")[0],

                    description: "",
                    amount: "",
                    type: "expense",
                    category: "Food",
                });

                setShowModal(false);
            } catch (err) {
                console.error(
                    "Add expense error:",
                    err
                );

                alert(
                    err?.response?.data?.message ||
                    "Failed to add expense"
                );
            } finally {
                setLoading(false);
            }
        }, [
            newTransaction,
            getAuthHeaders,
            refreshTransactions,
            fetchOverview,
            timeFrame,
        ]);

    const handleEditTransaction =
        useCallback(async () => {
            if (
                !editingId ||
                !editForm.description ||
                !editForm.amount
            ) {
                return;
            }

            try {
                setLoading(true);

                const payload = {
                    description:
                        editForm.description.trim(),

                    amount: parseFloat(
                        editForm.amount
                    ),

                    category:
                        editForm.category,

                    date: toIsoWithClientTime(
                        editForm.date
                    ),
                };

                await axios.put(
                    `${API_BASE}/expense/update/${editingId}`,
                    payload,
                    {
                        headers: {
                            "Content-Type":
                                "application/json",

                            ...getAuthHeaders(),
                        },
                    }
                );

                await refreshTransactions();

                await fetchOverview(timeFrame);

                setEditingId(null);
            } catch (err) {
                console.error(
                    "Update expense error:",
                    err
                );

                alert(
                    err?.response?.data?.message ||
                    "Failed to update expense"
                );
            } finally {
                setLoading(false);
            }
        }, [
            editingId,
            editForm,
            getAuthHeaders,
            refreshTransactions,
            fetchOverview,
            timeFrame,
        ]);

    const handleDeleteTransaction =
        useCallback(
            async (id) => {
                if (!id) {
                    return;
                }

                const confirmed =
                    window.confirm(
                        "Delete this expense?"
                    );

                if (!confirmed) {
                    return;
                }

                try {
                    setLoading(true);

                    await axios.delete(
                        `${API_BASE}/expense/delete/${id}`,
                        {
                            headers:
                                getAuthHeaders(),
                        }
                    );

                    await refreshTransactions();

                    await fetchOverview(timeFrame);
                } catch (err) {
                    console.error(
                        "Delete expense error:",
                        err
                    );

                    alert(
                        err?.response?.data
                            ?.message ||
                        "Failed to delete expense"
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                getAuthHeaders,
                refreshTransactions,
                fetchOverview,
                timeFrame,
            ]
        );

    return (
        <div className={styles.container}>
            <div className={styles.headerCard}>
                <div className={styles.headerContainer}>
                    <div>
                        <h1 className={styles.headerTitle}>
                            Expense Overview
                        </h1>

                        <p
                            className={
                                styles.headerSubtitle
                            }
                        >
                            Track and manage your
                            expenses
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            setShowModal(true)
                        }
                        className={styles.addButton}
                        disabled={loading}
                    >
                        <Plus size={18} />

                        {loading
                            ? "Processing..."
                            : "Add Expense"}
                    </button>
                </div>

                <div
                    className={
                        styles.timeframePositioning
                    }
                >
                    <TimeFrameSelector
                        timeFrame={timeFrame}
                        setTimeFrame={setTimeFrame}
                        options={[
                            "daily",
                            "weekly",
                            "monthly",
                            "yearly",
                        ]}
                        color="orange"
                    />
                </div>
            </div>

            <div className={styles.cardsGrid}>
                <FinancialCard
                    icon={
                        <div
                            className={styles.iconOrange}
                        >
                            <DollarSign
                                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textOrange}`}
                            />
                        </div>
                    }
                    label="Total Expense"
                    value={`$${Number(
                        totalExpense || 0
                    ).toLocaleString()}`}
                    additionalContent={
                        <div className="mt-2 text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />

                            {timeFrameRange.label}
                        </div>
                    }
                />

                <FinancialCard
                    icon={
                        <div
                            className={styles.iconAmber}
                        >
                            <BarChart2
                                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textAmber}`}
                            />
                        </div>
                    }
                    label="Average Expense"
                    value={`$${Number(
                        averageExpense || 0
                    ).toLocaleString()}`}
                    additionalContent={
                        <div className="mt-2 text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />

                            {transactionsCount}{" "}
                            transactions
                        </div>
                    }
                />

                <FinancialCard
                    icon={
                        <div
                            className={styles.iconYellow}
                        >
                            <TrendingDown
                                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textYellow}`}
                            />
                        </div>
                    }
                    label="Transactions"
                    value={transactionsCount}
                    additionalContent={
                        <div className="mt-2 text-xs text-gray-500 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />

                            {filter === "all"
                                ? "All records"
                                : "Filtered records"}
                        </div>
                    }
                />
            </div>

            <ExpenseChart
                chartData={chartData}
                timeFrame={timeFrame}
                timeFrameRange={timeFrameRange}
            />

            <div className={styles.transactionsContainer}>
                <div
                    className={
                        styles.transactionsHeader
                    }
                >
                    <h3
                        className={
                            styles.transactionsTitle
                        }
                    >
                        <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />

                        Expense Transactions

                        <span className="text-sm text-gray-500 font-normal">
                            ({timeFrameRange.label})
                        </span>
                    </h3>

                    <FilterSection
                        filter={filter}
                        setFilter={setFilter}
                    />
                </div>

                <div
                    className={
                        styles.transactionsList
                    }
                >
                    {filteredTransactions
                        .slice(
                            0,
                            showAll
                                ? filteredTransactions.length
                                : 8
                        )
                        .map((transaction) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={
                                    transaction
                                }
                                isEditing={
                                    editingId ===
                                    transaction.id
                                }
                                editForm={editForm}
                                setEditForm={
                                    setEditForm
                                }
                                onSave={
                                    handleEditTransaction
                                }
                                onCancel={() =>
                                    setEditingId(null)
                                }
                                onDelete={
                                    handleDeleteTransaction
                                }
                                type="expense"
                                categoryIcons={
                                    CATEGORY_ICONS
                                }
                                setEditingId={
                                    setEditingId
                                }
                            />
                        ))}

                    {!showAll &&
                        filteredTransactions.length >
                        8 && (
                            <button
                                onClick={() =>
                                    setShowAll(true)
                                }
                                className={
                                    styles.viewAllButton
                                }
                            >
                                <Eye size={18} />

                                View All{" "}
                                {
                                    filteredTransactions.length
                                }{" "}
                                Transactions
                            </button>
                        )}

                    {filteredTransactions.length ===
                        0 && (
                            <div
                                className={
                                    styles.emptyState
                                }
                            >
                                <div
                                    className={
                                        styles.emptyStateIcon
                                    }
                                >
                                    <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-orange-400" />
                                </div>

                                <p
                                    className={
                                        styles.emptyStateText
                                    }
                                >
                                    No expense transactions
                                    found
                                </p>

                                <p
                                    className={
                                        styles.emptyStateSubtext
                                    }
                                >
                                    {filter === "all"
                                        ? "You haven't recorded any expenses yet"
                                        : `No ${filter} transactions found`}
                                </p>

                                <button
                                    onClick={() =>
                                        setShowModal(true)
                                    }
                                    className={
                                        styles.addButton
                                    }
                                >
                                    <Plus
                                        size={16}
                                        className="md:size-5"
                                    />

                                    Add Expense
                                </button>
                            </div>
                        )}
                </div>
            </div>

            <AddTransactionModal
                showModal={showModal}
                setShowModal={setShowModal}
                newTransaction={
                    newTransaction
                }
                setNewTransaction={
                    setNewTransaction
                }
                handleAddTransaction={
                    handleAddTransaction
                }
                loading={loading}
                type="expense"
                title="Add New Expense"
                buttonText="Add Expense"
                categories={[
                    "Food",
                    "Housing",
                    "Transport",
                    "Shopping",
                    "Entertainment",
                    "Utilities",
                    "Healthcare",
                    "Other",
                ]}
                color="orange"
            />
        </div>
    );
};

export default ExpensePage;