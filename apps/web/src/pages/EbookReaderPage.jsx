import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Document, Page, Outline, pdfjs } from 'react-pdf'
import { ReactReader } from 'react-reader'
import { Icon } from '../components/atoms'
import LoadingState from '../components/atoms/LoadingState'
import { useEbookAccess, useUpdateEbookProgress, useBookmarks, useAddBookmark, useDeleteBookmark } from '../hooks/useEbooks'
import { ebooksApi } from '../api/client'
import { useAuth } from '../context'

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function EbookReaderPage() {
    const { id: productId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    
    const [numPages, setNumPages] = useState(null)
    const [pageNumber, setPageNumber] = useState(1)
    const [location, setLocation] = useState(null) // EPUB location (CFI)
    const [scale, setScale] = useState(1.0)
    const [fontSize, setFontSize] = useState(100) // Percentage for EPUB
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [pageInput, setPageInput] = useState('1')
    
    // Navigation Drawer State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('chapters') // 'chapters' | 'bookmarks'
    const [bookmarkTitle, setBookmarkTitle] = useState('')

    const containerRef = useRef(null)

    const { data: accessData, isLoading: isAccessLoading, isError: isAccessError } = useEbookAccess(productId)
    const updateProgress = useUpdateEbookProgress()
    
    // Bookmarks hooks
    const { data: bookmarksData, isLoading: isBookmarksLoading } = useBookmarks(productId)
    const addBookmarkMutation = useAddBookmark()
    const deleteBookmarkMutation = useDeleteBookmark()

    // Detect if is EPUB based on accessData or filename
    const isEpub = accessData?.purchase?.lastCfi !== undefined || accessData?.purchase?.productImage?.toLowerCase()?.includes('.epub');
    // Actually better to have dynamic check or reliable field. 
    // Let's assume pdfUrl presence and extension check if possible or checking if lastCfi is set.
    
    // Resume reading from last page/cfi
    useEffect(() => {
        if (accessData?.purchase) {
            if (accessData.purchase.lastCfi) {
                setLocation(accessData.purchase.lastCfi)
            }
            if (accessData.purchase.lastPage) {
                setPageNumber(accessData.purchase.lastPage)
                setPageInput(accessData.purchase.lastPage.toString())
            }
        }
    }, [accessData])

    // Update progress when page/location changes (debounce)
    useEffect(() => {
        let timeoutId;
        if (accessData?.purchase) {
            timeoutId = setTimeout(() => {
                updateProgress.mutate({
                    productId,
                    page: pageNumber,
                    lastCfi: location,
                    totalPages: numPages
                })
            }, 5000)
        }
        return () => clearTimeout(timeoutId)
    }, [pageNumber, location, numPages, productId])

    const onLocationChange = (loc) => {
        setLocation(loc)
    }

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages)
    }

    const changePage = (offset) => {
        setPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            const validPage = Math.min(Math.max(newPage, 1), numPages || 1);
            setPageInput(validPage.toString())
            return validPage
        });
    }

    const previousPage = () => changePage(-1);
    const nextPage = () => changePage(1);
    
    const handlePageSubmit = (e) => {
        e.preventDefault()
        const targetPage = parseInt(pageInput, 10)
        if (!isNaN(targetPage)) {
            const validPage = Math.min(Math.max(targetPage, 1), numPages || 1)
            setPageNumber(validPage)
            setPageInput(validPage.toString())
        } else {
            setPageInput(pageNumber.toString())
        }
    }

    const handleAddBookmark = (e) => {
        e.preventDefault()
        if (!bookmarkTitle.trim()) return
        addBookmarkMutation.mutate({
            productId,
            data: { 
                page: pageNumber, 
                cfi: location,
                title: bookmarkTitle 
            }
        })
        setBookmarkTitle('')
    }

    const onOutlineClick = ({ pageNumber }) => {
        if (pageNumber) {
            setPageNumber(pageNumber)
            setPageInput(pageNumber.toString())
            // Option to close drawer on mobile when chapter selected
            if (window.innerWidth < 768) setIsDrawerOpen(false)
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    if (isAccessLoading) return <LoadingState />
    if (isAccessError || !accessData?.hasAccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200 dark:border-slate-700">
                    <Icon name="block" size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Akses Ditolak</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Anda tidak memiliki akses ke e-book ini atau sesi telah berakhir.</p>
                    <button onClick={() => navigate('/my-library')} className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-bold">
                        Kembali ke Pustaka
                    </button>
                </div>
            </div>
        )
    }

    const token = localStorage.getItem('auth_token')
    const pdfUrl = ebooksApi.getReadUrl(productId, token)

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-900" ref={containerRef}>
            {/* Header/Toolbar */}
            <div className={`bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-3 px-4 flex items-center justify-between shadow-sm z-10 ${isFullscreen ? 'fixed top-0 left-0 right-0 opacity-0 hover:opacity-100 transition-opacity' : ''}`}>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)} 
                        className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Daftar Isi & Penanda"
                    >
                        <Icon name="menu" size={24} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                    <button onClick={() => navigate('/my-library')} className="p-2 -ml-2 text-slate-500 hover:text-primary rounded-lg transition-colors hidden sm:block">
                        <Icon name="arrow_back" size={24} />
                    </button>
                    <div className="hidden md:block">
                        <h1 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{accessData?.purchase?.productName || 'Membaca E-book'}</h1>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {productId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-center max-w-md mx-auto">
                    <button onClick={previousPage} disabled={pageNumber <= 1} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200">
                        <Icon name="chevron_left" size={20} />
                    </button>
                    
                    <form onSubmit={handlePageSubmit} className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                        <input 
                            type="number"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onBlur={handlePageSubmit}
                            className="w-12 text-center bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 px-1 outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none hide-spin-button"
                        />
                        <span className="mx-2">/</span>
                        <span>{numPages || '--'}</span>
                    </form>
                    
                    <button onClick={nextPage} disabled={pageNumber >= numPages} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200">
                        <Icon name="chevron_right" size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="hidden sm:flex items-center gap-1 mr-2 px-2 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700" title="Ubah Ukuran Font (Zoom)">
                        <button 
                            onClick={() => isEpub ? setFontSize(s => Math.max(s - 10, 50)) : setScale(s => Math.max(s - 0.2, 0.5))} 
                            className="p-1 px-2 text-slate-500 hover:text-primary font-serif font-bold text-sm"
                        >
                            A-
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono w-8 text-center">{isEpub ? fontSize : Math.round(scale * 100)}%</span>
                        <button 
                            onClick={() => isEpub ? setFontSize(s => Math.min(s + 10, 200)) : setScale(s => Math.min(s + 0.2, 3.0))} 
                            className="p-1 px-2 text-slate-500 hover:text-primary font-serif font-bold text-lg leading-none"
                        >
                            A+
                        </button>
                    </div>
                    <button onClick={toggleFullscreen} className="p-2 text-slate-500 hover:text-primary rounded-lg hidden sm:block">
                        <Icon name={isFullscreen ? "fullscreen_exit" : "fullscreen"} size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex pb-0 flex-1 overflow-hidden relative">
                
                {/* Navigation Drawer */}
                <div className={`
                    absolute sm:relative z-20 left-0 top-0 bottom-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
                    w-72 sm:w-80 flex flex-col transition-all duration-300 transform shadow-md sm:shadow-none
                    ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full hidden sm:flex sm:hidden'} 
                `}>
                    {/* Drawer Header & Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                        <button 
                            className={`flex-1 py-3 text-sm font-bold ${activeTab === 'chapters' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            onClick={() => setActiveTab('chapters')}
                        >
                            Daftar Isi
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-bold ${activeTab === 'bookmarks' ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            onClick={() => setActiveTab('bookmarks')}
                        >
                            Penanda Halaman
                        </button>
                        {/* Mobile close button inside drawer */}
                        <button 
                            className="p-3 text-slate-500 hover:text-red-500 sm:hidden"
                            onClick={() => setIsDrawerOpen(false)}
                        >
                            <Icon name="close" size={20} />
                        </button>
                    </div>

                    {/* Drawer Content */}
                    <div className="flex-1 overflow-y-auto no-scrollbar p-0">
                        {activeTab === 'chapters' && (
                            <div className="p-4 text-sm text-slate-700 dark:text-slate-300">
                            </div>
                        )}

                        {activeTab === 'bookmarks' && (
                            <div className="p-4 flex flex-col h-full">
                                {/* Form Add Bookmark */}
                                <form onSubmit={handleAddBookmark} className="mb-6">
                                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Tandai Halaman Ini ({pageNumber})</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            placeholder="Nama penanda..." 
                                            value={bookmarkTitle}
                                            onChange={(e) => setBookmarkTitle(e.target.value)}
                                            maxLength={50}
                                            className="flex-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-primary text-slate-900 dark:text-white"
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={addBookmarkMutation.isPending || !bookmarkTitle.trim()}
                                            className="bg-primary hover:bg-primary-dark text-white rounded-lg px-3 flex items-center justify-center disabled:opacity-50"
                                            title="Simpan Bookmark"
                                        >
                                            <Icon name="add" size={20} />
                                        </button>
                                    </div>
                                </form>

                                {/* List Bookmarks */}
                                <div className="flex-1 flex flex-col gap-3">
                                    {isBookmarksLoading ? (
                                        <div className="flex justify-center p-4"><LoadingState /></div>
                                    ) : (bookmarksData?.bookmarks || []).length === 0 ? (
                                        <div className="text-center py-8 text-slate-400 text-sm">
                                            <Icon name="bookmark_border" size={32} className="mx-auto mb-2 opacity-50" />
                                            Belum ada penanda halaman.
                                        </div>
                                    ) : (
                                        (bookmarksData?.bookmarks || []).map(bm => (
                                            <div key={bm.id} className="group relative flex gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 hover:border-primary cursor-pointer transition-colors" onClick={() => {
                                                setPageNumber(bm.page);
                                                setPageInput(bm.page.toString());
                                                if (window.innerWidth < 768) setIsDrawerOpen(false);
                                            }}>
                                                <div className="w-[60px] h-[80px] bg-white border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                                    <span className="text-primary font-bold text-lg font-serif">{bm.page}</span>
                                                </div>
                                                <div className="flex-1 py-1 pr-8">
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2 leading-tight mb-1">{bm.title}</h4>
                                                    <p className="text-[10px] text-slate-500">Hal. {bm.page}</p>
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); deleteBookmarkMutation.mutate({ id: bm.id, productId }); }}
                                                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Icon name="delete" size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reader Area */}
                <div 
                    className={`flex-1 overflow-auto bg-[#e5e7eb] dark:bg-slate-950 flex justify-center py-6 no-scrollbar relative ${isDrawerOpen ? 'hidden sm:flex' : 'flex'} ${isFullscreen ? 'pt-0' : ''}`}
                    onClick={() => { if(window.innerWidth < 768 && isDrawerOpen) setIsDrawerOpen(false) }}
                >
                    <div className="relative inline-block mx-auto min-h-full w-full max-w-4xl px-4 sm:px-0">
                        {isEpub ? (
                            <div className="h-full w-full bg-white dark:bg-slate-900 shadow-xl rounded-lg overflow-hidden flex flex-col">
                                <ReactReader
                                    url={pdfUrl}
                                    location={location}
                                    locationChanged={onLocationChange}
                                    epubOptions={{
                                        flow: 'scrolled',
                                        manager: 'continuous'
                                    }}
                                    epubInitOptions={{
                                        openAs: 'epub'
                                    }}
                                    styles={{
                                        container: {
                                          overflow: 'hidden',
                                          height: '100%',
                                        },
                                        reader: {
                                          height: '100%',
                                        }
                                    }}
                                    theme={isFullscreen ? 'dark' : 'light'}
                                    fontSize={`${fontSize}%`}
                                />
                            </div>
                        ) : (
                            <div className="relative inline-block mx-auto">
                                <Document
                                    file={pdfUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    loading={<div className="flex items-center justify-center p-12"><LoadingState /></div>}
                                    error={<div className="p-8 text-center text-red-500 bg-white rounded-lg shadow">Gagal memuat dokumen PDF. Pastikan internet Anda stabil.</div>}
                                    className="shadow-xl"
                                >
                                    <Page 
                                        pageNumber={pageNumber} 
                                        scale={scale} 
                                        renderTextLayer={true} 
                                        renderAnnotationLayer={true}
                                        className="bg-white"
                                    />
                                </Document>
                                {/* Watermark Overlay */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-10 overflow-hidden mix-blend-multiply dark:mix-blend-screen select-none">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="transform -rotate-45 my-20 text-center w-full">
                                            <p className="text-2xl font-black text-slate-500 tracking-widest uppercase">LICENSED TO {user?.name}</p>
                                            <p className="text-sm font-bold text-slate-500">{user?.email}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Mobile zoom controls */}
            <div className="sm:hidden absolute bottom-4 right-4 flex flex-col gap-2 z-20">
                <button 
                    onClick={() => isEpub ? setFontSize(s => Math.min(s + 10, 200)) : setScale(s => Math.min(s + 0.2, 3.0))} 
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-serif font-bold text-lg leading-none" 
                    title="Perbesar font"
                >
                    A+
                </button>
                <button 
                    onClick={() => isEpub ? setFontSize(s => Math.max(s - 10, 50)) : setScale(s => Math.max(s - 0.2, 0.5))} 
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-serif font-bold text-sm" 
                    title="Perkecil font"
                >
                    A-
                </button>
            </div>
        </div>
    )
}

export default EbookReaderPage
