import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Info,
  HelpCircle,
  Layers,
  Edit,
  BarChart2,
  Camera,
  Mail,
  MessageCircle,
  ArrowLeft,
  BookOpen,
  AlertCircle,
} from 'react-native-feather';

type HelpSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
  isImportant?: boolean;
};
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import {useNavigation} from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Help'>;

const Help = () => {
  const navigation = useNavigation<NavigationProp>();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'overview',
  ]);
  const [activeTab, setActiveTab] = useState<'panduan' | 'faq'>('panduan');

  const toggleSection = (id: string) => {
    if (expandedSections.includes(id)) {
      setExpandedSections(
        expandedSections.filter(sectionId => sectionId !== id),
      );
    } else {
      setExpandedSections([...expandedSections, id]);
    }
  };

  const isSectionExpanded = (id: string) => expandedSections.includes(id);

  const helpSections: HelpSection[] = [
    {
      id: 'overview',
      title: 'Tentang Aplikasi',
      icon: <Info width={20} height={20} color="#047857" />,
      content: [
        'Aplikasi ini membantu Anda mengukur dan menganalisis dua jenis data:',
        '1) Fragmentasi Batuan (mencakup ukuran fragmen, grafik distribusi, dan foto)',
        '2) Kedalaman Lubang (Depth Average), di mana Anda dapat memasukkan jumlah lubang dan mendapatkan rata-rata kedalaman.',
        'Anda dapat menyimpan riwayat pengukuran, meninjau data, dan mengekspor hasil sesuai kebutuhan.',
      ],
    },
    {
      id: 'data-entry',
      title: 'Cara Memasukkan Data',
      icon: <Edit width={20} height={20} color="#047857" />,
      content: [
        'A. Flow Depth Average:',
        '1. Di halaman utama, tekan "Tambah" lalu pilih "Depth Average".',
        '2. Unggah gambar (opsional) jika diperlukan.',
        '3. Isi jumlah lubang, lokasi, dan tanggal.',
        '4. Masukkan kedalaman untuk setiap lubang. Sistem akan menghitung rata-rata otomatis.',
        '5. Lihat ringkasan dan tekan Simpan.',
        '',
        'B. Flow Fragmentasi Batuan:',
        '1. Di halaman utama, tekan "Tambah" lalu pilih "Fragmentation".',
        '2. Isi Basic Info (Skala, Pilihan satuan, Ukuran, Lokasi, Tanggal).',
        '3. Isi Material (tipe batuan, amonium nitrat, volume blasting).',
        '4. Isi Powder Factor.',
        '5. Unggah foto (opsional).',
        '6. Lihat gambar yang diunggah, lalu Next.',
        '7. Lihat Graph Screen dan Simpan data. Setelah menyimpan, Anda dapat meninjau ringkasan di Riwayat.',
      ],
      isImportant: true,
    },
    {
      id: 'rock-fragmentation',
      title: 'Fragmentasi Batuan (Detail Flow)',
      icon: <Layers width={20} height={20} color="#047857" />,
      content: [
        'Langkah-langkah Fragmentasi Batuan:',
        '• Basic Info: tentukan skala, satuan, ukuran, lokasi, dan tanggal.',
        '• Material: masukkan tipe batuan, amonium nitrat, volume blasting.',
        '• Powder Factor: atur faktor bahan peledak sesuai kebutuhan.',
        '• Unggah Foto: tambahkan dokumentasi visual.',
        '• Graph Screen: tampilkan distribusi ukuran fragmen batuan.',
        '• Simpan: data akan disimpan dan dapat diakses di Riwayat.',
      ],
    },
    {
      id: 'depth-measurement',
      title: 'Pengukuran Kedalaman (Depth Average)',
      icon: <HelpCircle width={20} height={20} color="#047857" />,
      content: [
        'Langkah-langkah Pengukuran Kedalaman:',
        "1. Pilih 'Depth Average' dari halaman utama.",
        '2. Unggah gambar jika diinginkan.',
        '3. Masukkan jumlah lubang, lokasi, dan tanggal.',
        '4. Isi kedalaman setiap lubang. Sistem menghitung rata-rata otomatis.',
        '5. Tinjau ringkasan dan tekan Simpan.',
      ],
    },
    {
      id: 'graphs',
      title: 'Memahami Grafik (Fragmentasi)',
      icon: <BarChart2 width={20} height={20} color="#047857" />,
      content: [
        'Grafik menampilkan distribusi ukuran fragmen batuan:',
        '• Sumbu X: Ukuran partikel (misalnya mm atau μm).',
        '• Sumbu Y: Persentase kumulatif material yang lebih halus dari ukuran tersebut.',
        '• Kurva lebih curam = ukuran lebih seragam.',
        '• Nilai P20, P50, dan P80 menunjukkan ukuran di mana 20%, 50%, dan 80% material lebih halus.',
      ],
    },
    {
      id: 'photos',
      title: 'Menambahkan Foto',
      icon: <Camera width={20} height={20} color="#047857" />,
      content: [
        'Untuk menambahkan foto (umumnya pada Fragmentasi Batuan):',
        '1. Tekan tombol "+ Tambah Foto" atau gunakan form upload pada langkah yang sesuai.',
        '2. Pilih untuk mengambil foto baru atau dari galeri.',
        '3. Foto akan ditampilkan di kartu ringkasan dan disimpan dengan data.',
        '4. Anda dapat menambahkan beberapa foto untuk setiap pengukuran.',
      ],
    },
  ];

  // Updated FAQ sections remain the same for general usage
  const faqSections: HelpSection[] = [
    {
      id: 'faq-1',
      title: 'Bagaimana cara melihat riwayat pengukuran?',
      icon: <HelpCircle width={20} height={20} color="#047857" />,
      content: [
        'Untuk melihat riwayat pengukuran:',
        '1. Buka halaman utama aplikasi.',
        '2. Tekan tombol "Riwayat".',
        '3. Semua pengukuran sebelumnya akan ditampilkan dalam daftar.',
        '4. Tekan pada item untuk melihat detail lengkap.',
      ],
    },
    {
      id: 'faq-2',
      title: 'Apakah saya bisa mengekspor data?',
      icon: <HelpCircle width={20} height={20} color="#047857" />,
      content: [
        'Ya, Anda dapat mengekspor data pengukuran:',
        '1. Buka halaman detail pengukuran.',
        '2. Tekan tombol menu (tiga titik) di pojok kanan atas.',
        '3. Pilih "Ekspor Data".',
        '4. Pilih format ekspor (PDF, CSV, atau Excel).',
        '5. Data akan disimpan ke perangkat Anda.',
      ],
    },
    {
      id: 'faq-3',
      title: 'Bagaimana cara mengubah satuan pengukuran?',
      icon: <HelpCircle width={20} height={20} color="#047857" />,
      content: [
        'Untuk mengubah satuan pengukuran:',
        '1. Buka menu "Pengaturan" dari halaman utama.',
        '2. Pilih "Satuan Pengukuran".',
        '3. Pilih satuan yang diinginkan (cm, mm, inch).',
        '4. Semua pengukuran akan otomatis dikonversi ke satuan baru.',
      ],
    },
    {
      id: 'faq-4',
      title: 'Apakah aplikasi bisa digunakan offline?',
      icon: <HelpCircle width={20} height={20} color="#047857" />,
      content: [
        'Ya, aplikasi ini dapat digunakan dalam mode offline:',
        '• Semua fitur pengukuran dan analisis tersedia offline.',
        '• Data disimpan secara lokal di perangkat Anda.',
        '• Saat terhubung ke internet, data akan otomatis disinkronkan ke cloud.',
        '• Pastikan Anda telah login sebelum menggunakan mode offline untuk memastikan data dapat disinkronkan nanti.',
      ],
    },
    {
      id: 'faq-5',
      title: 'Bagaimana cara menghapus data?',
      icon: <AlertCircle width={20} height={20} color="#047857" />,
      content: [
        'Untuk menghapus data pengukuran:',
        '1. Buka halaman "Riwayat".',
        '2. Geser item ke kiri atau tekan lama pada item.',
        '3. Tekan tombol "Hapus".',
        '4. Konfirmasi penghapusan.',
        'Catatan: Data yang dihapus tidak dapat dipulihkan, pastikan Anda yakin sebelum menghapus.',
      ],
      isImportant: true,
    },
  ];

  const renderSections = (sections: HelpSection[]) => {
    return sections.map(section => (
      <View key={section.id} className="mb-3">
        <TouchableOpacity
          className={`bg-white rounded-xl p-4 shadow-sm border ${
            section.isImportant ? 'border-emerald-200' : 'border-gray-100'
          } flex-row items-center justify-between`}
          onPress={() => toggleSection(section.id)}
          activeOpacity={0.7}>
          <View className="flex-row items-center flex-1">
            <View
              className={`p-2 rounded-full ${
                section.isImportant ? 'bg-emerald-100' : 'bg-emerald-50'
              }`}>
              {section.icon}
            </View>
            <Text
              className={`font-semibold ml-3 flex-1 ${
                section.isImportant ? 'text-emerald-800' : 'text-gray-800'
              }`}>
              {section.title}
            </Text>
          </View>
          {isSectionExpanded(section.id) ? (
            <ChevronUp width={20} height={20} color="#4b5563" />
          ) : (
            <ChevronDown width={20} height={20} color="#4b5563" />
          )}
        </TouchableOpacity>

        {isSectionExpanded(section.id) && (
          <View className="bg-white px-4 pb-4 rounded-b-xl shadow-sm border-x border-b border-gray-100 -mt-1">
            {section.content.map((paragraph, idx) => (
              <Text key={idx} className="text-gray-600 mt-2 leading-6">
                {paragraph}
              </Text>
            ))}
          </View>
        )}
      </View>
    ));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="p-2 -ml-2"
              onPress={() => navigation.navigate('Homepage')}>
              <ArrowLeft width={24} height={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800 ml-2">
              Bantuan
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 flex-row justify-center items-center ${
            activeTab === 'panduan' ? 'border-b-2 border-emerald-600' : ''
          }`}
          onPress={() => setActiveTab('panduan')}>
          <BookOpen
            width={18}
            height={18}
            color={activeTab === 'panduan' ? '#047857' : '#6b7280'}
          />
          <Text
            className={`ml-2 font-medium ${
              activeTab === 'panduan' ? 'text-emerald-700' : 'text-gray-600'
            }`}>
            Panduan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 flex-row justify-center items-center ${
            activeTab === 'faq' ? 'border-b-2 border-emerald-600' : ''
          }`}
          onPress={() => setActiveTab('faq')}>
          <MessageCircle
            width={18}
            height={18}
            color={activeTab === 'faq' ? '#047857' : '#6b7280'}
          />
          <Text
            className={`ml-2 font-medium ${
              activeTab === 'faq' ? 'text-emerald-700' : 'text-gray-600'
            }`}>
            FAQ
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Introduction */}
        <View className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
          <View className="flex-row items-center mb-2">
            <HelpCircle width={24} height={24} color="#047857" />
            <Text className="text-lg font-bold text-emerald-800 ml-2">
              {activeTab === 'panduan'
                ? 'Panduan Penggunaan'
                : 'Pertanyaan Umum'}
            </Text>
          </View>
          <Text className="text-emerald-700">
            {activeTab === 'panduan'
              ? 'Temukan panduan dan informasi untuk membantu Anda menggunakan aplikasi dengan maksimal. Pilih topik di bawah untuk melihat detail lebih lanjut.'
              : 'Berikut adalah jawaban untuk pertanyaan yang sering diajukan. Jika Anda tidak menemukan jawaban yang Anda cari, silakan hubungi tim dukungan kami.'}
          </Text>
        </View>

        {/* Help Sections or FAQ based on active tab */}
        {activeTab === 'panduan'
          ? renderSections(helpSections)
          : renderSections(faqSections)}

        {/* Contact Support */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mt-3 mb-6">
          <View className="flex-row items-center mb-3">
            <Mail width={20} height={20} color="#047857" />
            <Text className="font-semibold text-gray-800 ml-2">
              Butuh Bantuan Lebih?
            </Text>
          </View>
          <TouchableOpacity
            className="bg-emerald-600 py-3 rounded-lg shadow-sm flex-row items-center justify-center"
            onPress={() => console.log('Contact support')}>
            <Text className="text-white font-medium">Hubungi Tim Dukungan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Help;
