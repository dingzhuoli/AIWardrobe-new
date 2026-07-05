import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function FilterBar({ onSearch, onFilterChange }) {
    const { t } = useTranslation()
    const [searchText, setSearchText] = useState('')
    const [selectedSeasons, setSelectedSeasons] = useState([])
    const [selectedStyles, setSelectedStyles] = useState([])

    const SEASONS = [
        { key: 'spring', label: t('filter.spring') },
        { key: 'summer', label: t('filter.summer') },
        { key: 'autumn', label: t('filter.autumn') },
        { key: 'winter', label: t('filter.winter') }
    ]

    const STYLES = [
        { key: 'casual', label: t('filter.casual') },
        { key: 'formal', label: t('filter.formal') },
        { key: 'sport', label: t('filter.sport') },
        { key: 'business', label: t('filter.business') },
        { key: 'vintage', label: t('filter.vintage') },
        { key: 'minimal', label: t('filter.minimal') },
        { key: 'daily', label: t('filter.daily') },
        { key: 'commute', label: t('filter.commute') }
    ]

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(searchText)
        }, 200)

        return () => clearTimeout(timer)
    }, [searchText, onSearch])

    const toggleSeason = (season) => {
        const newSeasons = selectedSeasons.includes(season)
            ? selectedSeasons.filter(s => s !== season)
            : [...selectedSeasons, season]

        setSelectedSeasons(newSeasons)
        onFilterChange({ seasons: newSeasons, styles: selectedStyles })
    }

    const toggleStyle = (style) => {
        const newStyles = selectedStyles.includes(style)
            ? selectedStyles.filter(s => s !== style)
            : [...selectedStyles, style]

        setSelectedStyles(newStyles)
        onFilterChange({ seasons: selectedSeasons, styles: newStyles })
    }

    const chipClass = (active) => `liquid-chip ${active ? 'liquid-chip-active' : ''}`

    return (
        <div className="liquid-glass rounded-[28px] px-3 py-3 space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} />
                <input
                    type="text"
                    placeholder={t('wardrobe.searchPlaceholder')}
                    className="liquid-search text-sm placeholder:text-[var(--text-tertiary)]"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] whitespace-nowrap uppercase tracking-wider">{t('filter.season')}</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {SEASONS.map(season => (
                            <button
                                key={season.key}
                                className={chipClass(selectedSeasons.includes(season.label))}
                                onClick={() => toggleSeason(season.label)}
                            >
                                {season.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] whitespace-nowrap uppercase tracking-wider">{t('filter.style')}</span>
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        {STYLES.map(style => (
                            <button
                                key={style.key}
                                className={chipClass(selectedStyles.includes(style.label))}
                                onClick={() => toggleStyle(style.label)}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
