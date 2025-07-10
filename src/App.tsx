import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Header from './components/layout/Header';
import ComposeEmail from './components/email/ComposeEmail';
import Dashboard from './components/email/Dashboard';
import EmailHistory from './components/email/EmailHistory';
import Settings from './components/admin/Settings';
import AuditLog from './components/admin/AuditLog';

function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    if (showRegisterForm) {
      return <RegisterForm onSwitchToLogin={() => setShowRegisterForm(false)} />;
    }
    return <LoginForm onSwitchToRegister={() => setShowRegisterForm(true)} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'compose':
        return <ComposeEmail />;
      case 'dashboard':
        return <Dashboard />;
      case 'history':
        return <EmailHistory />;
      case 'settings':
        return <Settings />;
      case 'audit':
        return <AuditLog />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="py-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;