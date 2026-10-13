import { Route, Routes } from 'react-router'
import { Campaigns } from './pages/Campaigns'
import { ComingNext, Layout } from './shell/Layout'
import { Wizard } from './wizard/Wizard'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ComingNext title="Overview" />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<Wizard />} />
        <Route path="/campaigns/:id" element={<ComingNext title="Campaign" />} />
        <Route path="/campaigns/:id/edit" element={<Wizard />} />
        <Route path="/creatives" element={<ComingNext title="Creatives" />} />
        <Route path="/reports" element={<ComingNext title="Reports" />} />
        <Route path="/budget" element={<ComingNext title="Budget" />} />
        <Route path="/preview" element={<ComingNext title="Shopper preview" />} />
      </Routes>
    </Layout>
  )
}
