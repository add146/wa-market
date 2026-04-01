import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon } from '../components/atoms'
import LoadingState from '../components/atoms/LoadingState'
import { useCoursePlayer, useCompleteLesson } from '../hooks/useCourses'

function CoursePlayerPage() {
    const { id: productId } = useParams()
    const navigate = useNavigate()
    const containerRef = useRef(null)

    const { data: courseData, isLoading, isError } = useCoursePlayer(productId)
    const completeLesson = useCompleteLesson()

    const [activeLesson, setActiveLesson] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Set first incomplete lesson or first lesson as active initially
    useEffect(() => {
        if (courseData?.curriculum && !activeLesson) {
            let found = false
            for (const section of courseData.curriculum) {
                for (const lesson of section.lessons) {
                    if (!courseData.progress?.completedLessons?.includes(lesson.id)) {
                        setActiveLesson(lesson)
                        found = true
                        break
                    }
                }
                if (found) break
            }
            if (!found && courseData.curriculum[0]?.lessons[0]) {
                setActiveLesson(courseData.curriculum[0].lessons[0])
            }
        }
    }, [courseData])

    // Detect fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const handleComplete = async () => {
        if (!activeLesson || completeLesson.isPending) return
        try {
            await completeLesson.mutateAsync({
                productId,
                lessonId: activeLesson.id
            })
            // Find next lesson to autoplay
            const allLessons = courseData.curriculum.flatMap(s => s.lessons)
            const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id)
            if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
                setActiveLesson(allLessons[currentIndex + 1])
            }
        } catch (err) {
            console.error(err)
        }
    }

    // Embed URL helper (YouTube / Vimeo proxy)
    const getEmbedUrl = (url) => {
        if (!url) return ''
        let match;
        // YouTube
        match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)
        if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&controls=0&disablekb=1`
        // Vimeo
        match = url.match(/vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/i)
        if (match) return `https://player.vimeo.com/video/${match[1]}?autoplay=0&title=0&byline=0&portrait=0`
        
        return url
    }

    if (isLoading) return <LoadingState />
    if (isError || !courseData?.curriculum) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200 dark:border-slate-700">
                    <Icon name="block" size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Akses Ditolak</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Anda tidak memiliki akses ke kelas ini. Silakan beli terlebih dahulu.</p>
                    <button onClick={() => navigate('/my-library')} className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-bold">
                        Kembali ke Pustaka
                    </button>
                </div>
            </div>
        )
    }

    const curriculum = courseData.curriculum || []
    const completedIds = courseData.progress?.completedLessons || []
    
    // Calculate progress
    const totalLessons = curriculum.reduce((acc, sec) => acc + sec.lessons.length, 0)
    const progressPercent = totalLessons === 0 ? 0 : Math.round((completedIds.length / totalLessons) * 100)

    const isCurrentCompleted = activeLesson ? completedIds.includes(activeLesson.id) : false

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 font-sans" ref={containerRef}>
            {/* Top Navbar */}
            <div className={`h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-20 ${isFullscreen ? 'hidden' : ''}`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/my-library')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">
                        <Icon name="arrow_back" size={24} />
                    </button>
                    <div className="hidden sm:block">
                        <h1 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">{courseData.productName}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Progres Belajar</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{progressPercent}%</p>
                        </div>
                        <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)} 
                        className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <Icon name={sidebarOpen ? "close" : "menu"} size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left: Player & Content */}
                <div className={`flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-all duration-300 ${sidebarOpen ? 'lg:mr-80' : ''}`}>
                    
                    {/* Video Player Box */}
                    {activeLesson?.type === 'video' ? (
                        <div className="w-full bg-black aspect-video relative">
                            {activeLesson.videoUrl ? (
                                <iframe 
                                    src={getEmbedUrl(activeLesson.videoUrl)} 
                                    className="absolute inset-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                                    Video belum tersedia
                                </div>
                            )}
                            
                            {/* Fullscreen Toggle (Only useful if iframe doesn't override it) */}
                            <button 
                                onClick={toggleFullscreen} 
                                className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-lg backdrop-blur-sm transition-colors z-10 hidden"
                            >
                                <Icon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} size={24} />
                            </button>
                        </div>
                    ) : activeLesson?.type === 'audio' ? (
                        <div className="w-full bg-slate-900 aspect-[21/9] flex flex-col items-center justify-center relative p-8">
                            <Icon name="headphones" size={64} className="text-primary mb-6" />
                            <audio controls className="w-full max-w-md h-12" src={activeLesson.audioUrl}>
                                Browser Anda tidak mendukung audio player.
                            </audio>
                        </div>
                    ) : (
                        <div className="w-full bg-slate-100 dark:bg-slate-800 aspect-[21/9] flex items-center justify-center border-b border-slate-200 dark:border-slate-700">
                            <Icon name="article" size={48} className="text-slate-400" />
                        </div>
                    )}

                    {/* Content Detail Below Player */}
                    <div className="max-w-4xl w-full mx-auto p-6 md:p-8 shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                    {activeLesson?.title || 'Pilih materi untuk mulai'}
                                </h2>
                                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Icon name={activeLesson?.type === 'video' ? 'play_circle' : activeLesson?.type === 'audio' ? 'headphones' : 'article'} size={18} />
                                        {activeLesson?.type === 'video' ? 'Video' : activeLesson?.type === 'audio' ? 'Audio' : 'Teks'}
                                    </span>
                                    {activeLesson?.duration && (
                                        <span className="flex items-center gap-1">
                                            <Icon name="schedule" size={18} />
                                            {activeLesson.duration} mnt
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Mark as Complete Button */}
                            {activeLesson && (
                                <button
                                    onClick={handleComplete}
                                    disabled={completeLesson.isPending || isCurrentCompleted}
                                    className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                                        isCurrentCompleted
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow-lg hover:shadow-primary/20'
                                    }`}
                                >
                                    <Icon name={isCurrentCompleted ? "check_circle" : "check_circle_outline"} size={20} />
                                    {completeLesson.isPending ? 'Menyimpan...' : isCurrentCompleted ? 'Selesai' : 'Tandai Selesai'}
                                </button>
                            )}
                        </div>

                        {/* Lesson Content Text */}
                        {activeLesson?.content ? (
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                {activeLesson.content.split('\n').map((paragraph, i) => (
                                    <p key={i}>{paragraph}</p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-500 italic">Tidak ada deskripsi tambahan.</p>
                        )}
                    </div>
                </div>

                {/* Right/Bottom Sidebar: Syllabus */}
                <div 
                    className={`
                        absolute lg:static top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 
                        transition-transform duration-300 shadow-2xl lg:shadow-none
                        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                        ${!sidebarOpen ? 'lg:hidden' : 'lg:flex'}
                    `}
                >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <h3 className="font-bold text-slate-900 dark:text-white">Daftar Materi</h3>
                        <div className="text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded">
                            {completedIds.length} / {totalLessons}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {curriculum.map((section, sIdx) => (
                            <div key={section.id} className="border-b border-slate-100 dark:border-slate-800/50">
                                {/* Section Header */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20">
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                        Bab {sIdx + 1}: {section.title}
                                    </h4>
                                </div>
                                
                                {/* Lessons List */}
                                <div className="flex flex-col">
                                    {section.lessons.map((lesson, lIdx) => {
                                        const isCompleted = completedIds.includes(lesson.id)
                                        const isActive = activeLesson?.id === lesson.id
                                        
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    setActiveLesson(lesson)
                                                    if (window.innerWidth < 1024) setSidebarOpen(false)
                                                }}
                                                className={`
                                                    text-left p-4 flex gap-3 transition-colors group
                                                    ${isActive 
                                                        ? 'bg-primary/5 border-l-4 border-primary' 
                                                        : 'border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }
                                                `}
                                            >
                                                <div className={`mt-0.5 shrink-0 ${isCompleted ? 'text-emerald-500' : isActive ? 'text-primary' : 'text-slate-300 dark:text-slate-600'}`}>
                                                    <Icon name={isCompleted ? "check_circle" : lesson.type === 'video' ? 'play_circle' : lesson.type === 'audio' ? 'headphones' : 'article'} size={20} />
                                                </div>
                                                <div>
                                                    <p className={`text-sm mb-1 ${isActive ? 'font-bold text-primary dark:text-primary-light' : isCompleted ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                                        {lIdx + 1}. {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                                                        <span>{lesson.type === 'video' ? 'Video' : lesson.type === 'audio' ? 'Audio' : 'Teks'}</span>
                                                        {lesson.duration && (
                                                            <>
                                                                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                                                <span>{lesson.duration} mnt</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-0 lg:hidden backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}
            </div>
        </div>
    )
}

export default CoursePlayerPage
