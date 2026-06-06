/**
 * Sayfaya schema.org JSON-LD yapısal verisi gömer (arama motorları için).
 * Sunucu bileşeni; herhangi bir server component içinde render edilebilir.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // İçerik geliştirici tarafından üretilir (kullanıcı girdisi değil)
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
