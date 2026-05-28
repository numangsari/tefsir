import { signOut } from "next-auth/react";

/** Oturumu tamamen kapatır; geri tuşuyla önbelleğe düşmeyi azaltır */
export async function signOutCompletely() {
  await signOut({ redirect: false });
  if (typeof window !== "undefined") {
    window.location.replace("/");
  }
}
