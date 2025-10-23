import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            🐷 Vajangu Perefarm
          </h1>
          <p className="text-xl text-gray-700 mb-8">
            Kõrgekvaliteediline kodumaine sealiha otse tootjalt
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Telli oma sealiha
            </h2>
            <p className="text-lg text-gray-600 mb-8 text-center">
              Vali sobiv ring ja telli värske, kvaliteetne sealiha otse Vajangu Perefarmilt. 
              Pakume kohalikku, looduslikku toodetud sealiha erinevate ringide kaudu.
            </p>
            
            <div className="text-center">
              <Link 
                href="/order"
                className="inline-block bg-orange-600 text-white px-8 py-4 rounded-lg text-xl font-semibold hover:bg-orange-700 transition-colors shadow-lg"
              >
                Alusta tellimist →
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl mb-4">🚚</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Kohalik tarne</h3>
              <p className="text-gray-600">
                Toome teie tellimuse otse kohale valitud ringide kaudu
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Looduslik tootmine</h3>
              <p className="text-gray-600">
                Kasvatame sead looduslikult, ilma liigsete kemikaalideta
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Kõrge kvaliteet</h3>
              <p className="text-gray-600">
                Pakume ainult parimat kvaliteeti ja värskust
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-gray-100 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Kontakt</h3>
            <div className="space-y-2 text-gray-600">
              <p>📧 info@perefarm.ee</p>
              <p>📞 +372 5555 1234</p>
              <p>📍 Vajangu Perefarm OÜ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}