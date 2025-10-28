'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Users, 
  Award, 
  Target,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Lightbulb,
  TrendingUp,
  Sparkles,
  Zap,
  Heart,
  Shield,
  Globe,
  Rocket,
  Trophy,
  ChevronRight,
  Menu,
  X,
  Calendar
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [counters, setCounters] = useState({
    students: 0,
    teachers: 0,
    years: 0,
    graduation: 0,
    favorite: 0,
    ratio: 0,
    clubs: 0
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCounters({
        students: 500,
        teachers: 50,
        years: 15,
        graduation: 98,
        favorite: 85,
        ratio: 15,
        clubs: 20
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50' : 'bg-white/90 backdrop-blur-md border-b border-gray-200/30'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <GraduationCap className="h-10 w-10 text-primary transform transition-transform group-hover:rotate-12 duration-300" />
                <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">SMP ASH SOLIHIN</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              {['Beranda', 'Tentang', 'Program', 'Prestasi', 'Kontak'].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase()}`} 
                  className="text-sm font-medium text-gray-700 hover:text-primary transition-all duration-300 hover:scale-105 relative group"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </a>
              ))}
              <Button variant="outline" size="sm" className="border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300">
                <Link href="/auth/login" className="w-full h-full flex items-center justify-center">
                  Masuk
                </Link>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                Daftar Sekarang
                <Rocket className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="relative overflow-hidden pt-8 pb-12 md:pt-12 md:pb-16">
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-1">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200/50 backdrop-blur-sm">
                  <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                  <Badge className="bg-transparent text-primary border-0 font-medium">
                    Sekolah Unggulan Terpercaya
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-primary animate-bounce" />
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                    Membentuk Generasi
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                    Unggul & Berkarakter
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
                  SMP ASH SOLIHIN adalah lembaga pendidikan yang berkomitmen untuk mengembangkan potensi siswa melalui pembelajaran berkualitas, karakter yang kuat, dan lingkungan yang mendukung.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-base px-8 bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl group">
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" className="text-base px-8 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 group">
                  Jelajahi Program
                  <BookOpen className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8">
                {[
                  { value: counters.students, label: 'Siswa Aktif', suffix: '+', icon: Users },
                  { value: counters.teachers, label: 'Guru Profesional', suffix: '+', icon: Award },
                  { value: counters.years, label: 'Tahun Pengalaman', suffix: '+', icon: Trophy }
                ].map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className="relative">
                      <stat.icon className="h-8 w-8 text-primary/20 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        {stat.value}{stat.suffix}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500 animate-pulse"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl group-hover:shadow-3xl transition-all duration-500 transform group-hover:scale-105">
                <div className="bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/20">
                  <div className="aspect-square bg-gradient-to-br from-primary via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    <GraduationCap className="h-32 w-32 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 right-4">
                      <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <Zap className="h-6 w-6 text-yellow-300 animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-indigo-50/50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200/50 backdrop-blur-sm mb-6">
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
              <Badge className="bg-transparent text-primary border-0 font-medium">
                Tentang Kami
              </Badge>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Mengenal SMP ASH SOLIHIN
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Kami adalah sekolah yang berdedikasi untuk memberikan pendidikan berkualitas tinggi dengan fokus pada pengembangan akademik, karakter, dan keterampilan hidup siswa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Visi',
                description: 'Menjadi sekolah unggulan yang menghasilkan lulusan berkualitas, berkarakter mulia, dan siap menghadapi tantangan global.',
                gradient: 'from-blue-500 to-cyan-500',
                delay: 'delay-100'
              },
              {
                icon: Lightbulb,
                title: 'Misi',
                description: 'Menyelenggarakan pembelajaran inovatif, mengembangkan potensi siswa, dan membangun karakter yang kuat berdasarkan nilai-nilai keagamaan.',
                gradient: 'from-purple-500 to-pink-500',
                delay: 'delay-200'
              },
              {
                icon: Shield,
                title: 'Nilai',
                description: 'Integritas, disiplin, inovasi, tanggung jawab, dan keunggulan dalam setiap aspek pendidikan.',
                gradient: 'from-green-500 to-emerald-500',
                delay: 'delay-300'
              }
            ].map((item, index) => (
              <Card key={index} className={`group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/80 backdrop-blur-sm ${item.delay}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative p-8 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="program" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-l from-indigo-50/50 via-transparent to-blue-50/50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-2 rounded-full border border-indigo-200/50 backdrop-blur-sm mb-6">
              <Rocket className="h-4 w-4 text-indigo-500 animate-pulse" />
              <Badge className="bg-transparent text-primary border-0 font-medium">
                Program Unggulan
              </Badge>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Program Kami
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Program-program kami dirancang untuk mengembangkan potensi siswa secara maksimal dengan pendekatan modern dan inovatif.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Akademik Unggulan',
                description: 'Kurikulum komprehensif dengan fokus pada STEM dan pengembangan bahasa.',
                gradient: 'from-blue-500 to-indigo-500',
                features: ['STEM', 'Bilingual', 'Digital Learning']
              },
              {
                icon: Users,
                title: 'Ekstrakurikuler',
                description: 'Berbagai kegiatan untuk mengembangkan bakat dan minat siswa.',
                gradient: 'from-purple-500 to-pink-500',
                features: ['Olahraga', 'Seni', 'Sains']
              },
              {
                icon: TrendingUp,
                title: 'Bimbingan Karir',
                description: 'Persiapan melanjutkan pendidikan ke jenjang yang lebih tinggi.',
                gradient: 'from-green-500 to-emerald-500',
                features: ['Konseling', 'Workshop', 'Mentoring']
              },
              {
                icon: Award,
                title: 'Pengembangan Karakter',
                description: 'Pembentukan karakter yang kuat melalui berbagai program.',
                gradient: 'from-orange-500 to-red-500',
                features: ['Leadership', 'Character Building', 'Social Skills']
              }
            ].map((program, index) => (
              <Card key={index} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 bg-white/90 backdrop-blur-sm">
                <div className={`absolute inset-0 bg-gradient-to-br ${program.gradient}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative p-6">
                  <div className={`w-16 h-16 bg-gradient-to-br ${program.gradient} rounded-2xl flex items-center justify-center mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <program.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {program.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {program.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {program.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 hover:bg-gray-200 transition-colors">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-50/50 to-indigo-50/50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-blue-50 px-4 py-2 rounded-full border border-primary/20 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
                <Badge className="bg-transparent text-primary border-0 font-medium">
                  Mengapa Memilih Kami
                </Badge>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Mengapa Memilih
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SMP ASH SOLIHIN?
                </span>
              </h2>
              <div className="space-y-6">
                {[
                  {
                    icon: CheckCircle,
                    title: 'Guru Profesional',
                    description: 'Tenaga pendidik berpengalaman dan bersertifikat dengan passion mengajar yang tinggi.',
                    gradient: 'from-green-500 to-emerald-500'
                  },
                  {
                    icon: CheckCircle,
                    title: 'Fasilitas Lengkap',
                    description: 'Lab komputer, perpustakaan, dan ruang olahraga modern dengan teknologi terkini.',
                    gradient: 'from-blue-500 to-indigo-500'
                  },
                  {
                    icon: CheckCircle,
                    title: 'Lingkungan Aman',
                    description: 'Kawasan sekolah yang aman dan nyaman untuk belajar dan berkembang.',
                    gradient: 'from-purple-500 to-pink-500'
                  },
                  {
                    icon: CheckCircle,
                    title: 'Teknologi Pembelajaran',
                    description: 'Integrasi teknologi dalam proses pembelajaran untuk hasil yang lebih optimal.',
                    gradient: 'from-orange-500 to-red-500'
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center flex-shrink-0 transform group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {feature.title}
                      </h4>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {[
                { value: counters.graduation, label: 'Tingkat Kelulusan', suffix: '%', icon: Trophy, gradient: 'from-green-500 to-emerald-500' },
                { value: counters.favorite, label: 'Diterima di SMA Favorit', suffix: '%', icon: Award, gradient: 'from-blue-500 to-indigo-500' },
                { value: `1:${counters.ratio}`, label: 'Rasio Guru:Siswa', suffix: '', icon: Users, gradient: 'from-purple-500 to-pink-500' },
                { value: counters.clubs, label: 'Klub Ekstrakurikuler', suffix: '+', icon: Target, gradient: 'from-orange-500 to-red-500' }
              ].map((stat, index) => (
                <Card key={index} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-white/90 backdrop-blur-sm">
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative p-6 text-center">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="prestasi" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50/50 via-transparent to-pink-50/50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-full border border-purple-200/50 backdrop-blur-sm mb-6">
              <Star className="h-4 w-4 text-yellow-500 animate-pulse" />
              <Badge className="bg-transparent text-primary border-0 font-medium">
                Testimoni
              </Badge>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Apa Kata Mereka
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Testimoni dari orang tua dan alumni kami tentang pengalaman di SMP ASH SOLIHIN
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Budi Santoso',
                role: 'Orang Tua Siswa',
                content: 'Anak saya sangat berkembang di SMP ASH SOLIHIN. Tidak hanya akademiknya yang bagus, karakternya juga menjadi lebih baik. Guru-guru sangat perhatian dan profesional.',
                rating: 5,
                gradient: 'from-blue-500 to-indigo-500',
                delay: 'delay-100'
              },
              {
                name: 'Siti Nurhaliza',
                role: 'Alumni 2023',
                content: 'Bekal dari SMP ASH SOLIHIN sangat membantu saya di SMA. Metode pembelajarannya sangat efektif dan saya merasa siap menghadapi tantangan lebih tinggi.',
                rating: 5,
                gradient: 'from-purple-500 to-pink-500',
                delay: 'delay-200'
              },
              {
                name: 'Ahmad Wijaya',
                role: 'Orang Tua Siswa',
                content: 'Guru-guru di sini sangat perhatian dan profesional. Anak saya merasa nyaman dan termotivasi untuk belajar. Lingkungan sekolah yang sangat mendukung.',
                rating: 5,
                gradient: 'from-green-500 to-emerald-500',
                delay: 'delay-300'
              }
            ].map((testimonial, index) => (
              <Card key={index} className={`group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 bg-white/90 backdrop-blur-sm ${testimonial.delay}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="relative p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontak" className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-full border border-blue-200/50 backdrop-blur-sm mb-6">
              <Mail className="h-4 w-4 text-blue-500 animate-pulse" />
              <Badge className="bg-transparent text-primary border-0 font-medium">
                Hubungi Kami
              </Badge>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Mari Berdiskusi
              </span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Tentang pendidikan terbaik untuk anak Anda. Kami siap membantu menjawab semua pertanyaan Anda.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <Card className="p-8 border-0 shadow-2xl bg-white/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Kirim Pesan
                  </h3>
                </div>
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Nama Lengkap</label>
                      <Input 
                        placeholder="Masukkan nama lengkap" 
                        className="border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
                      <Input 
                        type="email" 
                        placeholder="Masukkan email" 
                        className="border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">No. Telepon</label>
                    <Input 
                      placeholder="Masukkan nomor telepon" 
                      className="border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Pesan</label>
                    <Textarea 
                      placeholder="Tulis pesan Anda" 
                      rows={4} 
                      className="border-gray-200 focus:border-primary focus:ring-primary/20 transition-all duration-300 resize-none"
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group">
                    Kirim Pesan
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-500">
                <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Informasi Kontak
                </h3>
                <div className="space-y-6">
                  {[
                    {
                      icon: MapPin,
                      title: 'Alamat',
                      content: 'Jl. Pendidikan No. 123, Jakarta Selatan',
                      gradient: 'from-red-500 to-pink-500'
                    },
                    {
                      icon: Phone,
                      title: 'Telepon',
                      content: '(021) 1234-5678',
                      gradient: 'from-green-500 to-emerald-500'
                    },
                    {
                      icon: Mail,
                      title: 'Email',
                      content: 'info@smpashsolihin.sch.id',
                      gradient: 'from-blue-500 to-indigo-500'
                    },
                    {
                      icon: Clock,
                      title: 'Jam Operasional',
                      content: 'Senin - Jumat: 07:00 - 15:00\nSabtu: 07:00 - 12:00',
                      gradient: 'from-purple-500 to-pink-500'
                    }
                  ].map((info, index) => (
                    <div key={index} className="flex items-start space-x-4 group">
                      <div className={`w-12 h-12 bg-gradient-to-br ${info.gradient} rounded-xl flex items-center justify-center flex-shrink-0 transform group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                        <info.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">
                          {info.title}
                        </div>
                        <div className="text-gray-600 whitespace-pre-line">
                          {info.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 border-0 shadow-xl bg-gradient-to-br from-primary to-blue-600 text-white hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-4">
                  <Globe className="h-8 w-8 text-yellow-300 animate-pulse" />
                  <h3 className="text-2xl font-bold">
                    Kunjungi Kami
                  </h3>
                </div>
                <p className="mb-6 text-white/90 leading-relaxed">
                  Datang langsung ke sekolah untuk melihat fasilitas dan berdiskusi dengan tim kami.
                </p>
                <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-300 transform hover:scale-105">
                  Jadwalkan Kunjungan
                  <Calendar className="ml-2 h-5 w-5" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-indigo-600/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group">
                <div className="relative">
                  <GraduationCap className="h-10 w-10 text-primary transform transition-transform group-hover:rotate-12 duration-300" />
                  <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">SMP ASH SOLIHIN</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Membentuk generasi unggul dan berkarakter untuk masa depan yang lebih baik.
              </p>
              <div className="flex space-x-3">
                {[
                  { icon: Globe, label: 'Facebook' },
                  { icon: Users, label: 'Instagram' },
                  { icon: Mail, label: 'YouTube' }
                ].map((social, index) => (
                  <Button key={index} variant="outline" size="sm" className="text-gray-400 border-gray-700 hover:bg-primary/20 hover:border-primary hover:text-primary transition-all duration-300 transform hover:scale-110">
                    <social.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Tautan Cepat</h4>
              <ul className="space-y-3">
                {['Beranda', 'Tentang', 'Program', 'Prestasi'].map((item) => (
                  <li key={item}>
                    <a 
                      href={`#${item.toLowerCase()}`} 
                      className="text-gray-400 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-flex items-center group"
                    >
                      <ChevronRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Layanan</h4>
              <ul className="space-y-3">
                {['Pendaftaran Online', 'Portal Siswa', 'Portal Orang Tua', 'Karir'].map((item) => (
                  <li key={item}>
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-primary transition-all duration-300 hover:translate-x-1 inline-flex items-center group"
                    >
                      <ChevronRight className="h-4 w-4 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Newsletter</h4>
              <p className="text-gray-400 text-sm">
                Dapatkan informasi terbaru tentang program dan kegiatan sekolah.
              </p>
              <div className="flex space-x-2">
                <Input 
                  placeholder="Email Anda" 
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-primary focus:ring-primary/20"
                />
                <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 transform hover:scale-105">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700 mb-8" />

          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 SMP ASH SOLIHIN. Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center space-x-6 text-gray-400 text-sm">
              <a href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</a>
              <a href="#" className="hover:text-primary transition-colors">FAQ</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
        .delay-1000 { animation-delay: 1000ms; }
      `}</style>
    </div>
  );
}