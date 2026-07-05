import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sparkles, RefreshCw, Mic, MicOff, Sun, Tornado } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useRecommendation } from '../contexts/RecommendationContext'

import { toImageUrl } from '../utils/api'

export default function Recommendation() {
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const {
        loading,
        error,
        weather,
        horoscope,
        temperatureRule,
        recommendation,
        outfitSummary,
        selectionReasons,
        suggestedTop,
        suggestedBottom,
        suggestedShoes,
        suggestedAccessories,
        purchaseSuggestions,
        goalRaw,
        goalNormalized,
        selectedCity,
        fetchRecommendation
    } = useRecommendation()

    const [goalInput, setGoalInput] = useState('')
    const [selectedMode, setSelectedMode] = useState('balanced')
    const [isListening, setIsListening] = useState(false)
    const [speechSupported] = useState(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition))
    const [speechError, setSpeechError] = useState('')
    const recognitionRef = useRef(null)
    const displayedRecommendation = recommendation

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.maxAlternatives = 1

        recognition.onresult = (event) => {
            const transcript = event.results?.[0]?.[0]?.transcript || ''
            if (transcript.trim()) {
                setGoalInput(transcript.trim())
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognition.onerror = (event) => {
            if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
                setSpeechError(t('recommendation.voicePermissionDenied'))
            } else if (event?.error === 'no-speech') {
                setSpeechError(t('recommendation.voiceNoSpeech'))
            } else {
                setSpeechError(t('recommendation.voiceError'))
            }
            setIsListening(false)
        }

        recognitionRef.current = recognition

        return () => {
            try {
                recognition.stop()
            } catch {
                // noop
            }
            recognitionRef.current = null
        }
    }, [t])

    const speechLocale = () => {
        if (i18n.language.startsWith('ja')) {
            return 'ja-JP'
        }
        if (i18n.language.startsWith('en')) {
            return 'en-US'
        }
        return 'zh-CN'
    }

    const toggleListening = () => {
        if (loading) {
            return
        }
        const recognition = recognitionRef.current
        if (!recognition || !speechSupported) {
            setSpeechError(t('recommendation.voiceUnsupported'))
            return
        }

        if (isListening) {
            recognition.stop()
            return
        }

        setSpeechError('')
        recognition.lang = speechLocale()
        try {
            recognition.start()
            setIsListening(true)
        } catch {
            setSpeechError(t('recommendation.voiceError'))
            setIsListening(false)
        }
    }

    const refreshRecommendation = () => {
        if (loading) {
            return
        }
        void fetchRecommendation(selectedCity.id, selectedCity.name, goalInput, selectedMode)
    }

    const generateRecommendation = () => {
        if (loading) {
            return
        }
        void fetchRecommendation(selectedCity.id, selectedCity.name, goalInput, selectedMode)
    }

    const getWeatherIconComponent = (icon) => {
        const iconMap = {
            '100': Sun, '101': Cloud, '102': CloudSun, '103': CloudSun, '104': Cloud,
            '150': Moon, '300': CloudRain, '301': CloudLightning, '302': CloudLightning, '303': CloudLightning,
            '304': CloudSnow, '305': CloudRain, '306': CloudRain, '307': CloudRain, '308': CloudRain,
            '309': CloudRain, '310': CloudLightning, '311': CloudLightning, '312': CloudLightning, '313': CloudSnow,
            '314': CloudRain, '315': CloudRain, '316': CloudRain, '317': CloudLightning, '318': CloudLightning,
            '399': CloudRain, '400': CloudSnow, '401': CloudSnow, '402': CloudSnow, '403': CloudSnow,
            '404': CloudSnow, '405': CloudSnow, '406': CloudSnow, '407': CloudSnow, '408': CloudSnow,
            '409': CloudSnow, '410': CloudSnow, '499': CloudSnow, '500': CloudFog, '501': CloudFog,
            '502': CloudFog, '503': Tornado, '504': Tornado, '507': Tornado, '508': Tornado,
            '509': CloudFog, '510': CloudFog, '511': CloudFog, '512': CloudFog, '513': CloudFog,
            '514': CloudFog, '515': CloudFog
        }
        return iconMap[icon] || CloudSun
    }

    const renderClothingCard = (item, label, reason) => {
        if (!item) {
            return null
        }
        const reasonText = reason || t('recommendation.reasonFallback')
        return (
            <div className="card group overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--line)]">
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">{label}</span>
                </div>
                <div className="media-tile aspect-square p-4 border-b border-[var(--line)] relative overflow-hidden">
                    {item.image_url ? (
                        <img
                            src={toImageUrl(item.image_url)}
                            alt={item.item}
                            className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full rounded-lg bg-[var(--accent-soft)]" />
                    )}
                </div>
                <div className="p-3">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{item.item}</div>
                    {item.description && (
                        <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{item.description}</div>
                    )}
                    <div className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">{reasonText}</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col pt-safe pb-24 relative overflow-hidden">

            {!weather && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center animate-fade-in -mt-8">
                    <div className="liquid-glass w-20 h-20 rounded-full flex items-center justify-center text-[var(--accent)] mb-6">
                        <Sparkles size={36} />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight leading-tight">{t('recommendation.getTitle')}<br />{t('recommendation.getSubtitle')}</h2>
                    <p className="text-zinc-500 text-sm mb-8 leading-relaxed max-w-[260px] mx-auto">{t('recommendation.description')}</p>
                    <div className="w-full max-w-xs space-y-3 mb-4 text-left">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                            {t('recommendation.modeLabel')}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {['balanced', 'goal_first', 'wardrobe_first'].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className={`px-2 py-2 rounded-lg text-xs border transition-colors ${
                                        selectedMode === option
                                            ? 'liquid-chip liquid-chip-active'
                                            : 'liquid-chip'
                                    }`}
                                    disabled={loading}
                                    onClick={() => setSelectedMode(option)}
                                >
                                    {t(`recommendation.mode.${option}`)}
                                </button>
                            ))}
                        </div>
                        <div className="text-[11px] text-zinc-500 leading-relaxed">
                            {t(`recommendation.modeHint.${selectedMode}`)}
                        </div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                            {t('recommendation.goalLabel')}
                        </label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                                className="input flex-1"
                                value={goalInput}
                                onChange={(event) => setGoalInput(event.target.value)}
                                placeholder={t('recommendation.goalPlaceholder')}
                            />
                            <button
                                type="button"
                                className="btn-secondary px-3 w-full sm:w-auto justify-center"
                                onClick={toggleListening}
                                disabled={!speechSupported || loading}
                                title={speechSupported
                                    ? (isListening ? t('recommendation.voiceStop') : t('recommendation.voiceStart'))
                                    : t('recommendation.voiceUnsupported')}
                            >
                                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                            </button>
                        </div>
                        <div className="text-[11px] text-zinc-500 leading-relaxed">
                            {!speechSupported
                                ? t('recommendation.voiceUnsupported')
                                : loading
                                    ? t('recommendation.voiceBusy')
                                    : (isListening ? t('recommendation.voiceListening') : t('recommendation.goalHint'))}
                        </div>
                        {speechError && (
                            <div className="text-[11px] text-red-600 dark:text-red-300 leading-relaxed">
                                {speechError}
                            </div>
                        )}
                    </div>

                    <button
                        className="btn-primary w-full max-w-xs py-3.5 disabled:opacity-60"
                        onClick={generateRecommendation}
                        disabled={loading}
                    >
                        <Sparkles size={18} className="animate-pulse" />
                        <span className="font-semibold tracking-wide">{t('recommendation.generate')}</span>
                    </button>
                    <div className="mt-6">
                        <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">{t('recommendation.currentLocation')}: {selectedCity.name}</span>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
                    <div className="w-16 h-16 relative flex items-center justify-center mb-6">
                        <div className="absolute inset-0 border-4 border-[var(--line)] rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        <Sparkles className="text-accent animate-pulse" size={20} />
                    </div>
                    <span className="text-zinc-500 text-sm font-medium tracking-wider animate-pulse">{t('recommendation.aiLoading')}</span>
                </div>
            )}

            {!loading && weather && (
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 z-10 space-y-6 max-w-6xl mx-auto w-full">
                    {error && (
                        <div className="subtle-panel p-3 text-xs text-red-700 dark:text-red-200">
                            {error}
                        </div>
                    )}
                    <div className="liquid-panel text-white p-6 rounded-[30px] relative overflow-hidden group bg-[linear-gradient(135deg,var(--accent),var(--accent-2))]">
                        <div className="absolute -right-4 -top-8 opacity-20 blur-[1px] mix-blend-overlay group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                            {(() => {
                                const WeatherIcon = getWeatherIconComponent(weather.icon)
                                return <WeatherIcon size={118} strokeWidth={1.35} />
                            })()}
                        </div>
                        <div className="relative z-10 flex items-start flex-col">
                            <div className="flex items-end gap-3 mb-6">
                                <span className="text-5xl font-light tracking-tighter">{Math.round(weather.temperature)}°</span>
                                <div className="flex flex-col pb-1">
                                    <span className="text-lg font-bold">{weather.condition}</span>
                                    <span className="text-xs text-blue-100">{t('recommendation.feelsLike')} {Math.round(weather.feelsLike)}°</span>
                                </div>
                            </div>
                            <div className="flex gap-6 pt-4 border-t border-white/20">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">{t('recommendation.humidity')}</span>
                                    <span className="text-sm font-semibold">{weather.humidity}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">{t('recommendation.wind')}</span>
                                    <span className="text-sm font-semibold">{weather.windScale}{t('recommendation.windLevel')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {horoscope && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="card p-4">
                                <div className="text-xs text-zinc-400">{t('recommendation.horoscopeSign')}</div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{horoscope.zodiac_name || t('home.unknownZodiac')}</div>
                            </div>
                            <div className="card p-4">
                                <div className="text-xs text-zinc-400">{t('recommendation.mood')}</div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{horoscope.mood}</div>
                            </div>
                            <div className="card p-4">
                                <div className="text-xs text-zinc-400">{t('recommendation.luckyColor')}</div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{horoscope.lucky_color}</div>
                            </div>
                            <div className="card p-4">
                                <div className="text-xs text-zinc-400">{t('recommendation.luckyNumber')}</div>
                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{horoscope.lucky_number}</div>
                            </div>
                            <div className="card col-span-2 sm:col-span-4 p-4">
                                <div className="text-xs text-zinc-400">{t('recommendation.horoscopeSummary')}</div>
                                <div className="text-sm text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">{horoscope.summary}</div>
                            </div>
                        </div>
                    )}

                    {(goalRaw || goalNormalized) && (
                        <div className="card p-4">
                            <div className="text-xs text-zinc-400 mb-1">{t('recommendation.goalUsed')}</div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {goalRaw || goalNormalized}
                            </div>
                        </div>
                    )}

                    {temperatureRule && (
                        <div className="card p-4">
                            <div className="text-xs text-zinc-400 mb-1">{t('recommendation.temperatureRule')}</div>
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{temperatureRule.label}</div>
                            <div className="text-xs text-zinc-500 mt-2">{temperatureRule.advice}</div>
                            {temperatureRule.allowed_seasons?.length > 0 && (
                                <div className="text-xs text-zinc-500 mt-2">{t('recommendation.allowedSeasons')}: {temperatureRule.allowed_seasons.join(' / ')}</div>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center justify-between pl-1">
                            <div className="flex items-center gap-2">
                                <Sparkles size={18} className="text-accent" />
                                <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-lg">{t('recommendation.aiTitle')}</h3>
                            </div>
                            <button className="text-zinc-400 hover:text-accent hover:rotate-180 transition-all duration-500 p-2" onClick={refreshRecommendation} title={t('recommendation.regenerate')}>
                                <RefreshCw size={16} />
                            </button>
                        </div>

                        <div className="card p-6">
                            <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed font-serif tracking-wide">
                                <ReactMarkdown>{displayedRecommendation}</ReactMarkdown>
                            </div>
                        </div>
                    </div>

                    {outfitSummary && (
                        <div className="subtle-panel p-4 text-sm text-blue-700 dark:text-blue-200">
                            <span className="font-semibold">{t('recommendation.outfitSummary')}:</span> {outfitSummary}
                        </div>
                    )}

                    {(suggestedTop || suggestedBottom || suggestedShoes) && (
                        <div className="space-y-4 pt-2">
                            <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-lg pl-1">{t('recommendation.suggestedCombo')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                {renderClothingCard(suggestedTop, t('recommendation.topWear'), selectionReasons?.top)}
                                {renderClothingCard(suggestedBottom, t('recommendation.bottomWear'), selectionReasons?.bottom)}
                                {renderClothingCard(suggestedShoes, t('recommendation.shoesWear'), selectionReasons?.shoes)}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button className="btn-secondary" onClick={refreshRecommendation}>
                                    <RefreshCw size={15} />
                                    {t('recommendation.regenerate')}
                                </button>
                                <button className="btn-secondary" onClick={() => navigate('/outfit')}>
                                    <Sparkles size={15} />
                                    {t('recommendation.goOutfit')}
                                </button>
                                <button className="btn-secondary" onClick={() => navigate('/wardrobe')}>
                                    <Sparkles size={15} />
                                    {t('recommendation.goWardrobe')}
                                </button>
                            </div>
                        </div>
                    )}

                    {suggestedAccessories.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-lg pl-1">{t('recommendation.accessories')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {suggestedAccessories.map((accessory, index) => (
                                    <div key={`${accessory.name}-${index}`} className="card p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{accessory.name}</div>
                                                <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{accessory.reason}</div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${
                                                accessory.from_wardrobe
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                            }`}>
                                                {accessory.from_wardrobe ? t('recommendation.fromWardrobe') : t('recommendation.needBuy')}
                                            </span>
                                        </div>
                                        {accessory.item?.image_url && (
                                            <div className="media-tile mt-3 h-24 p-2">
                                                <img
                                                    src={toImageUrl(accessory.item.image_url)}
                                                    alt={accessory.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {purchaseSuggestions.length > 0 && (
                        <div className="space-y-3 pb-2">
                            <h3 className="font-serif font-bold text-zinc-900 dark:text-zinc-100 tracking-tight text-lg pl-1">{t('recommendation.purchaseFallback')}</h3>
                            <div className="space-y-3">
                                {purchaseSuggestions.map((suggestion, index) => (
                                    <div key={`${suggestion.category}-${index}`} className="card p-4">
                                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{suggestion.title}</div>
                                        <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{suggestion.reason}</div>
                                        {suggestion.keywords?.length > 0 && (
                                            <div className="text-xs text-zinc-500 mt-2">{t('recommendation.buyKeywords')}: {suggestion.keywords.join(' / ')}</div>
                                        )}
                                        {suggestion.horoscope_hint && (
                                            <div className="text-xs text-blue-600 dark:text-blue-300 mt-2">{suggestion.horoscope_hint}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
