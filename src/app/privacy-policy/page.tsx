export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Isikuandmete töötlemise eeskiri
            </h1>
            <p className="text-lg text-gray-600">
              Vajangu Perefarm OÜ
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Üldsätted</h2>
            <p className="text-gray-700 mb-6">
              Vajangu Perefarm OÜ (edaspidi "Ettevõte") kaitseb teie isikuandmeid ja järgib isikuandmete kaitse seadust. 
              See eeskiri selgitab, kuidas me kogume, kasutame ja kaitstame teie isikuandmeid.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Kogutavad andmed</h2>
            <p className="text-gray-700 mb-4">Me kogume järgmist tüüpi isikuandmeid:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Nimi ja kontaktandmed (e-posti aadress, telefoninumber)</li>
              <li>Ettevõtte andmed (vajadusel)</li>
              <li>Tellimuse andmed ja eelistused</li>
              <li>Kommunikatsiooni ajalugu</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Andmete kasutamine</h2>
            <p className="text-gray-700 mb-4">Teie isikuandmeid kasutame järgmistel eesmärkidel:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Tellimuste töötlemiseks ja täitmiseks</li>
              <li>Klienditeeninduse osutamiseks</li>
              <li>Teie nõusolekul - turundustegevuseks</li>
              <li>Seaduslike kohustuste täitmiseks</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Andmete jagamine</h2>
            <p className="text-gray-700 mb-6">
              Me ei jaga teie isikuandmeid kolmandate osapooltega, välja arvatud juhul, kui see on vajalik 
              teenuse osutamiseks või seadusega ette nähtud.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Teie õigused</h2>
            <p className="text-gray-700 mb-4">Teil on õigus:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Juurdepääs oma isikuandmetele</li>
              <li>Andmete parandamisele</li>
              <li>Andmete kustutamisele</li>
              <li>Andmete töötlemise piiritlemisele</li>
              <li>Andmete portatiivsusele</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Kontakt</h2>
            <p className="text-gray-700 mb-4">
              Kui teil on küsimusi selle eeskirja kohta või soovite kasutada oma õigusi, 
              võtke meiega ühendust:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>E-post:</strong> info@perefarm.ee</p>
              <p className="text-gray-700"><strong>Telefon:</strong> +372 XXX XXXX</p>
              <p className="text-gray-700"><strong>Aadress:</strong> [Ettevõtte aadress]</p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Viimati uuendatud: {new Date().toLocaleDateString('et-EE')}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a 
              href="/order" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Tagasi tellimisele
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
