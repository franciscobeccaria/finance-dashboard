"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";

export function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <Button disabled>Cargando...</Button>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">
          Hola, {session.user?.email}
        </span>
        <Button variant="outline" onClick={() => signOut()}>
          Cerrar Sesión
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => signIn("google")}>
      Iniciar Sesión con Google
    </Button>
  );
}