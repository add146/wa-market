import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Icon } from '../components/atoms'
import MobileNav from '../components/organisms/MobileNav'
import LoadingState from '../components/atoms/LoadingState'
import { useMyLibrary } from '../hooks/useEbooks'
import { useMyCourses } from '../hooks/useCourses'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

function MyLibraryPage() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('ebooks')

    const getImageUrl = (image) => {
        if (image?.startsWith('/uploads')) {
            return `${API_BASE}${image}`
        }
        return image || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
    }

    const { data: ebooksData, isLoading: isEbookLoading } = useMyLibrary()
    const { data: coursesData, isLoading: isCourseLoading } = useMyCourses()

    const ebooks = ebooksData?.library || []
    const courses = coursesData?.courses || []

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-color dark:border-surface-dark px-4 sm:px-8 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-text-main-light dark:text-white hover:text-primary transition-colors">
                        <Icon name="arrow_back" size={24} />
                        <span className="font-medium">Kembali</span>
                    </Link>
                    <h1 className="text-xl font-bold text-text-main-light dark:text-white">
                        Pustaka Saya
                    </h1>
                    <div className="w-20" />
                </div>
            </header>

            <main className="pt-4 pb-24">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setActiveTab('ebooks')}
                            className={`flex items-center gap-2 py-3 px-6 font-medium text-sm whitespace-nowrap transition-colors ${
                                activeTab === 'ebooks'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            <Icon name="library_books" size={18} />
                            E-book ({ebooks.filter(e => e.digitalType === 'ebook').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`flex items-center gap-2 py-3 px-6 font-medium text-sm whitespace-nowrap transition-colors ${
                                activeTab === 'courses'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            <Icon name="play_lesson" size={18} />
                            Kelas ({courses.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`flex items-center gap-2 py-3 px-6 font-medium text-sm whitespace-nowrap transition-colors ${
                                activeTab === 'files'
                                    ? 'border-b-2 border-primary text-primary'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                        >
                            <Icon name="download" size={18} />
                            File ({ebooks.filter(e => e.digitalType === 'link').length})
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === 'ebooks' && (
                        <div>
                            {isEbookLoading ? (
                                <div className="py-12"><LoadingState /></div>
                            ) : ebooks.filter(e => e.digitalType === 'ebook').length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Icon name="menu_book" size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Belum ada E-book</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Anda belum memiliki e-book interaktif.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {ebooks.filter(e => e.digitalType === 'ebook').map((ebook) => {
                                        const progress = ebook.totalPages ? Math.round((ebook.lastPage / ebook.totalPages) * 100) : 0;
                                        return (
                                            <Link key={ebook.id} to={`/ebooks/${ebook.productId}`} className="group flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer">
                                                <div className="aspect-[3/4] relative bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                                                    <img src={getImageUrl(ebook.productImage)} alt={ebook.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    {progress > 0 && progress < 100 && (
                                                        <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                                            <Icon name="schedule" size={12} /> {progress}%
                                                        </div>
                                                    )}
                                                    {progress === 100 && (
                                                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">
                                                            <Icon name="check_circle" size={12} /> Selesai
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-sm mb-2 flex-1 group-hover:text-primary transition-colors">{ebook.productName}</h3>
                                                    {ebook.lastReadAt ? (
                                                        <p className="text-xs text-slate-500 mb-3">Terakhir dibaca: {new Date(ebook.lastReadAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                                    ) : (
                                                        <p className="text-xs text-slate-500 mb-3">Belum mulai dibaca</p>
                                                    )}
                                                    
                                                    {/* Progress Bar */}
                                                    {ebook.totalPages > 0 && (
                                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mb-3 overflow-hidden">
                                                            <div className={`h-full ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
                                                        </div>
                                                    )}
                                                    
                                                    <button className="w-full py-2 bg-slate-50 text-primary dark:bg-slate-900/50 dark:text-primary-light text-sm font-semibold rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                                        Baca Sekarang
                                                    </button>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <div>
                            {isEbookLoading ? (
                                <div className="py-12"><LoadingState /></div>
                            ) : ebooks.filter(e => e.digitalType === 'link').length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Icon name="folder_open" size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Belum ada File Digital</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Anda belum memiliki produk digital berupa link download atau akses file eksternal.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {ebooks.filter(e => e.digitalType === 'link').map((file) => {
                                        const urls = file.digitalContent?.match(/(https?:\/\/[^\s]+)/g);
                                        const firstUrl = urls ? urls[0] : null;

                                        return (
                                            <div key={file.id} className="group flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all p-4 gap-4">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-20 overflow-hidden rounded-lg shrink-0 border border-slate-100 dark:border-slate-700">
                                                        <img src={getImageUrl(file.productImage)} alt={file.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-sm mb-1 group-hover:text-primary transition-colors">{file.productName}</h3>
                                                        <p className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded inline-block">File Digital (Eksternal)</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 flex-1">
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                        <Icon name="info" size={14} /> Instruksi / Keterangan Akses
                                                    </p>
                                                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                                                        {file.digitalContent || <span className="text-slate-400 italic">Tidak ada keterangan tambahan.</span>}
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-1">
                                                    {firstUrl ? (
                                                        <a 
                                                            href={firstUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors text-sm font-bold rounded-lg border border-transparent hover:border-primary/20"
                                                        >
                                                            <Icon name="open_in_new" size={16} /> Buka Akses / Download
                                                        </a>
                                                    ) : (
                                                        file.digitalContent && file.digitalContent.trim() !== '' ? (
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(file.digitalContent);
                                                                    alert('Keterangan berhasil disalin!');
                                                                }}
                                                                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer text-sm font-bold rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                                                            >
                                                                <Icon name="content_copy" size={16} /> Salin Teks
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed text-sm font-bold rounded-lg border border-slate-100 dark:border-slate-700"
                                                                disabled
                                                            >
                                                                <Icon name="link_off" size={16} /> Belum Ada Akses
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div>
                            {isCourseLoading ? (
                                <div className="py-12"><LoadingState /></div>
                            ) : courses.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Icon name="school" size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Belum ada Kelas Online</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto mb-6">Tingkatkan skill Anda dengan mengikuti berbagai kelas online dari para ahli di bidangnya.</p>
                                    <button onClick={() => navigate('/')} className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium inline-flex items-center gap-2">
                                        <Icon name="search" size={18} /> Cari Kelas
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {courses.map((course) => (
                                        <Link key={course.id} to={`/classes/${course.productId}`} className="group flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer">
                                            <div className="aspect-[16/9] relative bg-slate-100 dark:bg-slate-900">
                                                <img src={getImageUrl(course.productImage)} alt={course.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-auto mt-[10%] mx-auto opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                        <Icon name="play_arrow" size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 text-base mb-3 group-hover:text-primary transition-colors">{course.productName}</h3>
                                                
                                                <div className="mt-auto">
                                                    <div className="flex justify-between items-center text-xs mb-1.5">
                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Progres Belajar</span>
                                                        <span className="font-bold text-primary">{course.progressPercentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mb-4 overflow-hidden">
                                                        <div className={`h-full ${course.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${course.progressPercentage}%` }} />
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-3">
                                                        <div className="flex items-center gap-1.5"><Icon name="task_alt" size={14} className="text-emerald-500" /> {course.progressCompleted} / {course.progressTotal} Materi</div>
                                                        <div className="flex items-center gap-1.5"><Icon name="calendar_today" size={14} /> {new Date(course.enrolledAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <MobileNav />
        </div>
    )
}

export default MyLibraryPage
