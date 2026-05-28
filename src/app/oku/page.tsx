import { redirect } from "next/navigation";

export default function OkuRoot() {
  // Varsayılan olarak Fatiha 1'e yönlendir
  redirect("/oku/1/1");
}
