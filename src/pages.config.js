import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import History from './pages/History';
import StockAnalysis from './pages/StockAnalysis';
import RecommendationDetail from './pages/RecommendationDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Analyze": Analyze,
    "History": History,
    "StockAnalysis": StockAnalysis,
    "RecommendationDetail": RecommendationDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};