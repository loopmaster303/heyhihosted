"use client";
import NewAppHeader from '@/components/page/NewAppHeader';
import type { TileItem } from '@/types';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { useLanguage } from '@/components/LanguageProvider';
import { AVAILABLE_POLLINATIONS_MODELS } from '@/config/chat-options';
import { modelConfigs } from '@/config/replicate-models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sparkles, MessageSquare, Code, Image, Settings, Zap, Eye, Brain, Palette, Camera, Video, Layers } from 'lucide-react';

const toolTileItems: TileItem[] = [
    { id: 'long language loops', title: '</chat.talk.discuss>', href: '/chat' },
    { id: 'code reasoning', title: '</code.reasoning>', href: '/reasoning' },
    { id: 'nocost imagination', title: '</generate.visuals.lite>', href: '/image-gen/no-cost' },
    { id: 'premium imagination', title: '</generate.visuals.raw>', href: '/image-gen/raw' },
    { id: 'personalization', title: '</settings.user.preferences>', href: '/settings' },
    { id: 'about', title: '</about.system.readme>', href: '/about' },
];

export default function AboutPage() {
  const [userDisplayName] = useLocalStorageState<string>("userDisplayName", "john");
  const { language } = useLanguage();

  const isGerman = language === 'de';

  return (
    <div className="relative flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
        <NewAppHeader toolTileItems={toolTileItems} userDisplayName={userDisplayName || 'john'} />
        
        <main className="flex flex-col flex-grow pt-16">
          {/* Hero Section */}
          <section className="container mx-auto px-4 py-12 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                hey-hi.space
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {isGerman 
                  ? "Deine kreative KI-Werkzeugplattform | Your Creative AI Tools Hub"
                  : "Your Creative AI Tools Hub | Deine kreative KI-Werkzeugplattform"
                }
              </p>
              <p className="text-lg leading-relaxed max-w-3xl mx-auto">
                {isGerman 
                  ? "Entdecke die Zukunft der kreativen KI-Tools. Von Bildgenerierung bis hin zu intelligenten Gesprächen – hey-hi.space bringt die besten KI-Modelle an einem Ort zusammen."
                  : "Discover the future of creative AI tools. From image generation to intelligent conversations – hey-hi.space brings the best AI models together in one place."
                }
              </p>
            </div>
          </section>

          {/* Tools Overview */}
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isGerman ? "🛠️ Unsere Tools & Modelle" : "🛠️ Our Tools & Models"}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {/* Chat Tool */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    {isGerman ? "Chat Tool" : "Chat Tool"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman 
                      ? "Intelligente Gespräche mit KI-Modellen"
                      : "Intelligent conversations with AI models"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">18 KI-Modelle</Badge>
                      <Badge variant="secondary">{isGerman ? "Bild-Upload" : "Image Upload"}</Badge>
                      <Badge variant="secondary">{isGerman ? "5 Response-Styles" : "5 Response Styles"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isGerman 
                        ? "Von GPT-5 bis zu spezialisierten Modellen wie BIDARA (NASA) und DeepSeek R1"
                        : "From GPT-5 to specialized models like BIDARA (NASA) and DeepSeek R1"
                      }
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/chat">
                        {isGerman ? "Jetzt chatten" : "Start Chatting"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Image Generation Lite */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    {isGerman ? "Image Gen Lite" : "Image Gen Lite"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman 
                      ? "Kostenlose Bildgenerierung für jeden"
                      : "Free image generation for everyone"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">🆓 {isGerman ? "Kostenlos" : "Free"}</Badge>
                      <Badge variant="secondary">⚡ {isGerman ? "Schnell" : "Fast"}</Badge>
                      <Badge variant="secondary">🎯 {isGerman ? "Einfach" : "Simple"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isGerman 
                        ? "WAN 2.2, Flux, Turbo und mehr - keine Credits oder Limits"
                        : "WAN 2.2, Flux, Turbo and more - no credits or limits"
                      }
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/image-gen/no-cost">
                        {isGerman ? "Jetzt generieren" : "Start Generating"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Image Generation Expert */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    {isGerman ? "Image Gen Expert" : "Image Gen Expert"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman 
                      ? "Professionelle Bildgenerierung mit erweiterten Features"
                      : "Professional image generation with advanced features"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">🎨 {isGerman ? "18+ Modelle" : "18+ Models"}</Badge>
                      <Badge variant="secondary">🔧 {isGerman ? "Erweiterte Parameter" : "Advanced Parameters"}</Badge>
                      <Badge variant="secondary">🖼️ {isGerman ? "Reference Images" : "Reference Images"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isGerman 
                        ? "Flux-Kontext, Runway Gen-4, Imagen 4 Ultra und mehr"
                        : "Flux-Kontext, Runway Gen-4, Imagen 4 Ultra and more"
                      }
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/image-gen/raw">
                        {isGerman ? "Expert-Modus" : "Expert Mode"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Code Reasoning */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    {isGerman ? "Code Reasoning" : "Code Reasoning"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman 
                      ? "KI-gestützte Programmierhilfe"
                      : "AI-powered programming assistance"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">🔍 {isGerman ? "Code-Analyse" : "Code Analysis"}</Badge>
                      <Badge variant="secondary">🐛 {isGerman ? "Debugging" : "Debugging"}</Badge>
                      <Badge variant="secondary">📚 {isGerman ? "Erklärungen" : "Explanations"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isGerman 
                        ? "Verstehe komplexen Code und lerne beim Programmieren"
                        : "Understand complex code and learn while programming"
                      }
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/reasoning">
                        {isGerman ? "Code analysieren" : "Analyze Code"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    {isGerman ? "Einstellungen" : "Settings"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman 
                      ? "Personalisierung und Konfiguration"
                      : "Personalization and configuration"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">👤 {isGerman ? "Benutzername" : "Username"}</Badge>
                      <Badge variant="secondary">🎭 {isGerman ? "Response-Style" : "Response Style"}</Badge>
                      <Badge variant="secondary">🌍 {isGerman ? "Sprache" : "Language"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isGerman 
                        ? "Passe die KI an deinen Stil und deine Bedürfnisse an"
                        : "Customize the AI to match your style and needs"
                      }
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/settings">
                        {isGerman ? "Anpassen" : "Customize"} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* AI Models Section */}
          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isGerman ? "🧠 Verfügbare KI-Modelle" : "🧠 Available AI Models"}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {AVAILABLE_POLLINATIONS_MODELS.slice(0, 9).map((model) => (
                <Card key={model.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      {model.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {model.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {model.vision && <Badge variant="outline">👁️ {isGerman ? "Vision" : "Vision"}</Badge>}
                      {model.webBrowsing && <Badge variant="outline">🌐 {isGerman ? "Web Browsing" : "Web Browsing"}</Badge>}
                      {model.id.includes('reasoning') && <Badge variant="outline">🧠 {isGerman ? "Reasoning" : "Reasoning"}</Badge>}
                      {model.id.includes('audio') && <Badge variant="outline">🎵 {isGerman ? "Audio" : "Audio"}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button asChild variant="outline">
                <Link href="/chat">
                  {isGerman ? "Alle Modelle im Chat ausprobieren" : "Try all models in chat"} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          {/* Image Models Section */}
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isGerman ? "🎨 Bildgenerierungs-Modelle" : "🎨 Image Generation Models"}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.entries(modelConfigs).slice(0, 9).map(([key, model]) => (
                <Card key={key} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {model.outputType === 'video' ? (
                        <Video className="h-4 w-4 text-primary" />
                      ) : (
                        <Image className="h-4 w-4 text-primary" />
                      )}
                      {model.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {model.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">
                        {model.outputType === 'video' ? '🎬 Video' : '🖼️ Image'}
                      </Badge>
                      {model.hasCharacterReference && (
                        <Badge variant="outline">👤 {isGerman ? "Character Reference" : "Character Reference"}</Badge>
                      )}
                      {key.includes('wan') && <Badge variant="outline">⚡ {isGerman ? "Schnell" : "Fast"}</Badge>}
                      {key.includes('flux') && <Badge variant="outline">🎨 {isGerman ? "Hochwertig" : "High Quality"}</Badge>}
                      {key.includes('imagen') && <Badge variant="outline">📸 {isGerman ? "Fotorealistisch" : "Photorealistic"}</Badge>}
                      {key.includes('nano-banana') && <Badge variant="outline">📷 {isGerman ? "Bilder hinzufügen" : "Add Images"}</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center">
              <Button asChild variant="outline">
                <Link href="/image-gen/raw">
                  {isGerman ? "Alle Modelle ausprobieren" : "Try all models"} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          {/* Response Styles Section */}
          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isGerman ? "🎭 Response Styles" : "🎭 Response Styles"}
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {isGerman ? "Basic" : "Basic"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman ? "Dein hilfreicher Buddy" : "Your helpful buddy"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isGerman 
                      ? "Freundlich, direkt, auf Augenhöhe. Perfekt für alltägliche Fragen und kreative Projekte."
                      : "Friendly, direct, on equal terms. Perfect for everyday questions and creative projects."
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    {isGerman ? "Precise" : "Precise"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman ? "Fakten zuerst" : "Facts first"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isGerman 
                      ? "Kurz, klar, kompetent. Ideal wenn du schnelle, präzise Antworten brauchst."
                      : "Short, clear, competent. Ideal when you need quick, precise answers."
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    {isGerman ? "Deep Dive" : "Deep Dive"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman ? "Analytisch und gründlich" : "Analytical and thorough"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isGerman 
                      ? "Ausführliche Erklärungen mit Hintergrundwissen. Perfekt für komplexe Themen."
                      : "Detailed explanations with background knowledge. Perfect for complex topics."
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {isGerman ? "Emotional Support" : "Emotional Support"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman ? "Empathisch und unterstützend" : "Empathetic and supportive"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isGerman 
                      ? "Warmherzig und verständnisvoll. Ideal für persönliche Gespräche und Motivation."
                      : "Warm-hearted and understanding. Ideal for personal conversations and motivation."
                    }
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-primary" />
                    {isGerman ? "Philosophical" : "Philosophical"}
                  </CardTitle>
                  <CardDescription>
                    {isGerman ? "Denkhorizonte erweitern" : "Expand thinking horizons"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isGerman 
                      ? "Tiefgreifende Diskussionen über komplexe Themen. Für die großen Fragen des Lebens."
                      : "Deep discussions about complex topics. For life's big questions."
                    }
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Why hey-hi.space Section */}
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isGerman ? "🎯 Warum hey-hi.space?" : "🎯 Why hey-hi.space?"}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {isGerman ? "Benutzerfreundlich" : "User-Friendly"}
                </h3>
                <p className="text-muted-foreground">
                  {isGerman 
                    ? "Intuitive Oberfläche ohne technische Hürden. Klare Anleitungen für jedes Tool."
                    : "Intuitive interface without technical barriers. Clear instructions for every tool."
                  }
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {isGerman ? "Vielseitig" : "Versatile"}
                </h3>
                <p className="text-muted-foreground">
                  {isGerman 
                    ? "Von kostenlosen Tools bis zu Premium-Features. Verschiedene KI-Modelle für verschiedene Bedürfnisse."
                    : "From free tools to premium features. Different AI models for different needs."
                  }
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {isGerman ? "Innovativ" : "Innovative"}
                </h3>
                <p className="text-muted-foreground">
                  {isGerman 
                    ? "Immer die neuesten KI-Modelle. Regelmäßige Updates und neue Features."
                    : "Always the latest AI models. Regular updates and new features."
                  }
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-12 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">
                {isGerman ? "🚀 Los geht's!" : "🚀 Let's Get Started!"}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {isGerman 
                  ? "Bereit für deine kreative Reise? Starte kostenlos und entdecke die Möglichkeiten der KI."
                  : "Ready for your creative journey? Start for free and discover the possibilities of AI."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/image-gen/no-cost">
                    {isGerman ? "🆓 Kostenlos starten" : "🆓 Start Free"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/chat">
                    {isGerman ? "💬 Mit KI chatten" : "💬 Chat with AI"} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Privacy Policy Section */}
          <section className="container mx-auto px-4 py-12 bg-muted/30">
            <h2 className="text-3xl font-bold text-center mb-12">
              {isGerman ? "🔒 Datenschutzerklärung" : "🔒 Privacy Policy"}
            </h2>
            
            <div className="max-w-4xl mx-auto prose prose-sm dark:prose-invert">
              {isGerman ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">1. Verantwortlicher</h3>
                    <p className="text-muted-foreground">
                      Verantwortlicher für die Datenverarbeitung auf dieser Website ist hey-hi.space. 
                      Bei Fragen zum Datenschutz können Sie uns über die Kontaktfunktion erreichen.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">2. Erhebung und Verwendung von Daten</h3>
                    <p className="text-muted-foreground mb-3">
                      Wir erheben und verarbeiten folgende Daten:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                      <li><strong>Lokale Speicherung:</strong> Ihre Einstellungen (Sprache, Theme, Benutzername) werden ausschließlich lokal in Ihrem Browser gespeichert</li>
                      <li><strong>KI-Interaktionen:</strong> Ihre Prompts und generierten Inhalte werden temporär verarbeitet, aber nicht dauerhaft gespeichert</li>
                      <li><strong>Bild-Uploads:</strong> Hochgeladene Bilder werden nur für die Verarbeitung verwendet und nicht gespeichert</li>
                      <li><strong>Technische Daten:</strong> IP-Adresse und Browser-Informationen für technische Funktionalität</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">3. Rechtsgrundlage (DSGVO Art. 6)</h3>
                    <p className="text-muted-foreground">
                      Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) 
                      zur Bereitstellung der KI-Services und Verbesserung der Benutzererfahrung.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">4. Datenweitergabe</h3>
                    <p className="text-muted-foreground">
                      Wir geben Ihre Daten nicht an Dritte weiter, außer an unsere KI-Service-Provider (OpenAI, Google, etc.) 
                      zur Verarbeitung Ihrer Anfragen. Diese Provider haben eigene Datenschutzbestimmungen.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">5. Ihre Rechte</h3>
                    <p className="text-muted-foreground mb-3">
                      Sie haben folgende Rechte nach der DSGVO:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Auskunft über verarbeitete Daten (Art. 15 DSGVO)</li>
                      <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
                      <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
                      <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                      <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                      <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">6. Datensicherheit</h3>
                    <p className="text-muted-foreground">
                      Wir verwenden moderne Sicherheitsmaßnahmen zum Schutz Ihrer Daten. 
                      Die Kommunikation erfolgt über verschlüsselte Verbindungen (HTTPS).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">7. Cookies und lokale Speicherung</h3>
                    <p className="text-muted-foreground">
                      Wir verwenden lokalen Browser-Speicher für Ihre Einstellungen. 
                      Dies können Sie jederzeit über Ihre Browser-Einstellungen löschen.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">8. Kontakt</h3>
                    <p className="text-muted-foreground">
                      Bei Fragen zum Datenschutz kontaktieren Sie uns über die Support-Funktion auf dieser Website.
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground/70 pt-4 border-t">
                    <p>Stand: {new Date().toLocaleDateString('de-DE')} | Diese Datenschutzerklärung entspricht den Anforderungen der DSGVO.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">1. Data Controller</h3>
                    <p className="text-muted-foreground">
                      The data controller for this website is hey-hi.space. 
                      For questions about data protection, you can contact us via the contact function.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">2. Data Collection and Use</h3>
                    <p className="text-muted-foreground mb-3">
                      We collect and process the following data:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                      <li><strong>Local Storage:</strong> Your settings (language, theme, username) are stored exclusively locally in your browser</li>
                      <li><strong>AI Interactions:</strong> Your prompts and generated content are processed temporarily but not permanently stored</li>
                      <li><strong>Image Uploads:</strong> Uploaded images are only used for processing and are not stored</li>
                      <li><strong>Technical Data:</strong> IP address and browser information for technical functionality</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">3. Legal Basis (GDPR Art. 6)</h3>
                    <p className="text-muted-foreground">
                      Processing is based on Art. 6 para. 1 lit. f GDPR (legitimate interest) 
                      to provide AI services and improve user experience.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">4. Data Sharing</h3>
                    <p className="text-muted-foreground">
                      We do not share your data with third parties, except with our AI service providers (OpenAI, Google, etc.) 
                      to process your requests. These providers have their own privacy policies.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">5. Your Rights</h3>
                    <p className="text-muted-foreground mb-3">
                      You have the following rights under GDPR:
                    </p>
                    <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                      <li>Access to processed data (Art. 15 GDPR)</li>
                      <li>Rectification of incorrect data (Art. 16 GDPR)</li>
                      <li>Erasure of your data (Art. 17 GDPR)</li>
                      <li>Restriction of processing (Art. 18 GDPR)</li>
                      <li>Data portability (Art. 20 GDPR)</li>
                      <li>Objection to processing (Art. 21 GDPR)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">6. Data Security</h3>
                    <p className="text-muted-foreground">
                      We use modern security measures to protect your data. 
                      Communication takes place over encrypted connections (HTTPS).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">7. Cookies and Local Storage</h3>
                    <p className="text-muted-foreground">
                      We use local browser storage for your settings. 
                      You can delete this at any time through your browser settings.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">8. Contact</h3>
                    <p className="text-muted-foreground">
                      For questions about data protection, contact us via the support function on this website.
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground/70 pt-4 border-t">
                    <p>As of: {new Date().toLocaleDateString('en-US')} | This privacy policy complies with GDPR requirements.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Footer */}
          <footer className="container mx-auto px-4 py-8 border-t">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-semibold mb-2">
                hey-hi.space
              </p>
              <p className="text-sm">
                {isGerman 
                  ? "Wo Kreativität auf KI trifft | Where Creativity Meets AI"
                  : "Where Creativity Meets AI | Wo Kreativität auf KI trifft"
                }
              </p>
            </div>
          </footer>
        </main>
    </div>
  );
}
