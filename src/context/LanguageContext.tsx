"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type LanguageMode = 'en' | 'id';

type TranslationsType = {
  [key in LanguageMode]: {
    [key: string]: string;
  };
};

export const translations: TranslationsType = {
  en: {
    // Navigation & Common
    logo: "Motive",
    welcome: "Welcome",
    search_placeholder: "Search...",
    theme_light: "Light Mode",
    theme_dark: "Dark Mode",
    theme_system: "System Default",
    tasks: "Tasks",
    journals: "Journals",
    reports: "Reports",
    settings: "Settings",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    loading: "Loading...",

    // Task Manager
    new_objective: "New Objective",
    task_title: "Task Title",
    task_desc: "Description (optional)",
    category: "Category",
    priority: "Priority",
    deadline: "Deadline Time",
    add_task: "Add Task",
    remaining: "Remaining",
    completed: "Completed",
    all_categories: "All Categories",
    filter_by: "Filter by:",
    no_tasks: "No tasks scheduled for this day.",
    pending_section: "Pending Tasks",
    completed_section: "Completed Tasks",
    manage_categories: "Customize",
    add_category: "Add Category",
    edit_category: "Edit Category",
    delete_category: "Delete Category",
    category_placeholder: "Category Name",
    daily_velocity: "Daily Velocity",
    era_ai: "ERA Cycle AI",
    insights_ready: "Insights Ready",
    extract_insights: "Extract AI Insights",
    insights_modal_title: "ERA Cycle Insights",
    experience_title: "EXPERIENCE (ACCOMPLISHED)",
    reflection_title: "REFLECTION (CHALLENGES)",
    action_title: "ACTION PLAN (ROADMAP)",
    close: "Close",
    generating_insights: "Analyzing tasks and journals to extract professional insights...",

    // Journaling Page
    journal_title: "Journal",
    pick_date: "Pick Date:",
    no_journals: "No journals for today.",
    untitled_journal: "Untitled Journal",
    word_count: "Word & Character Count",
    words: "words",
    characters: "characters",
    max_char: "Maximum 5000 Characters",
    journal_placeholder: "Write down your experiences, anxiety levels, thoughts...",
    saving: "Saving...",
    saved: "Saved",

    // Reports Page
    productivity_velocity: "Productivity Velocity",
    vs_last: "VS LAST PERIOD",
    focus_split: "Focus Split",
    no_tasks_range: "No tasks found in this date range.",
    focus_split_desc: "Categorized focus ratios based on all scheduled range tasks",
    era_summaries: "ERA Summaries",
    era_desc: "Executive Reflection & Analysis (AI Generated)",
    generate_report: "GENERATE REPORT",
    generating: "GENERATING...",
    weekly_era: "WEEKLY COMPREHENSIVE ERA",
    daily_overview: "DAILY REFLECTION OVERVIEW",
    saved_era: "SAVED ERA",
    no_era: "No ERA summaries generated yet. Click Generate Report to analyze your selected date range.",
    completed_tasks: "Completed Tasks",
    total_tasks: "Total Scheduled Tasks",

    // Settings Page
    profile: "Profile Settings",
    appearance: "Appearance",
    appearance_desc: "Choose how Motive looks on this device.",
    light: "Light",
    dark: "Dark",
    system: "System",
    personal_pref: "Personal Preferences",
    first_name: "First Name",
    last_name: "Last Name",
    email_label: "Reports Recipient Email",
    email_desc: "Used as the default target email when clicking \"Send to Email\" in reports.",
    backup_restore: "Data Backup & Restore",
    backup_desc: "Export a portable JSON file containing your entire history, or restore it on another browser or device.",
    export_json: "Export Backup JSON",
    import_json: "Import Backup JSON",
    danger_zone: "Danger Zone",
    danger_desc: "Permanently erase all tasks, reflections, and journals from local IndexedDB storage. This cannot be undone.",
    clear_data: "Clear All Database Data",
    data_history: "Data Transfer History",
    no_history: "No backup operations recorded yet.",
    onboarding_toggle: "Show Onboarding Tour",
    onboarding_desc: "Enable the interactive step-by-step tour of the Motive workspace.",
    language: "Language",
    language_desc: "Choose your preferred language.",

    // Onboarding Tour
    tour_welcome_title: "Welcome to Motive!",
    tour_welcome_desc: "Let's take a quick, 5-step interactive tour to learn how to align your productivity with self-reflection.",
    tour_step1_title: "Step 1: Create a Task",
    tour_step1_desc: "Fill in the form to set a new task with a deadline, custom category, and priority level.",
    tour_step2_title: "Step 2: Track & Complete",
    tour_step2_desc: "Check off tasks as you finish them. Watch your Daily Velocity percentage grow in real-time!",
    tour_step3_title: "Step 3: Journal Daily",
    tour_step3_desc: "Navigate to Journals to write down your emotional logs. Emotional tracking makes productivity meaningful.",
    tour_step4_title: "Step 4: View Reports & ERA",
    tour_step4_desc: "Analyze your progress charts and click 'GENERATE REPORT' to get AI-powered ERA summaries.",
    tour_step5_title: "Step 5: Settings & Customization",
    tour_step5_desc: "Customize task categories, switch dark/light theme, toggle languages, or manage your backups.",
    next: "Next",
    back: "Back",
    end_tour: "Finish",
    skip_tour: "Skip"
  },
  id: {
    // Navigation & Common
    logo: "Motive",
    welcome: "Selamat Datang",
    search_placeholder: "Cari...",
    theme_light: "Mode Terang",
    theme_dark: "Mode Gelap",
    theme_system: "Bawaan Sistem",
    tasks: "Tugas",
    journals: "Jurnal",
    reports: "Laporan",
    settings: "Pengaturan",
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    loading: "Memuat...",

    // Task Manager
    new_objective: "Tugas Baru",
    task_title: "Judul Tugas",
    task_desc: "Deskripsi (opsional)",
    category: "Kategori",
    priority: "Prioritas",
    deadline: "Batas Waktu",
    add_task: "Tambah Tugas",
    remaining: "Sisa",
    completed: "Selesai",
    all_categories: "Semua Kategori",
    filter_by: "Saring berdasarkan:",
    no_tasks: "Tidak ada tugas dijadwalkan untuk hari ini.",
    pending_section: "Tugas Tertunda",
    completed_section: "Tugas Selesai",
    manage_categories: "Sesuaikan",
    add_category: "Tambah Kategori",
    edit_category: "Ubah Kategori",
    delete_category: "Hapus Kategori",
    category_placeholder: "Nama Kategori",
    daily_velocity: "Kecepatan Harian",
    era_ai: "ERA Siklus AI",
    insights_ready: "Rangkuman Siap",
    extract_insights: "Ekstrak Rangkuman AI",
    insights_modal_title: "Rangkuman Siklus ERA",
    experience_title: "EXPERIENCE (PENCAPAIAN)",
    reflection_title: "REFLECTION (TANTANGAN)",
    action_title: "ACTION PLAN (RENCANA KERJA)",
    close: "Tutup",
    generating_insights: "Menganalisis tugas dan jurnal untuk menghasilkan rangkuman profesional...",

    // Journaling Page
    journal_title: "Jurnal",
    pick_date: "Pilih Tanggal:",
    no_journals: "Tidak ada jurnal hari ini.",
    untitled_journal: "Jurnal Tanpa Judul",
    word_count: "Jumlah Kata & Karakter",
    words: "kata",
    characters: "karakter",
    max_char: "Maksimal 5000 Karakter",
    journal_placeholder: "Tuliskan pengalaman, tingkat kecemasan, pikiran Anda...",
    saving: "Menyimpan...",
    saved: "Disimpan",

    // Reports Page
    productivity_velocity: "Kecepatan Produktivitas",
    vs_last: "VS PERIODE SEBELUMNYA",
    focus_split: "Pembagian Fokus",
    no_tasks_range: "Tidak ada tugas ditemukan dalam rentang tanggal ini.",
    focus_split_desc: "Rasio fokus dikategorikan berdasarkan semua tugas rentang terjadwal",
    era_summaries: "Ringkasan ERA",
    era_desc: "Refleksi & Analisis Eksekutif (Dibuat oleh AI)",
    generate_report: "BUAT LAPORAN",
    generating: "MEMBUAT...",
    weekly_era: "ERA KOMPREHENSIF MINGGUAN",
    daily_overview: "IKHTISAR REFLEKSI HARIAN",
    saved_era: "ERA TERSIMPAN",
    no_era: "Belum ada ringkasan ERA yang dibuat. Klik Buat Laporan untuk menganalisis rentang tanggal yang dipilih.",
    completed_tasks: "Tugas Selesai",
    total_tasks: "Total Tugas Terjadwal",

    // Settings Page
    profile: "Pengaturan Profil",
    appearance: "Tampilan",
    appearance_desc: "Pilih bagaimana tampilan Motive di perangkat ini.",
    light: "Terang",
    dark: "Gelap",
    system: "Sistem",
    personal_pref: "Preferensi Pribadi",
    first_name: "Nama Depan",
    last_name: "Nama Belakang",
    email_label: "Email Penerima Laporan",
    email_desc: "Digunakan sebagai email tujuan default saat mengeklik \"Kirim ke Email\" di laporan.",
    backup_restore: "Cadangkan & Pulihkan Data",
    backup_desc: "Ekspor file JSON portabel yang berisi seluruh riwayat Anda, atau pulihkan di browser atau perangkat lain.",
    export_json: "Ekspor JSON Cadangan",
    import_json: "Impor JSON Cadangan",
    danger_zone: "Zona Bahaya",
    danger_desc: "Hapus secara permanen semua tugas, refleksi, dan jurnal dari penyimpanan offline IndexedDB lokal. Ini tidak dapat dibatalkan.",
    clear_data: "Hapus Semua Data Database",
    data_history: "Riwayat Transfer Data",
    no_history: "Belum ada operasi pencadangan yang tercatat.",
    onboarding_toggle: "Tampilkan Tur Panduan",
    onboarding_desc: "Aktifkan tur interaktif langkah-demi-langkah di ruang kerja Motive.",
    language: "Bahasa",
    language_desc: "Pilih bahasa pilihan Anda.",

    // Onboarding Tour
    tour_welcome_title: "Selamat Datang di Motive!",
    tour_welcome_desc: "Mari ikuti tur interaktif cepat 5 langkah untuk mempelajari cara menyelaraskan produktivitas dengan refleksi diri.",
    tour_step1_title: "Langkah 1: Buat Tugas",
    tour_step1_desc: "Isi formulir untuk menetapkan tugas baru dengan batas waktu, kategori khusus, dan tingkat prioritas.",
    tour_step2_title: "Langkah 2: Pantau & Selesaikan",
    tour_step2_desc: "Centang tugas saat Anda menyelesaikannya. Lihat persentase Kecepatan Harian Anda meningkat secara real-time!",
    tour_step3_title: "Langkah 3: Jurnal Harian",
    tour_step3_desc: "Buka menu Jurnal untuk menulis catatan emosional harian Anda. Pelacakan emosi membuat produktivitas lebih bermakna.",
    tour_step4_title: "Langkah 4: Lihat Laporan & ERA",
    tour_step4_desc: "Analisis grafik kemajuan Anda dan klik 'BUAT LAPORAN' untuk mendapatkan ringkasan ERA berbasis AI.",
    tour_step5_title: "Langkah 5: Pengaturan & Kustomisasi",
    tour_step5_desc: "Kustomisasi kategori tugas, ubah tema gelap/terang, ganti bahasa, atau kelola cadangan Anda.",
    next: "Lanjut",
    back: "Kembali",
    end_tour: "Selesai",
    skip_tour: "Lewati"
  }
};

interface LanguageContextValue {
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => { },
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageMode>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = (localStorage.getItem('motive_language') as LanguageMode) || 'en';
    setLanguageState(stored);
  }, []);

  const setLanguage = useCallback((lang: LanguageMode) => {
    localStorage.setItem('motive_language', lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
