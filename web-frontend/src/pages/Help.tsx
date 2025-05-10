import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  Edit,
  BarChart2,
  Camera,
  MessageCircle,
  ArrowLeft,
  BookOpen,
} from "lucide-react";

/** Describes each section in the help or FAQ. */
interface HelpSection {
  id: string;
  title: string;
  icon: JSX.Element;
  content: string[];
  isImportant?: boolean;
}
import { useNavigate } from "react-router-dom";

const Help: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(["overview"]);
  const [activeTab, setActiveTab] = useState<"panduan" | "faq">("panduan");
  const navigate = useNavigate(); 
  
  const toggleSection = (id: string) => {
    if (expandedSections.includes(id)) {
      setExpandedSections(expandedSections.filter((sectionId) => sectionId !== id));
    } else {
      setExpandedSections([...expandedSections, id]);
    }
  };

  const isSectionExpanded = (id: string) => expandedSections.includes(id);

  const helpSections: HelpSection[] = [
    {
      id: "overview",
      title: "Tentang Aplikasi",
      icon: <Info width={20} height={20} color="#047857" />,
      content: [
        "Aplikasi ini membantu Anda mengukur dan menganalisis dua jenis data:",
        "1) Fragmentasi Batuan, mengetahui distribusi ukuran batuan hasil blasting",
        "2) Kedalaman Lubang (Depth Average), mengetahui rata-rata kedalaman lubang dengan memasukkan gambar sounding.",
        "Anda dapat menyimpan riwayat pengukuran dan meninjau data.",
      ],
    },
    {
      id: "data-entry",
      title: "Cara Memasukkan Data",
      icon: <Edit width={20} height={20} color="#047857" />,
      content: [
        "A. Flow Depth Average:",
        '1. Di halaman utama, tekan "Depth Average" lalu pilih "Tambah".',
        "2. Unggah gambar soundingan sesuai format.",
        "3. Periksa nilai jumlah lubang dan kedalaman masing-masing lubang, pastikan tidak ada data yang kosong atau salah.",
        "4. Nilai rata-rata kedalaman akan dihitung otomatis oleh sistem.",
        '5. Tekan "Simpan" dan buka riwayat untuk melihat ringkasan',
        "",
        "B. Flow Fragmentasi Batuan:",
        '1. Di halaman utama, tekan "Fragmentasi Batuan" lalu pilih "Tambah".',
        "2. Isi data pendukung fragmentasi (skala, satuan, ukuran, lokasi, tanggal, jenis material).",
        "3. Isi data amonium nitrat dan volume blasting.",
        "4. Unggah foto fragmentasi.",
        "5. Beri tanda pada skala dengan warna hijau.",
        '6. Tekan "next" untuk image processing, edit hasilnya jika belum sesuai.',
        '7. Tekan "next" lalu simpan, buka riwayat untuk melihat hasil dan ringkasan.',
      ],
      isImportant: true,
    },
    {
      id: "graphs",
      title: "Memahami Grafik (Fragmentasi)",
      icon: <BarChart2 width={20} height={20} color="#047857" />,
      content: [
        "Grafik menampilkan distribusi ukuran fragmen batuan:",
        "• Sumbu X: Ukuran partikel (misalnya mm atau μm).",
        "• Sumbu Y: Persentase kumulatif material yang lebih halus dari ukuran tersebut.",
        "• Kurva lebih curam = ukuran lebih seragam.",
        "• Nilai P20, P50, dan P80 menunjukkan ukuran di mana 20%, 50%, dan 80% material lebih halus.",
      ],
    },
    {
      id: "photos",
      title: "Menambahkan Foto",
      icon: <Camera width={20} height={20} color="#047857" />,
      content: [
        "Untuk menambahkan foto (umumnya pada Fragmentasi Batuan):",
        '1. Tekan tombol "+ Tambah Foto" atau gunakan form upload pada langkah yang sesuai.',
        "2. Pilih untuk mengambil foto baru atau dari galeri.",
        "3. Foto akan ditampilkan di kartu ringkasan dan disimpan dengan data.",
        "4. Anda dapat menambahkan beberapa foto untuk setiap pengukuran.",
      ],
    },
  ];

  // Updated FAQ sections remain the same for general usage
  const faqSections: HelpSection[] = [
    {
      id: "faq-1",
      title: "Bagaimana cara melihat riwayat pengukuran?",
      icon: <HelpCircle width={20} height={20} color="#047857" />,
      content: [
        "Untuk melihat riwayat pengukuran:",
        "1. Buka halaman utama aplikasi.",
        '2. Tekan tombol "Riwayat".',
        "3. Semua pengukuran sebelumnya akan ditampilkan dalam daftar.",
        "4. Tekan pada item untuk melihat detail lengkap.",
      ],
    },
    {
      id: "faq-2",
      title: "Bagaimana cara mengubah satuan pengukuran?",
      icon: <HelpCircle width={20} height={20} color="#047857" />,
      content: [
        "Untuk mengubah satuan pengukuran:",
        '1. Buka menu "Pengaturan" dari halaman utama.',
        '2. Pilih "Satuan Pengukuran".',
        "3. Pilih satuan yang diinginkan (cm, mm, inch).",
        "4. Semua pengukuran akan otomatis dikonversi ke satuan baru.",
      ],
    },
    {
      id: "faq-3",
      title: "Apakah aplikasi bisa digunakan offline?",
      icon: <HelpCircle width={20} height={20} color="#047857" />,
      content: [
        "Ya, aplikasi ini dapat digunakan dalam mode offline:",
        "• Semua fitur pengukuran dan analisis tersedia offline.",
        "• Data disimpan secara lokal di perangkat Anda.",
        "• Saat terhubung ke internet, data akan otomatis disinkronkan ke cloud.",
        "• Pastikan Anda telah login sebelum menggunakan mode offline untuk memastikan data dapat disinkronkan nanti.",
      ],
    },
  ];

  const renderSections = (sections: HelpSection[]) => {
    return sections.map((section) => (
      <div key={section.id} className="mb-3">
        <button
          type="button"
          className={`bg-white rounded-xl p-4 shadow-sm border ${
            section.isImportant ? "border-emerald-200" : "border-gray-100"
          } flex items-center justify-between w-full`}
          onClick={() => toggleSection(section.id)}
        >
          <div className="flex items-center flex-1">
            <div
              className={`p-2 rounded-full ${
                section.isImportant ? "bg-emerald-100" : "bg-emerald-50"
              }`}
            >
              {section.icon}
            </div>
            <span
              className={`font-semibold ml-3 flex-1 ${
                section.isImportant ? "text-emerald-800" : "text-gray-800"
              }`}
            >
              {section.title}
            </span>
          </div>
          {isSectionExpanded(section.id) ? (
            <ChevronUp width={20} height={20} color="#4b5563" />
          ) : (
            <ChevronDown width={20} height={20} color="#4b5563" />
          )}
        </button>
        {isSectionExpanded(section.id) && (
          <div className="bg-white px-4 pb-4 rounded-b-xl shadow-sm border-x border-b border-gray-100 -mt-1">
            {section.content.map((paragraph: string, paragraphIdx: number) => (
              <p key={paragraphIdx} className="text-gray-600 mt-2 leading-6">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              className="p-2 -ml-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft width={24} height={24} color="#111827" />
            </button>
            <span className="text-xl font-bold text-gray-800 ml-2">
              Bantuan
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-200">
        <button
          type="button"
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "panduan" ? "border-b-2 border-emerald-600" : ""
          }`}
          onClick={() => setActiveTab("panduan")}
        >
          <BookOpen
            width={18}
            height={18}
            color={activeTab === "panduan" ? "#047857" : "#6b7280"}
          />
          <span
            className={`ml-2 font-medium ${
              activeTab === "panduan" ? "text-emerald-700" : "text-gray-600"
            }`}
          >
            Panduan
          </span>
        </button>
        <button
          type="button"
          className={`flex-1 py-3 flex items-center justify-center ${
            activeTab === "faq" ? "border-b-2 border-emerald-600" : ""
          }`}
          onClick={() => setActiveTab("faq")}
        >
          <MessageCircle
            width={18}
            height={18}
            color={activeTab === "faq" ? "#047857" : "#6b7280"}
          />
          <span
            className={`ml-2 font-medium ${
              activeTab === "faq" ? "text-emerald-700" : "text-gray-600"
            }`}
          >
            FAQ
          </span>
        </button>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {/* Introduction */}
        <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
          <div className="flex items-center mb-2">
            <HelpCircle width={24} height={24} color="#047857" />
            <span className="text-lg font-bold text-emerald-800 ml-2">
              {activeTab === "panduan" ? "Panduan Penggunaan" : "Pertanyaan Umum"}
            </span>
          </div>
          <p className="text-emerald-700">
            {activeTab === "panduan"
              ? "Temukan panduan dan informasi untuk membantu Anda menggunakan aplikasi dengan maksimal. Pilih topik di bawah untuk melihat detail lebih lanjut."
              : "Berikut adalah jawaban untuk pertanyaan yang sering diajukan. Jika Anda tidak menemukan jawaban yang Anda cari, silakan hubungi tim dukungan kami."}
          </p>
        </div>

        {/* Help Sections or FAQ based on active tab */}
        {activeTab === "panduan"
          ? renderSections(helpSections)
          : renderSections(faqSections)}
      </div>
    </div>
  );
};

export default Help;
