import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useDropzone } from "react-dropzone";
import {
    XIcon, UploadIcon, GlobeIcon, FileTextIcon,
    MapIcon, UserIcon, ListIcon, HelpCircleIcon,
    ImageIcon, PlusIcon, TrashIcon, SaveIcon, SendIcon,
    CalendarIcon
} from "lucide-react";
import Image from "next/image";
import SimpleRichTextEditor from "@/components/form/SimpleRichTextEditor";

interface WebContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tour: any; // TourBus | TourAereo
    type: 'BUS' | 'AEREO';
    onSuccess: () => void;
}

type TabType = 'general' | 'details' | 'content' | 'media' | 'lists' | 'coordinator' | 'faq';

interface ItineraryItem {
    title: string;
    description: string;
}

export default function WebContentModal({ isOpen, onClose, tour, type, onSuccess }: WebContentModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        titulo: "",
        fechaViaje: "",
        fechaFin: "",
        precioAdulto: "",
        precioNino: "",
        slug: "",
        isPublic: false,
        subtitulo: "",
        etiquetas: [] as string[],
        duracionTexto: "",
        requisitosDocumentacion: [] as string[],
        infoGeneral: "",
        itinerario: [] as ItineraryItem[], // Structured Itinerary
        mapaEmbed: "",
        galeria: [] as string[],
        galeria2: [] as string[], // New Gallery 2
        incluye: [] as string[],
        noIncluye: [] as string[],
        coordinadorNombre: "",
        coordinadorDescripcion: "",
        faq: [] as { question: string; answer: string }[],
        // 2026-01-14 New Fields
        flightRefTitle: "",
        flightRefLink: "",
        optionCameraSingola: false,
        optionFlexibleCancel: false,
        priceFlexibleCancel: "",
        optionCameraPrivata: false,
        priceCameraPrivata: "",
        travelStatus: "SOGNANDO",
    });

    // File States
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [webCoverImageFile, setWebCoverImageFile] = useState<File | null>(null);
    const [webCoverImagePreview, setWebCoverImagePreview] = useState<string | null>(null);
    const [coordinadorFotoFile, setCoordinadorFotoFile] = useState<File | null>(null);
    const [coordinadorFotoPreview, setCoordinadorFotoPreview] = useState<string | null>(null);

    // Gallery 1 State
    const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
    const [newGalleryPreviews, setNewGalleryPreviews] = useState<{ url: string, type: 'image' | 'video' }[]>([]);

    // Gallery 2 State
    const [newGallery2Files, setNewGallery2Files] = useState<File[]>([]);
    const [newGallery2Previews, setNewGallery2Previews] = useState<{ url: string, type: 'image' | 'video' }[]>([]);

    // Helpers for Lists
    const [newTag, setNewTag] = useState("");
    const [newIncluye, setNewIncluye] = useState("");
    const [newNoIncluye, setNewNoIncluye] = useState("");
    const [newRequisito, setNewRequisito] = useState("");

    // Initialize Data
    useEffect(() => {
        if (tour && isOpen) {

            // Parse existing itinerary if string or already object
            let parsedItinerary: ItineraryItem[] = [];
            if (Array.isArray(tour.itinerario)) {
                parsedItinerary = tour.itinerario;
            } else if (typeof tour.itinerario === 'string') {
                // Try parsing just in case, or legacy content
                try {
                    const parsed = JSON.parse(tour.itinerario);
                    if (Array.isArray(parsed)) parsedItinerary = parsed;
                } catch (e) {
                    console.error('Legacy JSON parse:', e);
                    // If regular string, maybe put it as description of day 1?
                    // Or just leave empty to prompt migration
                }
            }

            setFormData({
                titulo: tour.titulo || "",
                fechaViaje: tour.fechaViaje ? new Date(tour.fechaViaje).toISOString().split('T')[0] : "",
                fechaFin: tour.fechaFin ? new Date(tour.fechaFin).toISOString().split('T')[0] : "",
                precioAdulto: tour.precioAdulto?.toString() || "0",
                precioNino: tour.precioNino?.toString() || "0",
                slug: tour.slug || "",
                isPublic: tour.isPublic || false,
                subtitulo: tour.subtitulo || "",
                etiquetas: Array.isArray(tour.etiquetas) ? tour.etiquetas : [],
                duracionTexto: tour.duracionTexto || "",
                requisitosDocumentacion: Array.isArray(tour.requisitosDocumentacion) ? tour.requisitosDocumentacion : [],
                infoGeneral: tour.infoGeneral || "",
                itinerario: parsedItinerary,
                mapaEmbed: tour.mapaEmbed || "",
                galeria: Array.isArray(tour.galeria) ? tour.galeria : [],
                incluye: Array.isArray(tour.incluye) ? tour.incluye : [],
                noIncluye: Array.isArray(tour.noIncluye) ? tour.noIncluye : [],
                coordinadorNombre: tour.coordinadorNombre || "",
                coordinadorDescripcion: tour.coordinadorDescripcion || "",
                faq: Array.isArray(tour.faq) ? tour.faq : [],

                // 2026-01-14 New Fields
                flightRefTitle: tour.flightRefTitle || "",
                flightRefLink: tour.flightRefLink || "",
                optionCameraSingola: tour.optionCameraSingola || false,
                optionFlexibleCancel: tour.optionFlexibleCancel || false,
                priceFlexibleCancel: tour.priceFlexibleCancel?.toString() || "",
                optionCameraPrivata: tour.optionCameraPrivata || false,
                priceCameraPrivata: tour.priceCameraPrivata?.toString() || "",
                travelStatus: tour.travelStatus || "SOGNANDO",
                galeria2: Array.isArray(tour.galeria2) ? tour.galeria2 : [],
            });

            setCoverImagePreview(tour.coverImage || null);
            setCoverImageFile(null);
            setWebCoverImagePreview(tour.webCoverImage || null); // New
            setWebCoverImageFile(null); // New
            setCoordinadorFotoPreview(tour.coordinadorFoto || null);
            setCoordinadorFotoFile(null);
            setWebCoverImageFile(null); // New
            setCoordinadorFotoPreview(tour.coordinadorFoto || null);
            setCoordinadorFotoFile(null);

            // Reset Gallery 1
            setNewGalleryFiles([]);
            setNewGalleryPreviews([]);

            // Reset Gallery 2
            setFormData(prev => ({ ...prev, galeria2: Array.isArray(tour.galeria2) ? tour.galeria2 : [] }));
            setNewGallery2Files([]);
            setNewGallery2Previews([]);

            setError(null);
        }
    }, [tour, isOpen]);

    // Cleanup
    useEffect(() => {
        return () => {
            newGalleryPreviews.forEach(p => URL.revokeObjectURL(p.url));
            newGallery2Previews.forEach(p => URL.revokeObjectURL(p.url));
            if (coverImageFile) URL.revokeObjectURL(coverImagePreview || "");
        };
    }, [newGalleryPreviews, newGallery2Previews, coverImageFile, coverImagePreview]);

    // Handlers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Generic List Handlers
    const addItem = (field: 'etiquetas' | 'incluye' | 'noIncluye' | 'requisitosDocumentacion', value: string, setValue: (v: string) => void) => {
        if (value.trim()) {
            setFormData(prev => ({ ...prev, [field]: [...prev[field], value.trim()] }));
            setValue("");
        }
    };

    const removeItem = (field: 'etiquetas' | 'incluye' | 'noIncluye' | 'requisitosDocumentacion', index: number) => {
        setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
    };

    // Itinerary Handlers
    const addItineraryItem = () => {
        setFormData(prev => ({
            ...prev,
            itinerario: [...prev.itinerario, { title: "", description: "" }]
        }));
    };

    const updateItineraryItem = (index: number, field: 'title' | 'description', value: string) => {
        const newItinerary = [...formData.itinerario];
        newItinerary[index][field] = value;
        setFormData(prev => ({ ...prev, itinerario: newItinerary }));
    };

    const removeItineraryItem = (index: number) => {
        setFormData(prev => ({ ...prev, itinerario: prev.itinerario.filter((_, i) => i !== index) }));
    };

    // FAQ Handlers
    const addFAQ = () => {
        setFormData(prev => ({ ...prev, faq: [...prev.faq, { question: "", answer: "" }] }));
    };

    const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
        const newFAQ = [...formData.faq];
        newFAQ[index][field] = value;
        setFormData(prev => ({ ...prev, faq: newFAQ }));
    };

    const removeFAQ = (index: number) => {
        setFormData(prev => ({ ...prev, faq: prev.faq.filter((_, i) => i !== index) }));
    };

    // Dropzones
    const onDropCoordinator = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setCoordinadorFotoFile(file);
            setCoordinadorFotoPreview(URL.createObjectURL(file));
        }
    }, []);

    const { getRootProps: getCoordRoot, getInputProps: getCoordInput } = useDropzone({
        onDrop: onDropCoordinator,
        accept: { 'image/*': [] },
        multiple: false
    });



    const onDropWebCover = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setWebCoverImageFile(file);
            setWebCoverImagePreview(URL.createObjectURL(file));
        }
    }, []);

    const { getRootProps: getWebCoverRoot, getInputProps: getWebCoverInput } = useDropzone({
        onDrop: onDropWebCover,
        accept: { 'image/*': [] },
        multiple: false
    });

    // Gallery 1 Drop (Mixed Image/Video)
    const onDropGallery = useCallback((acceptedFiles: File[]) => {
        const newPreviews = acceptedFiles.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' as const : 'image' as const
        }));
        setNewGalleryFiles(prev => [...prev, ...acceptedFiles]);
        setNewGalleryPreviews(prev => [...prev, ...newPreviews]);
    }, []);

    const { getRootProps: getGalleryRoot, getInputProps: getGalleryInput } = useDropzone({
        onDrop: onDropGallery,
        accept: {
            'image/*': [],
            'video/*': []
        },
    });

    // Gallery 2 Drop (Mixed Image/Video)
    const onDropGallery2 = useCallback((acceptedFiles: File[]) => {
        const newPreviews = acceptedFiles.map(file => ({
            url: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' as const : 'image' as const
        }));
        setNewGallery2Files(prev => [...prev, ...acceptedFiles]);
        setNewGallery2Previews(prev => [...prev, ...newPreviews]);
    }, []);

    const { getRootProps: getGallery2Root, getInputProps: getGallery2Input } = useDropzone({
        onDrop: onDropGallery2,
        accept: {
            'image/*': [],
            'video/*': []
        },
    });


    const removeGalleryItem = (index: number, isExisting: boolean, galleryNum: 1 | 2 = 1) => {
        if (galleryNum === 1) {
            if (isExisting) {
                setFormData(prev => ({ ...prev, galeria: prev.galeria.filter((_, i) => i !== index) }));
            } else {
                setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));
                URL.revokeObjectURL(newGalleryPreviews[index].url);
                setNewGalleryPreviews(prev => prev.filter((_, i) => i !== index));
            }
        } else {
            if (isExisting) {
                setFormData(prev => ({ ...prev, galeria2: prev.galeria2.filter((_, i) => i !== index) }));
            } else {
                setNewGallery2Files(prev => prev.filter((_, i) => i !== index));
                URL.revokeObjectURL(newGallery2Previews[index].url);
                setNewGallery2Previews(prev => prev.filter((_, i) => i !== index));
            }
        }
    };

    // Submit Handler
    const handleSubmit = async (publish: boolean) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);

        try {
            const data = new FormData();
            // Base fields
            data.append('titulo', formData.titulo);
            data.append('fechaViaje', formData.fechaViaje);
            data.append('fechaFin', formData.fechaFin);
            data.append('precioAdulto', formData.precioAdulto);
            data.append('precioNino', formData.precioNino);

            // Append Web Fields
            data.append('slug', formData.slug);
            data.append('isPublic', publish ? 'true' : 'false');
            data.append('subtitulo', formData.subtitulo);
            data.append('duracionTexto', formData.duracionTexto);
            data.append('requisitosDocumentacion', JSON.stringify(formData.requisitosDocumentacion));
            data.append('infoGeneral', formData.infoGeneral);
            data.append('itinerario', JSON.stringify(formData.itinerario)); // STRUCTURED JSON
            data.append('mapaEmbed', formData.mapaEmbed);
            data.append('coordinadorNombre', formData.coordinadorNombre);
            data.append('coordinadorDescripcion', formData.coordinadorDescripcion);

            // 2026-01-14 New Fields
            data.append('flightRefTitle', formData.flightRefTitle);
            data.append('flightRefLink', formData.flightRefLink);
            data.append('optionCameraSingola', formData.optionCameraSingola ? 'true' : 'false');
            data.append('optionFlexibleCancel', formData.optionFlexibleCancel ? 'true' : 'false');
            data.append('priceFlexibleCancel', formData.priceFlexibleCancel);
            data.append('optionCameraPrivata', formData.optionCameraPrivata ? 'true' : 'false');
            data.append('priceCameraPrivata', formData.priceCameraPrivata);
            data.append('travelStatus', formData.travelStatus);

            // JSON Fields
            data.append('etiquetas', JSON.stringify(formData.etiquetas));
            data.append('incluye', JSON.stringify(formData.incluye));
            data.append('noIncluye', JSON.stringify(formData.noIncluye));
            data.append('faq', JSON.stringify(formData.faq));

            // Gallery
            data.append('galeria', JSON.stringify(formData.galeria));
            newGalleryFiles.forEach(file => {
                data.append('galleryImages', file);
            });

            // Gallery 2
            data.append('galeria2', JSON.stringify(formData.galeria2));
            newGallery2Files.forEach(file => {
                data.append('gallery2Images', file);
            });

            if (coverImageFile) data.append('coverImage', coverImageFile);
            if (webCoverImageFile) data.append('webCoverImage', webCoverImageFile); // New
            if (coordinadorFotoFile) data.append('coordinadorFoto', coordinadorFotoFile);
            else if (coordinadorFotoPreview === null) data.append('coordinadorFoto', '');

            // Endpoint
            const endpoint = type === 'BUS' ? `/api/tour-bus/${tour.id}` : `/api/tour-aereo/${tour.id}`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                body: data,
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await response.json();
                setError(err.error || "Errore nel salvataggio");
            }

        } catch (e) {
            console.error(e);
            setError("Errore di connessione");
        } finally {
            setIsSubmitting(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
        { id: 'general', label: 'Generale', icon: GlobeIcon },
        { id: 'details', label: 'Dettagli', icon: FileTextIcon },
        { id: 'content', label: 'Contenuto', icon: MapIcon },
        { id: 'media', label: 'Media', icon: ImageIcon },
        { id: 'lists', label: 'Liste', icon: ListIcon },
        { id: 'coordinator', label: 'Coordinatore', icon: UserIcon },
        { id: 'faq', label: 'FAQ', icon: HelpCircleIcon },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl h-[90vh]">
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <GlobeIcon className="w-6 h-6 text-brand-500" />
                            Gestione Contenuti Web
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {tour.titulo} ({type})
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                        <nav className="p-2 space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800">
                        {error && (
                            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* GENERAL */}
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titolo del Tour *</label>
                                    <input type="text" value={formData.titulo} onChange={(e) => handleInputChange('titulo', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Viaggio</label>
                                        <input type="date" value={formData.fechaViaje} onChange={(e) => handleInputChange('fechaViaje', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Fine</label>
                                        <input type="date" value={formData.fechaFin} onChange={(e) => handleInputChange('fechaFin', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prezzo Adulto (€)</label>
                                        <input type="number" value={formData.precioAdulto} onChange={(e) => handleInputChange('precioAdulto', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prezzo Bambino (€)</label>
                                        <input type="number" value={formData.precioNino} onChange={(e) => handleInputChange('precioNino', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug URL *</label>
                                    <div className="flex gap-2">
                                        <span className="p-2 bg-gray-100 rounded-l-md text-gray-500 border border-r-0">gibravo.it/tour/</span>
                                        <input type="text" value={formData.slug} onChange={(e) => handleInputChange('slug', e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-r-md dark:bg-gray-700 dark:text-white" placeholder="slug-unico" />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Lasciare vuoto per generare dal titolo.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sottotitolo (Marketing)</label>
                                    <input type="text" value={formData.subtitulo} onChange={(e) => handleInputChange('subtitulo', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" placeholder="Es: Un'avventura indimenticabile!" />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stato del Viaggio</label>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                        {[
                                            { val: "SOGNANDO", label: "💭 Sognando" },
                                            { val: "QUASI_FAMIGLIA", label: "👨‍👩‍👧‍👦 Quasi Famiglia" },
                                            { val: "CONFERMATO", label: "✅ Confermato" },
                                            { val: "ULTIMI_POSTI", label: "⏳ Ultimi Posti" },
                                            { val: "COMPLETO", label: "🚫 Completo" },
                                        ].map((status) => (
                                            <button
                                                key={status.val}
                                                onClick={() => handleInputChange('travelStatus', status.val)}
                                                className={`p-2 rounded-md text-sm font-medium border transition-colors ${formData.travelStatus === status.val
                                                    ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {status.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DETAILS */}
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Durata (Testo)</label>
                                    <input type="text" value={formData.duracionTexto} onChange={(e) => handleInputChange('duracionTexto', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" placeholder="Es: 5 Giorni / 4 Notti" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Documentazione Richiesta</label>
                                    <div className="flex gap-2 mb-2">
                                        <input type="text" value={newRequisito} onChange={(e) => setNewRequisito(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white" placeholder="Es: Passaporto validità 6 mesi" />
                                        <button onClick={() => addItem('requisitosDocumentacion', newRequisito, setNewRequisito)} className="p-2 bg-brand-500 text-white rounded-md"><PlusIcon className="w-5 h-5" /></button>
                                    </div>
                                    <ul className="space-y-1">
                                        {formData.requisitosDocumentacion.map((item, i) => (
                                            <li key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                                <span>{item}</span>
                                                <button onClick={() => removeItem('requisitosDocumentacion', i)} className="text-red-500"><XIcon className="w-4 h-4" /></button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* --- NEW SECTION: Extra & Options --- */}
                                <div className="border-t pt-6 space-y-4">
                                    <h3 className="font-medium text-gray-900 border-b pb-2">Opzioni e Supplementi</h3>

                                    {/* Flight Reference */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo Volo / Operativo</label>
                                            <input type="text" value={formData.flightRefTitle} onChange={(e) => handleInputChange('flightRefTitle', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Es: Voli Turkish Airlines" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Link Volo (Opzionale)</label>
                                            <input type="text" value={formData.flightRefLink} onChange={(e) => handleInputChange('flightRefLink', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="https://..." />
                                        </div>
                                    </div>

                                    {/* Checkboxes & Costs */}
                                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                                        {/* Single Room */}
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="opt_single"
                                                checked={formData.optionCameraSingola}
                                                onChange={(e) => handleInputChange('optionCameraSingola', e.target.checked)}
                                                className="h-4 w-4 text-brand-600 rounded border-gray-300"
                                            />
                                            <label htmlFor="opt_single" className="text-sm font-medium text-gray-700">Abilita opzione &quot;Mi va bene camera singola&quot;</label>
                                        </div>

                                        {/* Flexible Cancellation */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="opt_flex"
                                                    checked={formData.optionFlexibleCancel}
                                                    onChange={(e) => handleInputChange('optionFlexibleCancel', e.target.checked)}
                                                    className="h-4 w-4 text-brand-600 rounded border-gray-300"
                                                />
                                                <label htmlFor="opt_flex" className="text-sm font-medium text-gray-700">Flexible Cancellation</label>
                                            </div>
                                            {formData.optionFlexibleCancel && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Costo: €</span>
                                                    <input
                                                        type="number"
                                                        value={formData.priceFlexibleCancel}
                                                        onChange={(e) => handleInputChange('priceFlexibleCancel', e.target.value)}
                                                        className="w-24 p-1 border border-gray-300 rounded-md text-sm"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Private Room */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="opt_private"
                                                    checked={formData.optionCameraPrivata}
                                                    onChange={(e) => handleInputChange('optionCameraPrivata', e.target.checked)}
                                                    className="h-4 w-4 text-brand-600 rounded border-gray-300"
                                                />
                                                <label htmlFor="opt_private" className="text-sm font-medium text-gray-700">Camera Privata</label>
                                            </div>
                                            {formData.optionCameraPrivata && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-500">Costo: €</span>
                                                    <input
                                                        type="number"
                                                        value={formData.priceCameraPrivata}
                                                        onChange={(e) => handleInputChange('priceCameraPrivata', e.target.value)}
                                                        className="w-24 p-1 border border-gray-300 rounded-md text-sm"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONTENT (ITINERARY) */}
                        {activeTab === 'content' && (
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Info Generali (Introduzione)</label>
                                    <SimpleRichTextEditor
                                        value={formData.infoGeneral}
                                        onChange={(val) => handleInputChange('infoGeneral', val)}
                                        placeholder="Riepilogo del viaggio..."
                                        rows={4}
                                    />
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            <CalendarIcon className="w-5 h-5" />
                                            Itinerario Giorno per Giorno
                                        </h3>
                                        <Button onClick={addItineraryItem} size="sm" variant="outline"><PlusIcon className="w-4 h-4 mr-2" /> Aggiungi Giorno</Button>
                                    </div>
                                    <div className="space-y-4">
                                        {formData.itinerario.map((day, i) => (
                                            <div key={i} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                                                <button onClick={() => removeItineraryItem(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                                                <div className="mb-3">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Titolo del Giorno</label>
                                                    <input
                                                        type="text"
                                                        value={day.title}
                                                        onChange={(e) => updateItineraryItem(i, 'title', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-md font-medium"
                                                        placeholder="Giorno 1: Arrivo a..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrizione</label>
                                                    <SimpleRichTextEditor
                                                        value={day.description}
                                                        onChange={(val) => updateItineraryItem(i, 'description', val)}
                                                        placeholder="Dettagli della giornata..."
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {formData.itinerario.length === 0 && <p className="text-center text-gray-500 py-6 italic">Nessun giorno registrato nell&apos;itinerario.</p>}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mappa Embed (SRC Iframe)</label>
                                    <input
                                        type="text"
                                        value={formData.mapaEmbed}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            // Auto-extract src if iframe tag is pasted
                                            if (val.includes('<iframe')) {
                                                const srcMatch = val.match(/src=["']([^"']+)["']/);
                                                if (srcMatch && srcMatch[1]) {
                                                    val = srcMatch[1];
                                                }
                                            }
                                            handleInputChange('mapaEmbed', val);
                                        }}
                                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white"
                                        placeholder="https://google.com/maps/embed?..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Incolla pure l&apos;intero codice &lt;iframe&gt; di Google Maps, estraggo il link automaticamente.</p>
                                </div>
                            </div>
                        )}

                        {/* MEDIA */}
                        {activeTab === 'media' && (
                            <div className="space-y-8">
                                {/* Internal Cover Image Removed */}

                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-500" /> Foto di Copertina WEB (Alta Qualità)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2">
                                            <div {...getWebCoverRoot()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 bg-white dark:bg-gray-900">
                                                <input {...getWebCoverInput()} />
                                                <UploadIcon className="w-10 h-10 text-gray-400 mb-3 mx-auto" />
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Clicca o trascina per caricare</p>
                                                <p className="text-xs text-gray-500 mt-1">Consigliato: 1920x1080px (Alta definizione)</p>
                                            </div>
                                        </div>
                                        <div className="md:col-span-1">
                                            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-200 border border-gray-300 shadow-sm">
                                                {webCoverImagePreview ? <Image src={webCoverImagePreview} alt="Web Cover" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-gray-400">Nessuna immagine</div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Gallery 1 */}
                                <div className="border-t pt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Galleria Immagini - Galleria 1</label>
                                    <div {...getGalleryRoot()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-brand-500 bg-white dark:bg-gray-900">
                                        <input {...getGalleryInput()} />
                                        <div className="flex flex-col items-center">
                                            <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-gray-500">Trascina immagini e video qui</p>
                                            <p className="text-xs text-orange-500 mt-1">Video: Max 20MB consigliato</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        {/* Existing Gallery 1 */}
                                        {formData.galeria.map((url, i) => (
                                            <div key={`e-${i}`} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                                {url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/') ? (
                                                    <video src={url} className="object-cover w-full h-full" controls={false} />
                                                ) : (
                                                    <Image src={url} alt="" fill className="object-cover" />
                                                )}
                                                <button onClick={() => removeGalleryItem(i, true, 1)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><XIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                        {/* New Gallery 1 Files */}
                                        {newGalleryPreviews.map((item, i) => (
                                            <div key={`n-${i}`} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-green-500">
                                                {item.type === 'video' ? (
                                                    <video src={item.url} className="object-cover w-full h-full" />
                                                ) : (
                                                    <Image src={item.url} alt="" fill className="object-cover" />
                                                )}
                                                <button onClick={() => removeGalleryItem(i, false, 1)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><XIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Gallery 2 */}
                                <div className="border-t pt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Galleria Immagini - Galleria 2</label>
                                    <div {...getGallery2Root()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-brand-500 bg-white dark:bg-gray-900">
                                        <input {...getGallery2Input()} />
                                        <div className="flex flex-col items-center">
                                            <UploadIcon className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-gray-500">Trascina immagini e video qui</p>
                                            <p className="text-xs text-orange-500 mt-1">Video: Max 20MB consigliato</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                        {/* Existing Gallery 2 */}
                                        {formData.galeria2?.map((url, i) => (
                                            <div key={`e2-${i}`} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden">
                                                {url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/') ? (
                                                    <video src={url} className="object-cover w-full h-full" controls={false} />
                                                ) : (
                                                    <Image src={url} alt="" fill className="object-cover" />
                                                )}
                                                <button onClick={() => removeGalleryItem(i, true, 2)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><XIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                        {/* New Gallery 2 Files */}
                                        {newGallery2Previews.map((item, i) => (
                                            <div key={`n2-${i}`} className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-green-500">
                                                {item.type === 'video' ? (
                                                    <video src={item.url} className="object-cover w-full h-full" />
                                                ) : (
                                                    <Image src={item.url} alt="" fill className="object-cover" />
                                                )}
                                                <button onClick={() => removeGalleryItem(i, false, 2)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"><XIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LISTS */}
                        {activeTab === 'lists' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Include</label>
                                    <div className="flex gap-2 mb-2">

                                        <input type="text" value={newIncluye} onChange={(e) => setNewIncluye(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md" placeholder="Es: Volo A/R" />
                                        <button onClick={() => addItem('incluye', newIncluye, setNewIncluye)} className="p-2 bg-brand-500 text-white rounded-md"><PlusIcon className="w-5 h-5" /></button>
                                    </div>
                                    <ul className="space-y-1">{formData.incluye.map((item, i) => (<li key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded"><span>{item}</span><button onClick={() => removeItem('incluye', i)} className="text-red-500"><XIcon className="w-4 h-4" /></button></li>))}</ul>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Non Include</label>
                                    <div className="flex gap-2 mb-2">

                                        <input type="text" value={newNoIncluye} onChange={(e) => setNewNoIncluye(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md" placeholder="Es: Mance" />
                                        <button onClick={() => addItem('noIncluye', newNoIncluye, setNewNoIncluye)} className="p-2 bg-brand-500 text-white rounded-md"><PlusIcon className="w-5 h-5" /></button>
                                    </div>
                                    <ul className="space-y-1">{formData.noIncluye.map((item, i) => (<li key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded"><span>{item}</span><button onClick={() => removeItem('noIncluye', i)} className="text-red-500"><XIcon className="w-4 h-4" /></button></li>))}</ul>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Perché viaggiare con noi</label>
                                    <div className="flex gap-2 mb-2">

                                        <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-md" placeholder="Es: Piccoli gruppi, Guida esperta..." />
                                        <button onClick={() => addItem('etiquetas', newTag, setNewTag)} className="p-2 bg-brand-500 text-white rounded-md"><PlusIcon className="w-5 h-5" /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">{formData.etiquetas.map((item, i) => (<span key={i} className="flex items-center gap-1 bg-brand-100 text-brand-800 px-2 py-1 rounded-full text-sm">{item}<button onClick={() => removeItem('etiquetas', i)}><XIcon className="w-3 h-3" /></button></span>))}</div>
                                </div>
                            </div>
                        )}

                        {/* COORDINATOR */}
                        {activeTab === 'coordinator' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nome Coordinatore</label>
                                    <input type="text" value={formData.coordinadorNombre} onChange={(e) => handleInputChange('coordinadorNombre', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                                    <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer" {...getCoordRoot()}>
                                        <input {...getCoordInput()} />
                                        {coordinadorFotoPreview ? <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden"><Image src={coordinadorFotoPreview} alt="" fill className="object-cover" /></div> : <div className="w-32 h-32 mx-auto bg-gray-100 rounded-full flex items-center justify-center"><UserIcon className="w-12 h-12 text-gray-400" /></div>}
                                        <p className="text-xs text-gray-500 mt-2">Carica foto</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Descrizione Breve</label>
                                    <textarea rows={8} value={formData.coordinadorDescripcion} onChange={(e) => handleInputChange('coordinadorDescripcion', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Esperto in..." />
                                </div>
                            </div>
                        )}

                        {/* FAQ */}
                        {activeTab === 'faq' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center"><h3 className="font-medium">Domande Frequenti (FAQ)</h3><Button onClick={addFAQ} size="sm" variant="outline"><PlusIcon className="w-4 h-4 mr-2" /> Aggiungi</Button></div>
                                {formData.faq.map((item, i) => (
                                    <div key={i} className="p-4 border border-gray-200 rounded-lg relative">
                                        <button onClick={() => removeFAQ(i)} className="absolute top-2 right-2 text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        <div className="mb-2"><label className="text-xs font-bold text-gray-500 uppercase">Domanda</label><input type="text" value={item.question} onChange={(e) => updateFAQ(i, 'question', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></div>
                                        <div><label className="text-xs font-bold text-gray-500 uppercase">Risposta</label><textarea rows={2} value={item.answer} onChange={(e) => updateFAQ(i, 'answer', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" /></div>
                                    </div>
                                ))}
                                {formData.faq.length === 0 && <p className="text-center text-gray-500 py-8 italic">Nessuna domanda frequente.</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Annulla</Button>
                    <Button onClick={() => handleSubmit(false)} variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200" disabled={isSubmitting}><SaveIcon className="w-4 h-4 mr-2" /> Salva Bozza</Button>
                    <Button onClick={() => handleSubmit(true)} className="bg-green-600 text-white" disabled={isSubmitting}><SendIcon className="w-4 h-4 mr-2" /> PUBBLICA</Button>
                </div>
            </div >
        </Modal >
    );
}

