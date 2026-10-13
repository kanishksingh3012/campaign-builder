import { Route, Routes } from 'react-router'
import { CampaignDetail } from './pages/CampaignDetail'
import { Campaigns } from './pages/Campaigns'
import { Budget, Creatives, Reports } from './pages/More'
import { Overview } from './pages/Overview'
import { ShopperPreview } from './pages/ShopperPreview'
import { Layout } from './shell/Layout'
import { Wizard } from './wizard/Wizard'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<Wizard />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/campaigns/:id/edit" element={<Wizard />} />
        <Route path="/creatives" element={<Creatives />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/preview" element={<ShopperPreview />} />
      </Routes>
    </Layout>
  )
}
