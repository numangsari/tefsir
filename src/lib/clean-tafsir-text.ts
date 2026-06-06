/**
 * Bazı tefsir metinlerinin başında ve/veya sonunda ayet numarası işareti bulunur
 * (ör. "(6)" veya "6"). Bunlar okuyucuya gürültü oluşturuyor; metnin görünen
 * halinden temizlenir.
 *
 * Vurgu/not offset'leri DB'de ham (temizlenmemiş) metne göre saklanır. Bu yüzden
 * baştan ne kadar karakter atıldığını (`trimStart`) da döndürürüz: API bu değere
 * göre mevcut vurgu/notları temiz metne hizalar, istemci de yeni eklenenleri ham
 * koordinata geri çevirir.
 */
export function cleanTafsirText(
  text: string,
  ayahNo: number
): { text: string; trimStart: number } {
  let t = text;
  let trimStart = 0;

  // Yalnızca parantezli sayı "(6)" (neredeyse kesin ayet işareti) veya tam olarak
  // ayet numarasına eşit çıplak sayı atılır; rastgele sayılar korunur.
  const sep = "[\\s.\\u00B7\\u2022\\-\\u2013\\u2014]*";
  const num = "(\\(\\d{1,3}\\)|\\d{1,3})";

  const lead = t.match(new RegExp("^" + sep + num + sep));
  if (lead) {
    const token = lead[1];
    const value = parseInt(token.replace(/[()]/g, ""), 10);
    if (token.startsWith("(") || value === ayahNo) {
      trimStart = lead[0].length;
      t = t.slice(trimStart);
    }
  }

  const tail = t.match(new RegExp(sep + num + sep + "$"));
  if (tail) {
    const token = tail[1];
    const value = parseInt(token.replace(/[()]/g, ""), 10);
    if (token.startsWith("(") || value === ayahNo) {
      t = t.slice(0, t.length - tail[0].length);
    }
  }

  return { text: t, trimStart };
}
