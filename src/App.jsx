import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Profile from './pages/Profile';

const API_URL = "https://expense-tracker-backend-c1iz.onrender.com";

// Get transactions from localStorage
const getTransactionsFromStorage = () => {
  const saved = localStorage.getItem("transactions");
  return saved ? JSON.parse(saved) : [];
};

// Protected Route
const ProtectedRoute = ({ user, children }) => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // Load user + transactions on mount
  useEffect(() => {
    const loadApp = async () => {
      try {
        const storedUser =
          localStorage.getItem("user") ||
          sessionStorage.getItem("user");

        const storedToken =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        setTransactions(getTransactionsFromStorage());

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }

        if (storedToken) {
          const res = await axios.get(`${API_URL}/user/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          setUser(res.data.user || res.data);
        }
      } catch (err) {
        console.log("Invalid token", err);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadApp();
  }, []);

  // Save transactions
  useEffect(() => {
    localStorage.setItem(
      "transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  // Save auth
  const persistAuth = (
    userObj,
    tokenStr,
    remember = false
  ) => {
    if (remember) {
      localStorage.setItem(
        "user",
        JSON.stringify(userObj)
      );
      localStorage.setItem("token", tokenStr);
      sessionStorage.clear();
    } else {
      sessionStorage.setItem(
        "user",
        JSON.stringify(userObj)
      );
      sessionStorage.setItem("token", tokenStr);
      localStorage.clear();
    }

    setUser(userObj);
    setToken(tokenStr);
  };

  // Clear auth
  const clearAuth = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setToken(null);
  };

  // Auth handlers
  const handleLogin = (userData, tokenFromApi) => {
    persistAuth(userData, tokenFromApi);
    navigate("/");
  };

  const handleSignup = (userData, tokenFromApi) => {
    persistAuth(userData, tokenFromApi);
    navigate("/");
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // Transaction helpers
  const addTransaction = (newTransaction) =>
    setTransactions((prev) => [
      newTransaction,
      ...prev,
    ]);

  const editTransaction = (
    id,
    updatedTransaction
  ) =>
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...updatedTransaction, id }
          : t
      )
    );

  const deleteTransaction = (id) =>
    setTransactions((prev) =>
      prev.filter((t) => t.id !== id)
    );

  const refreshTransactions = () =>
    setTransactions(getTransactionsFromStorage());

  // Loading screen
  if (isLoading) {
    return (
      <div className="text-center mt-10">
        Loading...
      </div>
    );
  }

  return (
    <Routes>

      <Route
        path="/login"
        element={<Login onLogin={handleLogin} />}
      />

      <Route
        path="/signup"
        element={<Signup onSignup={handleSignup} />}
      />


      <Route
        path="/"
        element={
          <ProtectedRoute user={user}>
            <Layout
              user={user}
              onLogout={handleLogout}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />

        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        <Route
          path="income"
          element={<Income />}
        />

        <Route
          path="expense"
          element={<Expense />}
        />

        <Route
          path="profile"
          element={<Profile />}
        />
      </Route>
      <Route
        path='*'
        element={<Navigate to={user ? "/" : "/login"} replace />}
      />



    </Routes>
  );
}

export default App;