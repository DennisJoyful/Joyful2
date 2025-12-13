// app/dashboard/manager/werber/page.tsx
import WerberManager from '@/components/sws/WerberManager'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page(){
  return <div className="p-4 md:p-6"><WerberManager /></div>
}
