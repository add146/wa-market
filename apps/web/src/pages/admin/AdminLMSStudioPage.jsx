import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Icon, Modal } from '../../components/atoms'
import AdminHeader from '../../components/organisms/AdminHeader'
import {
    useCourseCurriculum,
    useCreateSection,
    useUpdateSection,
    useDeleteSection,
    useCreateLesson,
    useUpdateLesson,
    useDeleteLesson,
    useReorderSections,
    useReorderLessons
} from '../../hooks/useCourses'
import { useProduct } from '../../hooks'
import LoadingState from '../../components/atoms/LoadingState'
import { useToast } from '../../context'

function AdminLMSStudioPage() {
    const { id: productId } = useParams()
    const navigate = useNavigate()
    const toast = useToast()

    // Data
    const { data: product, isLoading: isProductLoading } = useProduct(productId)
    const { data: curriculumRes, isLoading: isCurriculumLoading } = useCourseCurriculum(productId)
    const curriculum = curriculumRes?.curriculum || []

    // Mutations
    const createSection = useCreateSection()
    const updateSection = useUpdateSection()
    const deleteSection = useDeleteSection()
    const createLesson = useCreateLesson()
    const updateLesson = useUpdateLesson()
    const deleteLesson = useDeleteLesson()
    const reorderSections = useReorderSections()
    const reorderLessons = useReorderLessons()

    // Modals state
    const [showSectionModal, setShowSectionModal] = useState(false)
    const [editingSection, setEditingSection] = useState(null)
    const [sectionTitle, setSectionTitle] = useState('')

    const [showLessonModal, setShowLessonModal] = useState(false)
    const [editingLesson, setEditingLesson] = useState(null)
    const [activeSectionId, setActiveSectionId] = useState(null)
    
    const [lessonForm, setLessonForm] = useState({
        title: '',
        type: 'video',
        videoUrl: '',
        audioUrl: '',
        content: '',
        duration: '',
        isVisible: true,
        isFreePreview: false
    })

    const handleSaveSection = async (e) => {
        e.preventDefault()
        try {
            if (editingSection) {
                await updateSection.mutateAsync({
                    sectionId: editingSection.id,
                    data: { title: sectionTitle },
                    productId
                })
                toast.success('Bab berhasil diupdate')
            } else {
                await createSection.mutateAsync({
                    productId,
                    data: { title: sectionTitle }
                })
                toast.success('Bab berhasil ditambahkan')
            }
            setShowSectionModal(false)
        } catch (err) {
            toast.error('Gagal menyimpan bab')
        }
    }

    const handleDeleteSection = async (section) => {
        if (!window.confirm(`Yakin ingin menghapus bab "${section.title}" beserta isinya?`)) return
        try {
            await deleteSection.mutateAsync({ sectionId: section.id, productId })
            toast.success('Bab berhasil dihapus')
        } catch (err) {
            toast.error('Gagal menghapus bab')
        }
    }

    const handleSaveLesson = async (e) => {
        e.preventDefault()
        try {
            if (editingLesson) {
                await updateLesson.mutateAsync({
                    lessonId: editingLesson.id,
                    data: lessonForm,
                    productId
                })
                toast.success('Materi berhasil diupdate')
            } else {
                await createLesson.mutateAsync({
                    sectionId: activeSectionId,
                    data: lessonForm,
                    productId
                })
                toast.success('Materi berhasil ditambahkan')
            }
            setShowLessonModal(false)
        } catch (err) {
            toast.error('Gagal menyimpan materi')
        }
    }

    const handleDeleteLesson = async (lesson) => {
        if (!window.confirm(`Yakin ingin menghapus materi "${lesson.title}"?`)) return
        try {
            await deleteLesson.mutateAsync({ lessonId: lesson.id, productId })
            toast.success('Materi berhasil dihapus')
        } catch (err) {
            // Wait, we also need to pass productId for invalidation if the hook expects it
            toast.error('Gagal menghapus materi')
        }
    }

    if (isProductLoading || isCurriculumLoading) return <LoadingState />

    return (
        <>
            <AdminHeader
                title={`Materi: ${product?.name || 'Kursus'}`}
                subtitle="Atur silabus dan konten video/audio"
            />
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-4xl mx-auto space-y-6">
                    <button
                        onClick={() => navigate('/admin/products')}
                        className="flex items-center gap-2 text-primary hover:text-primary-dark font-medium mb-6"
                    >
                        <Icon name="arrow_back" size={20} />
                        Kembali ke Produk
                    </button>

                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold dark:text-white">Silabus / Kurikulum</h2>
                        <button
                            onClick={() => {
                                setEditingSection(null)
                                setSectionTitle('')
                                setShowSectionModal(true)
                            }}
                            className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark flex items-center gap-2"
                        >
                            <Icon name="add" size={20} />
                            Tambah Bab Baru
                        </button>
                    </div>

                    {curriculum.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <Icon name="library_books" size={48} className="mx-auto mb-3 text-slate-400" />
                            <p className="text-slate-500 mb-4">Belum ada bab/materi di kursus ini.</p>
                            <button
                                onClick={() => {
                                    setEditingSection(null)
                                    setSectionTitle('')
                                    setShowSectionModal(true)
                                }}
                                className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-dark inline-flex items-center gap-2"
                            >
                                <Icon name="add" size={20} />
                                Tambah Bab Pertama
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {curriculum.map((section, sIdx) => (
                                <div key={section.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <Icon name="drag_indicator" size={20} className="text-slate-400 cursor-grab" />
                                            <h3 className="font-bold text-slate-900 dark:text-white">Bab {sIdx + 1}: {section.title}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    setEditingSection(section)
                                                    setSectionTitle(section.title)
                                                    setShowSectionModal(true)
                                                }}
                                                className="p-1 text-slate-500 hover:text-primary transition-colors"
                                                title="Edit Bab"
                                            >
                                                <Icon name="edit" size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSection(section)}
                                                className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                                            >
                                                <Icon name="delete" size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-2 space-y-2">
                                        {section.lessons?.length > 0 ? (
                                            section.lessons.map((lesson, lIdx) => (
                                                <div key={lesson.id} className="group flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg hover:border-primary/30 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Icon name="drag_indicator" size={18} className="text-slate-300 cursor-grab invisible group-hover:visible" />
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${lesson.type === 'video' ? 'bg-blue-100 text-blue-600' : lesson.type === 'audio' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                                            <Icon name={lesson.type === 'video' ? 'play_arrow' : lesson.type === 'audio' ? 'headphones' : 'menu_book'} size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                                                    {sIdx + 1}.{lIdx + 1} {lesson.title}
                                                                </span>
                                                                {!lesson.isVisible && (
                                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Draft</span>
                                                                )}
                                                                {lesson.isFreePreview && (
                                                                    <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Free Preview</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                                                <span>{lesson.duration || '-'} mnt</span>
                                                                {lesson.type === 'video' && <span>• {new URL(lesson.videoUrl || 'http://youtube.com').hostname || 'Video'}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingLesson(lesson)
                                                                setActiveSectionId(section.id)
                                                                setLessonForm({
                                                                    title: lesson.title,
                                                                    type: lesson.type || 'video',
                                                                    videoUrl: lesson.videoUrl || '',
                                                                    audioUrl: lesson.audioUrl || '',
                                                                    content: lesson.content || '',
                                                                    duration: lesson.duration?.toString() || '',
                                                                    isVisible: lesson.isVisible,
                                                                    isFreePreview: lesson.isFreePreview
                                                                })
                                                                setShowLessonModal(true)
                                                            }}
                                                            className="p-1.5 text-slate-500 bg-slate-100 rounded hover:text-primary dark:bg-slate-700"
                                                        >
                                                            <Icon name="edit" size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteLesson(lesson)}
                                                            className="p-1.5 text-slate-500 bg-slate-100 rounded hover:text-red-500 dark:bg-slate-700"
                                                        >
                                                            <Icon name="delete" size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-sm text-slate-400 italic">
                                                Belum ada materi di bab ini
                                            </div>
                                        )}
                                        
                                        <button 
                                            onClick={() => {
                                                setEditingLesson(null)
                                                setActiveSectionId(section.id)
                                                setLessonForm({
                                                    title: '',
                                                    type: 'video',
                                                    videoUrl: '',
                                                    audioUrl: '',
                                                    content: '',
                                                    duration: '',
                                                    isVisible: true,
                                                    isFreePreview: false
                                                })
                                                setShowLessonModal(true)
                                            }}
                                            className="w-full py-2 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg border border-transparent hover:border-primary/20 transition-all border-dashed mt-2"
                                        >
                                            <Icon name="add" size={18} /> Tambah Materi
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Bab */}
            <Modal isOpen={showSectionModal} onClose={() => setShowSectionModal(false)} title={editingSection ? "Edit Bab" : "Tambah Bab"}>
                <form onSubmit={handleSaveSection} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul Bab</label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Pengenalan Dasar"
                            value={sectionTitle}
                            onChange={(e) => setSectionTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <button type="button" onClick={() => setShowSectionModal(false)} className="px-4 py-2 font-medium text-slate-500">Batal</button>
                        <button type="submit" disabled={createSection.isPending || updateSection.isPending} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark">Simpan</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Materi */}
            <Modal isOpen={showLessonModal} onClose={() => setShowLessonModal(false)} title={editingLesson ? "Edit Materi" : "Tambah Materi"}>
                <form onSubmit={handleSaveLesson} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul Materi</label>
                        <input
                            type="text"
                            required
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({...lessonForm, title: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipe</label>
                            <select
                                value={lessonForm.type}
                                onChange={(e) => setLessonForm({...lessonForm, type: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="video">Video (YouTube/Vimeo/URL)</option>
                                <option value="audio">Audio</option>
                                <option value="text">Teks / Artikel</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Durasi (Menit)</label>
                            <input
                                type="number"
                                value={lessonForm.duration}
                                onChange={(e) => setLessonForm({...lessonForm, duration: e.target.value})}
                                placeholder="Opsional"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {lessonForm.type === 'video' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Video</label>
                            <input
                                type="url"
                                required
                                placeholder="Contoh: https://youtube.com/watch?v=..."
                                value={lessonForm.videoUrl}
                                onChange={(e) => setLessonForm({...lessonForm, videoUrl: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    )}
                    
                    {lessonForm.type === 'audio' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL Audio</label>
                            <input
                                type="url"
                                required
                                placeholder="Link audio (mp3)"
                                value={lessonForm.audioUrl}
                                onChange={(e) => setLessonForm({...lessonForm, audioUrl: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deskripsi / Konten Tambahan</label>
                        <textarea
                            rows={3}
                            placeholder="Catatan atau teks..."
                            value={lessonForm.content}
                            onChange={(e) => setLessonForm({...lessonForm, content: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="flex gap-6 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={lessonForm.isVisible}
                                onChange={(e) => setLessonForm({...lessonForm, isVisible: e.target.checked})}
                                className="w-4 h-4 text-primary rounded border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Publish (Bisa diakses)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={lessonForm.isFreePreview}
                                onChange={(e) => setLessonForm({...lessonForm, isFreePreview: e.target.checked})}
                                className="w-4 h-4 text-primary rounded border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Free Preview (Gratis Tonton)</span>
                        </label>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button type="button" onClick={() => setShowLessonModal(false)} className="px-4 py-2 font-medium text-slate-500">Batal</button>
                        <button type="submit" disabled={createLesson.isPending || updateLesson.isPending} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark">Simpan</button>
                    </div>
                </form>
            </Modal>
        </>
    )
}

export default AdminLMSStudioPage
