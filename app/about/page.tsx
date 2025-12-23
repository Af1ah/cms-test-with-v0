import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About PosterGallery</h1>
            <p className="text-muted-foreground text-lg text-pretty">
              Discover the story behind our curated collection of poster art
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-4 text-primary">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We believe that great art should be accessible to everyone. Our mission is to showcase exceptional
                  poster designs from talented artists worldwide, making it easy for art lovers to discover and
                  appreciate beautiful visual storytelling.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-4 text-primary">Our Collection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  From vintage-inspired designs to contemporary digital art, our carefully curated collection spans
                  multiple styles and themes. Each poster is selected for its artistic merit, visual impact, and ability
                  to transform any space.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4 text-primary">Quality & Craftsmanship</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Every poster in our gallery represents hours of creative work and attention to detail. We work with
                artists who share our passion for quality design and visual excellence, ensuring that each piece meets
                our high standards for artistic integrity and visual appeal.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
