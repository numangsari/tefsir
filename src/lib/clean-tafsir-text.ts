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

  // Parantezli "(6)", süslü/Arapça parantezli "﴾ 6 ﴿" (neredeyse kesin ayet işareti)
  // veya tam olarak ayet numarasına eşit çıplak sayı atılır; rastgele sayılar korunur.
  const sep = "[\\s.\\u00B7\\u2022\\-\\u2013\\u2014]*";
  // ﴾ ﴾  ﴿ ﴿  (ayrıca ASCII süslü {6} de yakalanır)
  const num =
    "(\\(\\s*\\d{1,3}\\s*\\)|\\uFD3E\\s*\\d{1,3}\\s*\\uFD3F|\\{\\s*\\d{1,3}\\s*\\}|\\d{1,3})";

  // İşaretli (parantez/süslü/Arapça parantez) ise her zaman, çıplaksa yalnızca
  // ayet numarasına eşitse atılır.
  const isBracketed = (token: string) => /[(){}﴾﴿]/.test(token);
  const numValue = (token: string) =>
    parseInt(token.replace(/[(){}﴾﴿\s]/g, ""), 10);

  const lead = t.match(new RegExp("^" + sep + num + sep));
  if (lead) {
    const token = lead[1];
    if (isBracketed(token) || numValue(token) === ayahNo) {
      trimStart = lead[0].length;
      t = t.slice(trimStart);
    }
  }

  const tail = t.match(new RegExp(sep + num + sep + "$"));
  if (tail) {
    const token = tail[1];
    if (isBracketed(token) || numValue(token) === ayahNo) {
      t = t.slice(0, t.length - tail[0].length);
    }
  }

  return { text: t, trimStart };
}
