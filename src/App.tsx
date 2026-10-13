import { Route, Routes, useParams } from 'react-router'
import { CampaignDetail } from './pages/CampaignDetail'
import { Campaigns } from './pages/Campaigns'
import { Accounts, Inventory, ReviewQueue } from './pages/Internal'
import { Budget, Creatives, Reports } from './pages/More'
import { OfferBuilder, Offers } from './pages/Offers'
import { Overview } from './pages/Overview'
import { ShopperPreview } from './pages/ShopperPreview'
import { Layout } from './shell/Layout'
import { useStore } from './state/store'
import { CustomBuilder } from './wizard/CustomBuilder'
import { Wizard } from './wizard/Wizard'

/** Custom campaigns are edited in their own builder; goal-based ones in the wizard. */
function EditCampaign() {
  const { id } = useParams()
  const { campaigns } = useStore()
  return campaigns.find((c) => c.id === id)?.goal === 'custom' ? <CustomBuilder /> : <Wizard />
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<Wizard />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/campaigns/custom/new" element={<CustomBuilder />} />
        <Route path="/campaigns/:id/edit" element={<EditCampaign />} />
        <Route path="/internal/review" element={<ReviewQueue />} />
        <Route path="/internal/accounts" element={<Accounts />} />
        <Route path="/internal/inventory" element={<Inventory />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/offers/new" element={<OfferBuilder />} />
        <Route path="/offers/:id/edit" element={<OfferBuilder />} />
        <Route path="/creatives" element={<Creatives />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/preview" element={<ShopperPreview />} />
      </Routes>
    </Layout>
  )
}
