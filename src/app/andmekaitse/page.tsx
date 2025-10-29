export default function AndmekaitsePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Privaatsusteade ja andmekaitsetingimused
          </h1>

          <div className="prose prose-lg max-w-none">
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Vastutav töötleja:</strong>
              </p>
              <p className="text-gray-700 mb-1">
                Vajangu Perefarm OÜ<br />
                Lääne-Viru maakond, Tapa vald, Vajangu küla, Rammo tee 3, 46002<br />
                E-post: <a href="mailto:vajanguperefarm@gmail.com" className="text-blue-600 hover:text-blue-800 underline">vajanguperefarm@gmail.com</a><br />
                Telefon: <a href="tel:+37253586772" className="text-blue-600 hover:text-blue-800 underline">+372 5358 6772</a>
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Töötlemise eesmärgid</h2>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Tellimuste vastuvõtmine ja täitmine</li>
              <li>E-arve või e-kviitungi väljastamine</li>
              <li>Kliendisuhtluse ja kohaletoimetuse korraldamine</li>
              <li>Tagasiside kogumine ja teenuse parendamine</li>
              <li>Infokirjade ja personaalsed pakkumised (ainult nõusoleku alusel)</li>
              <li>Ebavajalike või defektsete toodete tagasikutsumine</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Töödeldavad andmed</h2>
            <p className="text-gray-700 mb-6">
              Ees- ja perekonnanimi, telefoninumber, e-posti aadress, tarneaadress või peatus, kliendinumber, tellimuse ja makseandmed.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Andmete jagamine</h2>
            <p className="text-gray-700 mb-6">
              Andmeid võivad töödelda ainult Vajangu Perefarm OÜ töötajad ja volitatud koostööpartnerid (nt raamatupidaja, kuller, makselahenduse pakkuja) tellimuse täitmiseks. Andmeid ei edastata kolmandatele isikutele turunduse eesmärgil ilma kliendi nõusolekuta.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Säilitamise aeg</h2>
            <p className="text-gray-700 mb-6">
              Isikuandmeid säilitatakse kuni 3 aastat pärast viimast tellimust või kuni nõusoleku tagasivõtmiseni. Raamatupidamise dokumente säilitatakse seadusest tulenevalt 7 aastat.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">Andmesubjekti õigused</h2>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Õigus tutvuda oma andmetega</li>
              <li>Õigus andmete parandamisele või kustutamisele („õigus olla unustatud")</li>
              <li>Õigus piirata töötlemist ja esitada vastuväiteid</li>
              <li>Õigus võtta nõusolek igal ajal tagasi</li>
              <li>Õigus andmete ülekantavusele</li>
              <li>Õigus esitada kaebus Andmekaitse Inspektsioonile (<a href="https://www.aki.ee" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">aki.ee</a>)</li>
            </ul>

            <p className="text-gray-700 mb-6">
              Päringud ja taotlused võib saata e-posti aadressile:{" "}
              <a href="mailto:vajanguperefarm@gmail.com" className="text-blue-600 hover:text-blue-800 underline">vajanguperefarm@gmail.com</a>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Viimati uuendatud: {new Date().toLocaleDateString('et-EE')}
            </p>
            <div className="text-center">
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
    </div>
  );
}

