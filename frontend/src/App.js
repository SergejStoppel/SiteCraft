import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import ServicesPage from './pages/ServicesPage';
import AccessibilityServicePage from './pages/AccessibilityServicePage';
import SeoContentServicePage from './pages/SeoContentServicePage';
import WebsiteOverhaulServicePage from './pages/WebsiteOverhaulServicePage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import FreeAuditPage from './pages/FreeAuditPage';
import { ThemeProvider } from './theme/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './styles/globals.css';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-surface-primary);
  font-family: var(--font-family-secondary);
`;

const MainContent = styled.main`
  flex: 1;
  padding: 0;
`;

// Placeholder components for pages not yet implemented
const PlaceholderPage = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-4xl);
  text-align: center;
`;

const PlaceholderTitle = styled.h1`
  font-size: var(--font-size-5xl);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
  font-weight: var(--font-weight-bold);
`;

const PlaceholderText = styled.p`
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  max-width: 600px;
  line-height: var(--line-height-relaxed);
`;

const ComingSoonPage = ({ title, description }) => (
  <PlaceholderPage>
    <PlaceholderTitle>{title}</PlaceholderTitle>
    <PlaceholderText>{description}</PlaceholderText>
  </PlaceholderPage>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContainer>
          <Header />
          <MainContent>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/accessibility" element={<AccessibilityServicePage />} />
              <Route path="/services/seo-content" element={<SeoContentServicePage />} />
              <Route path="/services/website-overhaul" element={<WebsiteOverhaulServicePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/free-audit" element={<FreeAuditPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/case-studies" element={<CaseStudiesPage />} />
              {/* 404 Page */}
              <Route path="*" element={
                <ComingSoonPage 
                  title="Page Not Found" 
                  description="The page you're looking for doesn't exist or hasn't been implemented yet." 
                />
              } />
            </Routes>
          </MainContent>
          <Footer />
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AppContainer>
      </Router>
    </ThemeProvider>
  );
}

export default App;