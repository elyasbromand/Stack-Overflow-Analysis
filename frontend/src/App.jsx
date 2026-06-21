
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard.jsx'
import YearlyByCategory from './YearlyByCategory.jsx'
import CategoryShare from './CategoryShare.jsx'
import TagBreakdown from './TagBreakdown.jsx'
import DeclineRanking from './DeclineRanking.jsx'
import MonthlyRecent from './MonthlyRecent.jsx'
import EngagementTrend from './EngagementTrend.jsx'
import Summary from './Summary.jsx'
import Sidebar from './Sidebar.jsx'

function App() {
  return (
    <>
      <Sidebar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/yearly-by-category" element={<YearlyByCategory />} />
        <Route path="/category-share" element={<CategoryShare />} />
        <Route path="/tag-breakdown" element={<TagBreakdown />} />
        <Route path="/decline-ranking" element={<DeclineRanking />} />
        <Route path="/monthly-recent" element={<MonthlyRecent />} />
        <Route path="/engagement-trend" element={<EngagementTrend />} />
        <Route path="/summary" element={<Summary />} />
      </Routes>
    </>
  )
}

export default App;