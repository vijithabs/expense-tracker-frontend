import {
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
    TrendingUp,
    Filter,
    BarChart2,
} from "lucide-react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    Cell,
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
    INCOME_COLORS,
    CATEGORY_ICONS_Inc,
} from "../assets/color";

import { incomeStyles as styles } from "../assets/dummyStyles";

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
    } catch {
        return new Date().toISOString();
    }
}

const IncomeChart = ({
    chartData,
    timeFrame,
    timeFrameRange,
}) => {
    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeaderContainer}>
                <h3 className={styles.chartTitle}>
                    <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />

                    {timeFrame === "daily"
                        ? "Hourly"
                        : timeFrame === "yearly"
                            ? "Monthly"
                            : "Daily"}{" "}
                    Income Trends

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
                    <BarChart
                        data={chartData}
                        margin={{
                            top: 20,
                            right: 20,
                            left: 10,
                            bottom: 20,
                        }}
                    >
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
                            width={60}
                            tick={{
                                fill: "#6b7280",
                                fontSize: 12,
                            }}
                            tickFormatter={(value) =>
                                `$${Number(
                                    value
                                ).toLocaleString()}`
                            }
                        />

                        <Tooltip
                            formatter={(value) => [
                                `$${Math.round(
                                    value
                                ).toLocaleString()}`,
                                "Income",
                            ]}
                        />

                        <Bar
                            dataKey="income"
                            radius={[6, 6, 0, 0]}
                            barSize={20}
                            
                        >
                            {chartData.map(
                                (entry, index) => (
                                    <Cell
                                        key={index}
                                        fill={
                                            INCOME_COLORS[
                                            index %
                                            INCOME_COLORS.length
                                            ]
                                        }
                                    />
                                )
                            )}
                        </Bar>

                        {chartData.map(
                            (point, index) =>
                                point.isCurrent && (
                                    <ReferenceLine
                                        key={index}
                                        x={point.label}
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="3 3"
                                    />
                                )
                        )}
                    </BarChart>
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

                    <option value="Salary">
                        Salary
                    </option>

                    <option value="Freelance">
                        Freelance
                    </option>

                    <option value="Investment">
                        Investment
                    </option>

                    <option value="Bonus">
                        Bonus
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

const Income = () => {
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

    const [overview, setOverview] = useState({
        totalIncome: 0,
        averageIncome: 0,
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
            type: "income",
            category: "Salary",
        });

    const [editForm, setEditForm] = useState({
        description: "",
        amount: "",
        category: "Salary",
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

    const incomeTransactions = useMemo(() => {
        return (outletTransactions || [])
            .filter(
                (t) => t.type === "income"
            )
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );
    }, [outletTransactions]);

    const timeFrameTransactions =
        useMemo(() => {
            return incomeTransactions.filter(
                (t) =>
                    isDateInRange(
                        t.date,
                        timeFrameRange.start,
                        timeFrameRange.end
                    )
            );
        }, [
            incomeTransactions,
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
                income: 0,
            })
        );

        filteredTransactions.forEach(
            (transaction) => {
                const transDate =
                    new Date(
                        transaction.date
                    );

                const point = data.find(
                    (d) => {
                        if (
                            timeFrame ===
                            "daily"
                        ) {
                            return (
                                d.hour ===
                                transDate.getHours()
                            );
                        }

                        if (
                            timeFrame ===
                            "yearly"
                        ) {
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
                    }
                );

                if (point) {
                    point.income += Math.round(
                        Number(
                            transaction.amount
                        )
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
                    `${API_BASE}/income/overview`,
                    {
                        headers:
                            getAuthHeaders(),
                        params: { range },
                    }
                );

                const payload =
                    res.data?.data || {};

                setOverview({
                    totalIncome:
                        payload.totalIncome || 0,
                    averageIncome:
                        payload.averageIncome ||
                        0,
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

    const totalIncome = useMemo(() => {
        return (
            overview.totalIncome ||
            filteredTransactions.reduce(
                (sum, t) =>
                    sum +
                    Number(t.amount || 0),
                0
            )
        );
    }, [
        overview.totalIncome,
        filteredTransactions,
    ]);

    const averageIncome = useMemo(() => {
        if (overview.averageIncome) {
            return Math.round(
                overview.averageIncome
            );
        }

        if (!filteredTransactions.length) {
            return 0;
        }

        return Math.round(
            filteredTransactions.reduce(
                (sum, t) =>
                    sum +
                    Number(t.amount || 0),
                0
            ) /
            filteredTransactions.length
        );
    }, [
        overview.averageIncome,
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
                    `${API_BASE}/income/add`,
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
                    type: "income",
                    category: "Salary",
                });

                setShowModal(false);
            } catch (err) {
                console.error(
                    "Add income error:",
                    err
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
                    `${API_BASE}/income/update/${editingId}`,
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
                    "Update income error:",
                    err
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
                if (!id) return;

                const confirmDelete =
                    window.confirm(
                        "Are you sure you want to delete this income?"
                    );

                if (!confirmDelete) {
                    return;
                }

                try {
                    setLoading(true);

                    await axios.delete(
                        `${API_BASE}/income/delete/${id}`,
                        {
                            headers:
                                getAuthHeaders(),
                        }
                    );

                    await refreshTransactions();

                    await fetchOverview(
                        timeFrame
                    );
                } catch (err) {
                    console.error(
                        "Delete income error:",
                        err
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
        <div className={styles.wrapper}>
            <div className={styles.headerContainer}>
                <div className={styles.header}>
                    <div>
                        <h1
                            className={
                                styles.headerTitle
                            }
                        >
                            Income Overview
                        </h1>

                        <p
                            className={
                                styles.headerSubtitle
                            }
                        >
                            Track and manage your
                            income
                        </p>
                    </div>

                    <button
                        onClick={() =>
                            setShowModal(true)
                        }
                        className={
                            styles.addButton
                        }
                        disabled={loading}
                    >
                        <Plus size={18} />

                        {loading
                            ? "Processing..."
                            : "Add Income"}
                    </button>
                </div>

                <div
                    className={
                        styles.timeFrameContainer
                    }
                >
                    <TimeFrameSelector
                        timeFrame={timeFrame}
                        setTimeFrame={
                            setTimeFrame
                        }
                        options={[
                            "daily",
                            "weekly",
                            "monthly",
                            "yearly",
                        ]}
                        color="teal"
                    />
                </div>
            </div>

            <div className={styles.summaryGrid}>
                <FinancialCard
                    icon={
                        <div
                            className={
                                styles.iconGreen
                            }
                        >
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                    }
                    label="Total Income"
                    value={`$${Number(
                        totalIncome
                    ).toLocaleString()}`}
                />

                <FinancialCard
                    icon={
                        <div
                            className={
                                styles.iconBlue
                            }
                        >
                            <BarChart2 className="w-5 h-5 text-blue-600" />
                        </div>
                    }
                    label="Average Income"
                    value={`$${Number(
                        averageIncome
                    ).toLocaleString()}`}
                />

                <FinancialCard
                    icon={
                        <div
                            className={
                                styles.iconPurple
                            }
                        >
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                    }
                    label="Transactions"
                    value={transactionsCount}
                />
            </div>

            <IncomeChart
                chartData={chartData}
                timeFrame={timeFrame}
                timeFrameRange={
                    timeFrameRange
                }
            />

            <div className={styles.listContainer}>
                <div className={styles.header}>
                    <h3
                        className={
                            styles.sectionTitle
                        }
                    >
                        <DollarSign className="w-5 h-5 text-green-500" />

                        Income Transactions
                    </h3>

                    <FilterSection
                        filter={filter}
                        setFilter={setFilter}
                    />
                </div>

                <div
                    className={
                        styles.transactionList
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
                                key={
                                    transaction.id
                                }
                                transaction={
                                    transaction
                                }
                                isEditing={
                                    editingId ===
                                    transaction.id
                                }
                                editForm={
                                    editForm
                                }
                                setEditForm={
                                    setEditForm
                                }
                                onSave={
                                    handleEditTransaction
                                }
                                onCancel={() =>
                                    setEditingId(
                                        null
                                    )
                                }
                                onDelete={
                                    handleDeleteTransaction
                                }
                                type="income"
                                categoryIcons={
                                    CATEGORY_ICONS_Inc
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
                                    setShowAll(
                                        true
                                    )
                                }
                                className={
                                    styles.viewAllButton
                                }
                            >
                                <Eye size={18} />

                                View All
                            </button>
                        )}

                    {filteredTransactions.length ===
                        0 && (
                            <div
                                className={
                                    styles.emptyStateContainer
                                }
                            >
                                <div
                                    className={
                                        styles.emptyStateIcon
                                    }
                                >
                                    <DollarSign className="w-8 h-8 text-green-400" />
                                </div>

                                <p
                                    className={
                                        styles.emptyStateText
                                    }
                                >
                                    No income
                                    transactions
                                    found
                                </p>

                                <button
                                    onClick={() =>
                                        setShowModal(
                                            true
                                        )
                                    }
                                    className={
                                        styles.emptyStateButton
                                    }
                                >
                                    <Plus size={16} />

                                    Add Income
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
                type="income"
                title="Add New Income"
                buttonText="Add Income"
                categories={[
                    "Salary",
                    "Freelance",
                    "Investment",
                    "Bonus",
                    "Other",
                ]}
                color="teal"
            />
        </div>
    );
};

export default Income;