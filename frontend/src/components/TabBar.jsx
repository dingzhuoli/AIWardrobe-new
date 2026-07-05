import { useNavigate, useLocation } from 'react-router-dom'
import { House, PlusCircle, Search, User, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function TabBar() {
    const navigate = useNavigate()
    const location = useLocation()
    const { t } = useTranslation()

    const tabs = [
        { path: '/', icon: House, label: t('tabs.home') },
        { path: '/entry', icon: PlusCircle, label: t('tabs.entry') },
        { path: '/wardrobe', icon: Search, label: t('tabs.wardrobe') },
        { path: '/outfit', icon: User, label: t('tabs.outfit') },
        { path: '/recommendation', icon: Sparkles, label: t('tabs.recommendation') }
    ]

    return (
        <>
            <nav className="fixed bottom-3 left-0 right-0 z-50 px-3 pb-safe lg:hidden">
                <div className="liquid-tabbar mx-auto max-w-md rounded-full p-1.5">
                    <div className="grid h-16 grid-cols-5 items-center gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = location.pathname === tab.path
                            return (
                                <button
                                    key={tab.path}
                                    className={`liquid-tab flex h-full flex-col items-center justify-center gap-0.5 ${isActive ? 'liquid-tab-active' : ''}`}
                                    onClick={() => navigate(tab.path)}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <Icon size={21} className={`transition-transform duration-300 ${isActive ? 'scale-105 stroke-[2.45px]' : ''}`} />
                                    <span className="max-w-full truncate px-1 text-[10px] font-semibold leading-tight">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </nav>

            <nav className="pointer-events-none fixed left-0 right-0 top-4 z-50 hidden lg:block">
                <div className="mx-auto flex w-full max-w-screen-2xl justify-center px-6">
                    <div className="liquid-tabbar pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = location.pathname === tab.path
                            return (
                                <button
                                    key={tab.path}
                                    className={`liquid-tab inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-semibold ${isActive ? 'liquid-tab-active' : ''}`}
                                    onClick={() => navigate(tab.path)}
                                    aria-current={isActive ? 'page' : undefined}
                                >
                                    <Icon size={16} className={isActive ? 'stroke-[2.4px]' : ''} />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </nav>
        </>
    )
}
