import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN'; // Change to your preferred locale
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import GalleryPage from './pages/GalleryPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <ConfigProvider
      locale={zhCN} // Set locale if needed
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<GalleryPage />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;